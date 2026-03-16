"""Label field extraction service."""

import base64
from typing import NamedTuple

import instructor
from openai.types.chat import (
    ChatCompletion,
    ChatCompletionContentPartImageParam,
    ChatCompletionContentPartParam,
    ChatCompletionContentPartTextParam,
    ChatCompletionUserMessageParam,
)
from pydantic import BaseModel, validate_call

from app.config import settings

MAX_IMAGES_PER_REQUEST = 10
MAX_COMPLETION_TOKENS = 2500
MAX_RETRIES = 1
REQUEST_TIMEOUT_SECONDS = 30


class ImageData(NamedTuple):
    """Image data with bytes and content type."""

    bytes: bytes
    content_type: str


def to_data_uri(image_data: ImageData) -> str:
    """Convert image data to base64 data URI."""
    base64_data = base64.b64encode(image_data.bytes).decode("utf-8")
    return f"data:{image_data.content_type};base64,{base64_data}"


@validate_call(config={"arbitrary_types_allowed": True})
async def extract_fields_from_images[T: BaseModel](
    images: list[ImageData],
    model: type[T],
    prompt: str,
    instructor: instructor.AsyncInstructor,
) -> tuple[T, ChatCompletion | None]:
    """Extract field values from label images using AI.

    Returns a tuple of (parsed_response, raw_completion).
    The completion is None when no images are provided.
    """
    if not images:
        return model.model_validate({}), None
    if len(images) > MAX_IMAGES_PER_REQUEST:
        raise ValueError(f"Maximum {MAX_IMAGES_PER_REQUEST} images per request")
    data_uris = [to_data_uri(img) for img in images]
    content: list[ChatCompletionContentPartParam] = [
        ChatCompletionContentPartTextParam(type="text", text=prompt)
    ]
    content += [
        ChatCompletionContentPartImageParam(type="image_url", image_url={"url": u})
        for u in data_uris
    ]
    message: ChatCompletionUserMessageParam = {"role": "user", "content": content}
    response, completion = await instructor.chat.completions.create_with_completion(
        model=settings.AZURE_OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant for extracting information from fertilizer label images.",
            },
            message,
        ],
        response_model=model,
        max_completion_tokens=MAX_COMPLETION_TOKENS,
        max_retries=MAX_RETRIES,
        timeout=REQUEST_TIMEOUT_SECONDS,
        temperature=0.0,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
    )
    return response, completion
