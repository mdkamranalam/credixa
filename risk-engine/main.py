from fastapi import FastAPI, File, UploadFile, HTTPException
import pdfplumber
import joblib
import numpy as np
import io
import re

# Initialize the API
app = FastAPI(title="Credixa Risk Engine", version="1.0")

# Load the trained ML model globally when the server starts
try:
    rf_model = joblib.load("risk_model.pkl")
    print("AI Model Loaded Successfully")
except Exception as e:
    print(f"Error loading model: {e}")

def extract_financial_features(pdf_bytes: bytes):
    """
    Parses the PDF and extracts behavioral features.
    """
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    
    text_upper = text.upper()
    
    # 1. Flag risky behavioral keywords
    gambling_keywords = ["GAMBLING", "CASINO", "BETTING", "POKER", "LOTTERY", "DREAM11", "BET365", "MY11CIRCLE"]
    gambling_flags = sum(text_upper.count(keyword) for keyword in gambling_keywords)
    
    # 2. Count overdrafts
    overdrafts = text_upper.count("OVERDRAFT") + text_upper.count("NSF FEE")
    
    # 3. Extract Average Balance (fallback to 5000 if not explicitly found for this MVP)
    avg_balance = 5000.0
    balance_match = re.search(r"AVERAGE BALANCE[:\s]*\$?([\d,]+\.?\d*)", text_upper)
    if balance_match:
        try:
            avg_balance = float(balance_match.group(1).replace(",", ""))
        except ValueError:
            pass
    
    return avg_balance, overdrafts, gambling_flags

# Main API endpoint to analyze the bank statement
# Main API endpoint to analyze the bank statements
@app.post("/analyze-statement")
async def analyze_statement(student_file: UploadFile = File(...), parent_file: UploadFile = File(...)):
    """
    The main scoring endpoint that analyzes both Student and Parent PDFs
    """
    # 1. Validate BOTH files are PDFs
    if student_file.content_type != "application/pdf" or parent_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload PDFs only.")
    
    try:
        # 2. Read both files into memory
        student_bytes = await student_file.read()
        parent_bytes = await parent_file.read()
        
        # 3. Extract the features from BOTH statements
        s_avg_balance, s_overdrafts, s_gambling = extract_financial_features(student_bytes)
        p_avg_balance, p_overdrafts, p_gambling = extract_financial_features(parent_bytes)
        
        # 4. Combine the features for the Household Risk ML Model
        # (Average the balance, but add the risk flags together!)
        combined_balance = (s_avg_balance + p_avg_balance) / 2
        total_overdrafts = s_overdrafts + p_overdrafts
        total_gambling = s_gambling + p_gambling
        
        # 5. Format data for the Random Forest model
        features = np.array([[combined_balance, total_overdrafts, total_gambling]])
        
        # 6. Run Inference
        prediction = rf_model.predict(features)[0]
        probabilities = rf_model.predict_proba(features)[0]
        
        # The probability of class '1' (APPROVED) becomes our omniscore (0-100)
        omniscore = round(probabilities[1] * 100, 2)
        decision = "APPROVED" if prediction == 1 else "REJECTED"
        
        return {
            "omniscore": omniscore,
            "decision": decision,
            "extracted_metrics": {
                "combined_average_balance": combined_balance,
                "total_overdrafts": total_overdrafts,
                "total_gambling_flags": total_gambling
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing statement: {str(e)}")
    
# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "Risk Engine is online", "model_loaded": rf_model is not None}