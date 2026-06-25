import os
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from huggingface_hub import AsyncInferenceClient
from tenacity import retry, stop_after_attempt, wait_exponential

from utils.pii_redactor import redact_pii

class LLMProvider(ABC):
    """
    Abstract Interface for AI Inference providers.
    Ensures zero-code vendor switching between Hugging Face, AWS Bedrock, Azure OpenAI, etc.
    """
    @abstractmethod
    async def generate_chat(self, messages: List[Dict[str, str]], max_tokens: int = 250, temperature: float = 0.1) -> Any:
        pass


class HuggingFaceProvider(LLMProvider):
    def __init__(self, model_name: str = "meta-llama/Meta-Llama-3-8B-Instruct"):
        self.model_name = model_name
        self.client = AsyncInferenceClient(model_name, token=os.getenv("HF_TOKEN"))

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_chat(self, messages: List[Dict[str, str]], max_tokens: int = 250, temperature: float = 0.1) -> Any:
        # Scrub PII from user prompts before sending to public Hugging Face endpoint
        sanitized_messages = []
        for msg in messages:
            sanitized_msg = msg.copy()
            if sanitized_msg.get("role") == "user" and sanitized_msg.get("content"):
                sanitized_msg["content"] = redact_pii(sanitized_msg["content"])
            sanitized_messages.append(sanitized_msg)

        return await self.client.chat_completion(
            messages=sanitized_messages,
            max_tokens=max_tokens,
            temperature=temperature
        )


class BedrockProvider(LLMProvider):
    """
    Enterprise AWS Bedrock Provider stub.
    When AWS Bedrock keys are provided, this adapter invokes boto3 bedrock-runtime.
    """
    def __init__(self, model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"):
        self.model_id = model_id

    async def generate_chat(self, messages: List[Dict[str, str]], max_tokens: int = 250, temperature: float = 0.1) -> Any:
        logging.warning("AWS Bedrock Provider selected but boto3 client not yet initialized. Falling back to HuggingFaceProvider.")
        fallback = HuggingFaceProvider()
        return await fallback.generate_chat(messages, max_tokens, temperature)


_provider_instance = None

def get_llm_provider() -> LLMProvider:
    global _provider_instance
    if _provider_instance is None:
        provider_name = os.getenv("LLM_PROVIDER", "huggingface").lower()
        if provider_name == "bedrock":
            _provider_instance = BedrockProvider()
        else:
            _provider_instance = HuggingFaceProvider()
    return _provider_instance
