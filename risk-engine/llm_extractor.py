import os
import json
import re
from pydantic import BaseModel, Field
from huggingface_hub import AsyncInferenceClient
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential

# Initialize Hugging Face Inference API client
# Uses a powerful free model. Optionally set HF_TOKEN in your environment.
client = AsyncInferenceClient("meta-llama/Meta-Llama-3-8B-Instruct")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def _call_hf_api(messages, max_tokens=250, temperature=0.1):
    return await client.chat_completion(
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature
    )

class FinancialExtraction(BaseModel):
    average_balance: float = Field(default=5000.0)
    overdraft_count: int = Field(default=0)
    high_risk_transaction_count: int = Field(default=0)
    monthly_income: float = Field(default=0.0)
    monthly_debt_payments: float = Field(default=0.0)
    monthly_savings: float = Field(default=0.0)

def fallback_financial_extraction(text: str) -> FinancialExtraction:
    """Robust regex-based fallback if the HF free API is rate-limited."""
    text_upper = text.upper()
    
    avg_balance = 5000.0
    balance_match = re.search(r"(?:AVERAGE\s*BALANCE|CLOSING\s*BALANCE|AVAILABLE\s*BALANCE)[:\s]*\$?(?:RS\.?)?\s*([\d,]+\.?\d*)", text_upper)
    if balance_match:
        try: avg_balance = float(balance_match.group(1).replace(",", ""))
        except ValueError: pass
        
    income = 3000.0
    income_match = re.search(r"(?:SALARY|INCOME|TOTAL\s*CREDIT)[:\s]*\$?(?:RS\.?)?\s*([\d,]+\.?\d*)", text_upper)
    if income_match:
        try: income = float(income_match.group(1).replace(",", ""))
        except ValueError: pass
        
    overdrafts = text_upper.count("OVERDRAFT") + text_upper.count("NSF FEE") + text_upper.count("BOUNCE")
    gambling_keywords = ["GAMBLING", "CASINO", "BETTING", "POKER", "LOTTERY", "DREAM11", "BET365", "MY11CIRCLE"]
    gambling_flags = sum(text_upper.count(kw) for kw in gambling_keywords)
    
    return FinancialExtraction(
        average_balance=avg_balance,
        overdraft_count=overdrafts,
        high_risk_transaction_count=gambling_flags,
        monthly_income=income, # Estimate based on found income
        monthly_debt_payments=income * 0.15,
        monthly_savings=income * 0.20
    )

async def extract_financial_data_with_llm(text: str) -> FinancialExtraction:
    """
    Uses a free Hugging Face LLM to parse raw bank statement text.
    """
    if not text or len(text.strip()) < 50:
        return FinancialExtraction()
        
    try:
        completion = await _call_hf_api(
            messages=[
                {
                    "role": "system",
                    "content": "You are a financial AI. Output ONLY valid JSON containing these exact keys: 'average_balance' (float), 'overdraft_count' (int), 'high_risk_transaction_count' (int), 'monthly_income' (float), 'monthly_debt_payments' (float), 'monthly_savings' (float)."
                },
                {
                    "role": "user",
                    "content": f"Extract financial data from this text:\n\n{text[:3000]}"
                }
            ],
            max_tokens=250,
            temperature=0.1
        )
        
        result_str = completion.choices[0].message.content
        # In case the model adds backticks like ```json ... ```
        if "```json" in result_str:
            result_str = result_str.split("```json")[1].split("```")[0]
        elif "```" in result_str:
            result_str = result_str.split("```")[1].split("```")[0]
            
        data_dict = json.loads(result_str.strip())
        return FinancialExtraction(**data_dict)
    except Exception as e:
        print(f"Hugging Face Extraction failed: {e}. Using local Regex fallback.")
        return fallback_financial_extraction(text)

async def validate_document_with_llm(text: str, expected_doc_type: str, expected_name: Optional[str] = None) -> dict:
    """
    Uses Hugging Face LLM to validate documents.
    """
    if not text or len(text.strip()) < 50:
        return {"is_valid": False, "confidence": 0, "structured_details": {}, "reason": "Text too short."}
        
    name_check = f" Also check if the name '{expected_name}' is associated." if expected_name else ""
    
    try:
        completion = await _call_hf_api(
            messages=[
                {
                    "role": "system",
                    "content": f"Verify if the text belongs to a {expected_doc_type} document.{name_check} Output ONLY JSON with keys: 'is_valid' (boolean), 'confidence' (int 0-100), 'structured_details' (object with 2 key-value string pairs), 'reason' (short string)."
                },
                {
                    "role": "user",
                    "content": f"Verify this text:\n\n{text[:2500]}"
                }
            ],
            max_tokens=300,
            temperature=0.1
        )
        
        result_str = completion.choices[0].message.content
        if "```json" in result_str:
            result_str = result_str.split("```json")[1].split("```")[0]
        elif "```" in result_str:
            result_str = result_str.split("```")[1].split("```")[0]
            
        return json.loads(result_str.strip())
    except Exception as e:
        print(f"Hugging Face Validation failed: {e}")
        doc_type_upper = expected_doc_type.upper()
        text_upper = text.upper()
        is_valid = True
        
        if "STATEMENT" in doc_type_upper:
            is_valid = "BALANCE" in text_upper or "ACCOUNT" in text_upper or "TRANSACTION" in text_upper
        elif "ADMISSION" in doc_type_upper:
            is_valid = "UNIVERSITY" in text_upper or "COLLEGE" in text_upper or "ADMISSION" in text_upper
        elif "MARKSHEET" in doc_type_upper:
            is_valid = "MARKS" in text_upper or "GRADE" in text_upper or "BOARD" in text_upper or "UNIVERSITY" in text_upper
        elif "FEE" in doc_type_upper:
            is_valid = "FEE" in text_upper or "TUITION" in text_upper or "PAYMENT" in text_upper
            
        return {"is_valid": is_valid, "confidence": 50, "structured_details": {}, "reason": "Used local fallback validation."}

async def generate_dynamic_reasoning(omniscore: float, metrics: dict) -> dict:
    """
    Uses the LLM to generate a dynamic, professional explanation for the risk score, including pros and cons.
    """
    try:
        completion = await _call_hf_api(
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior credit underwriter AI. Output ONLY valid JSON with keys: 'reasoning' (string), 'pros' (list of 2 strings), 'cons' (list of 2 strings)."
                },
                {
                    "role": "user",
                    "content": f"The ML model assigned this applicant a risk score of {omniscore} (0-100, >70 is Approved, <40 is Rejected). Based on these metrics: {json.dumps(metrics)}, write a short professional paragraph explaining the decision. Then list exactly 2 pros and 2 cons."
                }
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        result_str = completion.choices[0].message.content
        if "```json" in result_str:
            result_str = result_str.split("```json")[1].split("```")[0]
        elif "```" in result_str:
            result_str = result_str.split("```")[1].split("```")[0]
            
        data = json.loads(result_str.strip())
        if "reasoning" not in data or "pros" not in data or "cons" not in data:
            raise ValueError("LLM returned incomplete JSON keys")
        return data
    except Exception as e:
        print(f"Dynamic Reasoning Generation failed: {e}")
        decision = "Approved" if omniscore >= 50 else "Rejected"
        return {
            "reasoning": f"The model {decision} the application with a score of {omniscore} based on standard thresholds.",
            "pros": ["Sufficient balance metrics detected."] if omniscore >= 50 else ["Model evaluated basic features."],
            "cons": ["Review overall liquidity and debt ratio."] if omniscore < 50 else ["Verify consistent income."]
        }
