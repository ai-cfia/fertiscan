"""Instructor dependency for structured extraction."""

from functools import lru_cache
from typing import Annotated

import instructor
from fastapi import Depends, HTTPException
from openai import AsyncAzureOpenAI

from app.config import settings


@lru_cache(maxsize=1)
def get_instructor() -> instructor.AsyncInstructor:
    """Get async instructor for structured extraction (cached, reused across requests)."""
    if not settings.AZURE_OPENAI_ENDPOINT or not settings.AZURE_OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Azure OpenAI not configured",
        )
    azure_client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY.get_secret_value(),
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    )
    return instructor.from_openai(azure_client)


InstructorDep = Annotated[instructor.AsyncInstructor, Depends(get_instructor)]
