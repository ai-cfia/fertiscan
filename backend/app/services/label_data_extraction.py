"""Label field extraction service."""

import base64
from typing import NamedTuple

import instructor
from openai.types.chat import (
    ChatCompletionContentPartImageParam,
    ChatCompletionContentPartParam,
    ChatCompletionContentPartTextParam,
    ChatCompletionUserMessageParam,
)
from pydantic import BaseModel, validate_call

from app.config import settings


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
) -> T:
    """Extract field values from label images using AI."""
    if not images:
        return model.model_validate({})
    if len(images) > 10:
        raise ValueError("Maximum 10 images per request")
    data_uris = [to_data_uri(img) for img in images]
    content: list[ChatCompletionContentPartParam] = [
        ChatCompletionContentPartTextParam(type="text", text=prompt)
    ]
    content += [
        ChatCompletionContentPartImageParam(type="image_url", image_url={"url": u})
        for u in data_uris
    ]
    message: ChatCompletionUserMessageParam = {"role": "user", "content": content}
    response, _ = await instructor.chat.completions.create_with_completion(
        model=settings.AZURE_OPENAI_MODEL,
        messages=[message],
        response_model=model,
        max_completion_tokens=4000,
    )
    return response
