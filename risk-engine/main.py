from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query, Header, Depends
import pdfplumber
import joblib
import numpy as np
import io
import re
import asyncio
import os
import pytesseract
from pdf2image import convert_from_bytes
import shap
import pandas as pd
import hashlib
import json
import redis.asyncio as redis
from llm_extractor import extract_financial_data_with_llm, validate_document_with_llm, generate_dynamic_reasoning, FinancialExtraction

# Initialize Redis client
try:
    redis_url = os.getenv("REDIS_URL", "redis://credixa-redis:6379/1")
    redis_client = redis.from_url(redis_url, decode_responses=True)
except Exception as e:
    print(f"Failed to connect to Redis: {e}")
    redis_client = None

# Initialize the API
app = FastAPI(title="Credixa Risk Engine (AI Overhauled)", version="2.0")

API_KEY = os.getenv("RISK_ENGINE_API_KEY", "credixa_internal_engine_key_2026")

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

# Load the trained ML model and scaler globally
try:
    xgb_model = joblib.load("risk_model.pkl")
    scaler = joblib.load("scaler.pkl")
    print("AI Model and Scaler Loaded Successfully")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to load ML assets: {e}")
    # In production, we might want to fail startup if models aren't found.
    xgb_model, scaler = None, None

def _extract_text_sync(pdf_bytes: bytes, use_ocr: bool = False, max_pages: int = 5) -> str:
    """Synchronous function to extract text from PDF, designed to be run in a thread pool."""
    text = ""
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages[:max_pages]:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Native PDF extraction failed: {e}")
            
    if not text.strip() or len(text.strip()) < 50 or use_ocr:
        try:
            print("Falling back to OCR...")
            images = convert_from_bytes(pdf_bytes)
            for image in images[:max_pages]:
                text += pytesseract.image_to_string(image) + "\n"
        except Exception as e:
            print(f"OCR Failed: {e}")
            
    return text

@app.post("/analyze-statement", dependencies=[Depends(verify_api_key)])
async def analyze_statement(
    student_file: UploadFile = File(...), 
    parent_file: UploadFile = File(...),
    academic_score: float = Query(7.0),
    use_ocr: bool = Query(False)
):
    """
    The main scoring endpoint that analyzes both Student and Parent PDFs using LLMs and Explainable AI
    """
    if xgb_model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Risk models are not loaded. Cannot process request.")

    if student_file.content_type != "application/pdf" or parent_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload PDFs only.")
    
    try:
        # 1. Read files into memory
        student_bytes = await student_file.read()
        parent_bytes = await parent_file.read()
        
        # 2. Extract text in background threads so we don't block the async event loop
        s_text = await asyncio.to_thread(_extract_text_sync, student_bytes, use_ocr, 10)
        p_text = await asyncio.to_thread(_extract_text_sync, parent_bytes, use_ocr, 10)
        
        # 3. Use LLM to intelligently extract structured financial data (with Redis caching)
        async def get_cached_extraction(text: str, doc_name: str) -> FinancialExtraction:
            if not redis_client:
                return await extract_financial_data_with_llm(text)
                
            text_hash = hashlib.sha256(text.encode()).hexdigest()
            cache_key = f"risk:extraction:{text_hash}"
            
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    print(f"Cache Hit for {doc_name} extraction!")
                    return FinancialExtraction(**json.loads(cached))
            except Exception as e:
                print(f"Redis get failed: {e}")
                
            print(f"Cache Miss for {doc_name} extraction. Running LLM...")
            result = await extract_financial_data_with_llm(text)
            
            try:
                if redis_client:
                    # Cache the result for 24 hours
                    await redis_client.setex(cache_key, 86400, result.model_dump_json())
            except Exception as e:
                print(f"Redis set failed: {e}")
                
            return result
            
        s_data = await get_cached_extraction(s_text, "student")
        p_data = await get_cached_extraction(p_text, "parent")
        
        # 4. Combine the features for the Household Risk ML Model
        combined_balance = (s_data.average_balance + p_data.average_balance) / 2
        total_overdrafts = s_data.overdraft_count + p_data.overdraft_count
        total_gambling = s_data.high_risk_transaction_count + p_data.high_risk_transaction_count
        
        combined_income = s_data.monthly_income + p_data.monthly_income
        combined_debt = s_data.monthly_debt_payments + p_data.monthly_debt_payments
        combined_savings = s_data.monthly_savings + p_data.monthly_savings
        
        # Calculate derived features
        dti_ratio = combined_debt / (combined_income + 1e-5) if combined_income > 0 else 0.5 # default moderate risk if unknown
        dti_ratio = min(dti_ratio, 1.0)
        savings_rate = combined_savings / (combined_income + 1e-5) if combined_income > 0 else 0.0
        savings_rate = min(savings_rate, 1.0)
        
        # 5. Format data and SCALE it properly before inference
        feature_names = ["avg_balance", "overdrafts", "gambling_flags", "academic_score", "dti_ratio", "savings_rate"]
        features_raw = pd.DataFrame(
            [[combined_balance, total_overdrafts, total_gambling, academic_score, dti_ratio, savings_rate]], 
            columns=feature_names
        )
        
        # Apply scaling
        features_scaled = scaler.transform(features_raw)
        
        # 6. Run Inference
        prediction = xgb_model.predict(features_scaled)[0]
        probabilities = xgb_model.predict_proba(features_scaled)[0]
        
        omniscore = float(round(probabilities[1] * 100, 2))
        decision = "APPROVED" if prediction == 1 else "REJECTED"

        # 7. Generate Explainable AI Reasoning (SHAP + LLM)
        # Using LLM for dynamic, human-readable reasoning based on metrics and score
        
        metrics_for_llm = {
            "combined_average_balance": combined_balance,
            "combined_monthly_income": combined_income,
            "dti_ratio": round(dti_ratio, 2),
            "savings_rate": round(savings_rate, 2),
            "total_overdrafts": total_overdrafts,
            "total_gambling_flags": total_gambling,
            "academic_score": academic_score
        }
        
        dynamic_reasoning_data = await generate_dynamic_reasoning(omniscore, metrics_for_llm)

        return {
            "omniscore": omniscore,
            "decision": decision,
            "reasoning": dynamic_reasoning_data["reasoning"],
            "analysis_highlights": {
                "pros": dynamic_reasoning_data["pros"],
                "cons": dynamic_reasoning_data["cons"]
            },
            "extracted_metrics": metrics_for_llm
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing statement: {str(e)}")

@app.post("/validate-document", dependencies=[Depends(verify_api_key)])
async def validate_document(
    doc_type: str = Form(...),
    expected_name: str = Query(None),
    use_ocr: bool = Query(False),
    file: UploadFile = File(...)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDFs are allowed")
        
    try:
        pdf_bytes = await file.read()
        
        # Offload extraction to thread
        text = await asyncio.to_thread(_extract_text_sync, pdf_bytes, use_ocr, 3)
        
        # Offload validation to LLM
        validation_result = await validate_document_with_llm(text, doc_type, expected_name)
        
        if not validation_result.get("is_valid", False):
            return {
                "valid": False, 
                "extracted_text": None, 
                "structured_details": validation_result.get("structured_details", {}),
                "message": validation_result.get("reason", "Document validation failed.")
            }
            
        return {
            "valid": True,
            "extracted_text": text[:300] + ("..." if len(text) > 300 else ""),
            "structured_details": validation_result.get("structured_details", {}),
            "llm_reasoning": validation_result.get("reason", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating document: {str(e)}")
    
# Health check endpoint
@app.get("/health")
def health_check():
    models_ready = all(v is not None for v in [xgb_model, scaler])
    return {
        "status": "Risk Engine is online", 
        "models_ready": models_ready,
        "ai_enabled": True
    }