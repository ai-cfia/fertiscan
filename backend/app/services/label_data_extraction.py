"""Label field extraction service."""

import base64
from io import BytesIO
from typing import NamedTuple

import instructor
from openai.types.chat import (
    ChatCompletion,
    ChatCompletionContentPartImageParam,
    ChatCompletionContentPartParam,
    ChatCompletionContentPartTextParam,
    ChatCompletionUserMessageParam,
)
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, validate_call

from app.config import settings

MAX_IMAGE_DIMENSION = 1600
JPEG_QUALITY = 80


class ImageData(NamedTuple):
    """Image data with bytes and content type."""

    bytes: bytes
    content_type: str


def optimize_image(image_data: ImageData) -> ImageData:
    """Downscale and recompress images before sending them to the model."""
    try:
        with Image.open(BytesIO(image_data.bytes)) as source_image:
            image = source_image.copy()
    except (UnidentifiedImageError, OSError):
        return image_data

    if image.mode not in ("RGB", "L"):
        background = Image.new("RGB", image.size, "white")
        alpha = image.getchannel("A") if "A" in image.getbands() else None
        background.paste(image.convert("RGB"), mask=alpha)
        image = background
    elif image.mode == "L":
        image = image.convert("RGB")

    image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION))

    output = BytesIO()
    image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    optimized_bytes = output.getvalue()

    if len(optimized_bytes) >= len(image_data.bytes):
        return image_data

    return ImageData(bytes=optimized_bytes, content_type="image/jpeg")


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
    if len(images) > 10:
        raise ValueError("Maximum 10 images per request")
    data_uris = [to_data_uri(optimize_image(img)) for img in images]
    content: list[ChatCompletionContentPartParam] = [
        ChatCompletionContentPartTextParam(type="text", text=prompt)
    ]
    content += [
        ChatCompletionContentPartImageParam(
            type="image_url",
            image_url={"url": u, "detail": settings.AZURE_OPENAI_IMAGE_DETAIL},
        )
        for u in data_uris
    ]
    message: ChatCompletionUserMessageParam = {"role": "user", "content": content}
    response, completion = await instructor.chat.completions.create_with_completion(
        model=settings.AZURE_OPENAI_MODEL,
        messages=[message],
        response_model=model,
        max_completion_tokens=4000,
        temperature=0.0,
        top_p=1.0,
        timeout=30,
    )
    return response, completion
