import io
from PIL import Image

from pipeline import analyze, Settings
from app.models.label_data import LabelData

def extract_data(files: list[bytes], settings: Settings):
    """ Extract and analyze data from image files.
    Args:
        files: List of bytes representing image file data.
        settings: Settings object containing parameters required by the pipeline.

    Returns:
        LabelData object containing analyzed data.

    Raises:
        ValueError: If no files are provided.
    """
    if not files:
        raise ValueError("No files to analyze")

    # TODO: Validate file types if necessary

    images = []
    for file in files:
        images.append(Image.open(io.BytesIO(file)))

    data = analyze(images, settings)

    return LabelData.model_validate(data.model_dump())
