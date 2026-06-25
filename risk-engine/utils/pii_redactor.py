import re

def redact_pii(text: str) -> str:
    """
    Scrubs Personally Identifiable Information (PII) from raw OCR / document text
    before sending prompt context to third-party AI inference endpoints.
    Ensures DPDP Act / GDPR financial compliance.
    """
    if not text:
        return text

    # 1. Redact Indian PAN (Permanent Account Number): 5 letters, 4 digits, 1 letter
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', '[REDACTED_PAN]', text)

    # 2. Redact Indian Aadhaar Numbers (12 digits, optional space or dash every 4 digits)
    # Be careful not to match random timestamps or decimals
    text = re.sub(r'\b(?:\d{4}[\s-]\d{4}[\s-]\d{4}|\d{12})\b', '[REDACTED_AADHAAR]', text)

    # 3. Redact Indian Mobile Numbers (+91 or 0 followed by 10 digits starting with 6-9)
    text = re.sub(r'(?:(?:\+91|0)[\s-]?)?[6-9]\d{9}\b', '[REDACTED_MOBILE]', text)

    # 4. Redact Bank Account Numbers following common labels (A/C, Account, Acc No)
    text = re.sub(
        r'(?i)(?:A/C|ACCOUNT|ACC|ACR)(?:\s*NO|.\s*NUM)?[:\s#-]*([0-9]{8,18})',
        r'ACCOUNT NO: [REDACTED_ACCOUNT]',
        text
    )

    return text
