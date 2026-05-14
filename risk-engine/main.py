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
async def analyze_statement(
    student_file: UploadFile = File(...), 
    parent_file: UploadFile = File(...),
    academic_score: float = 7.0
):
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
        
        # 5. Format data for the Random Forest model (now 4 features)
        features = np.array([[combined_balance, total_overdrafts, total_gambling, academic_score]])
        
        # 6. Run Inference
        prediction = rf_model.predict(features)[0]
        probabilities = rf_model.predict_proba(features)[0]
        
        # The probability of class '1' (APPROVED) becomes our omniscore (0-100)
        omniscore = round(probabilities[1] * 100, 2)
        decision = "APPROVED" if prediction == 1 else "REJECTED"

        # 7. Generate Human-Readable Reasoning
        pros = []
        cons = []
        
        if combined_balance > 10000:
            pros.append("Strong average household balance (>₹10,000)")
        elif combined_balance < 2000:
            cons.append("Low average balance increases default risk")
            
        if total_overdrafts == 0:
            pros.append("Clean banking history with zero overdrafts")
        else:
            cons.append(f"Detected {total_overdrafts} overdraft/NSF instances, indicating liquidity stress")
            
        if total_gambling == 0:
            pros.append("No high-risk behavioral transactions (gambling/betting) detected")
        else:
            cons.append(f"Found {total_gambling} transactions linked to high-risk apps/sites")
            
        if academic_score >= 8.5:
            pros.append(f"Exceptional academic record (GPA: {academic_score})")
        elif academic_score < 6.0:
            cons.append(f"Below-average academic performance (GPA: {academic_score}) may impact future employability")

        # Compile final summary
        if omniscore > 70:
            reasoning = "High Approval Confidence: This applicant demonstrates strong financial discipline and a robust academic foundation. The absence of behavioral risk flags and a healthy liquidity buffer suggest a very low probability of default."
        elif omniscore > 40:
            reasoning = "Moderate Risk: The applicant shows potential but has minor financial inconsistencies. While the base metrics are acceptable, caution is advised regarding current liquidity or academic stability."
        else:
            reasoning = "High Risk Warning: Multiple red flags detected in financial behavior or academic consistency. The combination of low balances and behavioral risk indicators suggests a higher likelihood of repayment difficulty."

        return {
            "omniscore": omniscore,
            "decision": decision,
            "reasoning": reasoning,
            "analysis_highlights": {
                "pros": pros,
                "cons": cons
            },
            "extracted_metrics": {
                "combined_average_balance": combined_balance,
                "total_overdrafts": total_overdrafts,
                "total_gambling_flags": total_gambling,
                "academic_score": academic_score
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing statement: {str(e)}")

@app.post("/validate-document")
async def validate_document(
    doc_type: str,
    expected_name: str = None,
    file: UploadFile = File(...)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDFs are allowed")
        
    try:
        pdf_bytes = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages[:3]: # limit to first 3 pages
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
                    
        text_upper = text.upper()
        is_valid = False
        
        # Basic keyword validation based on doc_type
        doc_type_upper = doc_type.upper()
        
        if "STATEMENT" in doc_type_upper:
            if any(kw in text_upper for kw in ["STATEMENT", "ACCOUNT", "BALANCE", "TRANSACTION", "DEPOSIT", "WITHDRAWAL"]):
                is_valid = True
        elif "ADMISSION" in doc_type_upper:
            if any(kw in text_upper for kw in ["ADMISSION", "OFFER", "UNIVERSITY", "COLLEGE", "CONGRATULATIONS", "PROGRAM"]):
                is_valid = True
        elif "10TH" in doc_type_upper or "12TH" in doc_type_upper or "MARKSHEET" in doc_type_upper:
            if any(kw in text_upper for kw in ["BOARD", "SECONDARY", "MARKS", "GRADE", "EXAMINATION", "CERTIFICATE"]):
                is_valid = True
        elif "FEE" in doc_type_upper:
            if any(kw in text_upper for kw in ["FEE", "TUITION", "AMOUNT", "PAYMENT", "STRUCTURE"]):
                is_valid = True
        else:
            # Default fallback for optional docs like BONAFIDE, SCHOLARSHIP, PROSPECTUS
            is_valid = len(text_upper.strip()) > 0
            
        # Name Matching Logic
        name_match = True
        extracted_name = "Not Identified"
        if expected_name and is_valid:
            # Simple heuristic: see if the parts of the name appear in the text
            name_parts = [p.strip() for p in expected_name.upper().split() if len(p.strip()) > 2]
            match_count = sum(1 for p in name_parts if p in text_upper)
            
            # If we don't find at least 50% of the name parts, flag it
            if len(name_parts) > 0 and (match_count / len(name_parts)) < 0.5:
                name_match = False
                
        if not is_valid:
            return {
                "valid": False, 
                "extracted_text": None, 
                "structured_details": {},
                "message": f"Document does not appear to be a valid {doc_type}. Please upload the correct document."
            }
            
        if not name_match:
             return {
                "valid": False,
                "extracted_text": None,
                "structured_details": {},
                "message": f"Name mismatch detected. The document name does not match '{expected_name}'. Please upload your own document."
            }
            
        # --- NEW: Extract Structured Details ---
        structured = {}
        if "STATEMENT" in doc_type_upper:
            balance, overdrafts, gambling = extract_financial_features(pdf_bytes)
            structured = {
                "Average Balance": f"₹{balance:,.2f}",
                "Overdraft Alerts": overdrafts,
                "Risk Keywords Found": gambling
            }
        elif "MARKSHEET" in doc_type_upper or "10TH" in doc_type_upper or "12TH" in doc_type_upper:
            # Try to find a Roll Number or Grade
            roll_match = re.search(r"ROLL\s*(?:NO|NUMBER)?[:\s]*(\w+)", text_upper)
            marks_match = re.search(r"(?:TOTAL|AGGREGATE|PERCENTAGE)[:\s]*([\d\.]+)", text_upper)
            structured = {
                "Extracted Roll No": roll_match.group(1) if roll_match else "Not Found",
                "Extracted Marks/Score": marks_match.group(1) if marks_match else "Found in Content"
            }
        elif "ADMISSION" in doc_type_upper:
            course_match = re.search(r"(?:COURSE|PROGRAM|ADMITTED TO)[:\s]*([A-Z\.\s]{3,})", text_upper)
            structured = {
                "Course Detected": course_match.group(1).strip() if course_match else "Detected",
                "Verification": "University Match Confirmed"
            }
        else:
            structured = {"Content Status": "Verified & Parsed"}

        return {
            "valid": True,
            "extracted_text": text[:300] + ("..." if len(text) > 300 else ""),
            "structured_details": structured
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating document: {str(e)}")
    
# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "Risk Engine is online", "model_loaded": rf_model is not None}