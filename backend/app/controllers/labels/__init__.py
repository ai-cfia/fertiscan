"""Label controllers."""

from app.controllers.labels import (
    fertilizer_label_data,
    label,
    label_data,
    label_data_extraction,
    label_image,
)
from app.controllers.labels.fertilizer_label_data import (
    create_fertilizer_label_data,
    get_fertilizer_label_data,
    get_fertilizer_label_data_meta,
    update_fertilizer_label_data,
    upsert_fertilizer_label_data_meta,
)
from app.controllers.labels.label import (
    create_label,
    delete_label,
    # evaluate_non_compliance,
    get_label_detail,
    get_labels_query,
    # update_is_compliant,
    update_label,
    update_label_review_status,
)
from app.controllers.labels.label_data import (
    create_label_data,
    get_label_data,
    get_label_data_meta,
    update_label_data,
    upsert_label_data_meta,
)
from app.controllers.labels.label_data_extraction import extract_fertilizer_fields
from app.controllers.labels.label_image import (
    complete_label_image_upload,
    create_label_image,
    delete_label_image,
    get_label_image_presigned_download_url,
    get_label_image_presigned_upload_url,
    get_label_images,
    verify_and_lock_label_image_limit,
)

__all__ = [
    # Modules
    "fertilizer_label_data",
    "label",
    "label_data",
    "label_data_extraction",
    "label_image",
    # Label functions
    "create_label",
    "delete_label",
    # "evaluate_non_compliance",
    "get_label_detail",
    "get_labels_query",
    # "update_is_compliant",
    "update_label",
    "update_label_review_status",
    # LabelImage functions
    "complete_label_image_upload",
    "create_label_image",
    "delete_label_image",
    "get_label_image_presigned_download_url",
    "get_label_image_presigned_upload_url",
    "get_label_images",
    "verify_and_lock_label_image_limit",
    # LabelData functions
    "create_label_data",
    "get_label_data",
    "get_label_data_meta",
    "update_label_data",
    "upsert_label_data_meta",
    # FertilizerLabelData functions
    "create_fertilizer_label_data",
    "get_fertilizer_label_data",
    "get_fertilizer_label_data_meta",
    "update_fertilizer_label_data",
    "upsert_fertilizer_label_data_meta",
    # Extraction functions
    "extract_fertilizer_fields",
]
