# FertiScan Requirements

Notes on what the system needs to do - product management, label scanning, and
review workflows.

## Overview

### What This Covers

Core domain model, database schema, and business logic for:

- Product lifecycle management
- Label scanning and data extraction
- Label review workflows
- Label-product relationship management

### Key Terms

- **Product**: A registered fertilizer product with a unique registration
  number, associated with a product type and creator
- **Product Type**: A category/classification for products (e.g., fertilizer,
  supplement)
- **Label**: A scanned product label containing images and extracted data
- **Extraction**: AI-powered process to extract structured data from label
  images
- **Review**: User review and correction of label data

## User Roles

### Inspector

The main user role - responsible for:

- Managing product records
- Scanning and processing labels
- Reviewing label data

## Functional Requirements

### Product Management

#### User Story

As an inspector, I want to manage products (create, read, update, delete), so
that I can maintain accurate product records.

#### Requirements

- Can create products with required fields:
  - Registration number (unique identifier)
  - Product type (must select from existing product types)
  - Creator (automatically set to current user)
- Optional fields: brand_name_en, brand_name_fr, name_en, name_fr
- Can read/view product details.
- Can update product information.
- Can delete products.
- Each product has exactly one registration number as its unique identifier.
- Each product must be associated with a product type.
- Each product is associated with the user who created it.
- Products can exist without associated labels.
- Product updates do not affect existing labels or their review status.
- When deleting a product with associated labels, prompts user with options:

- Delete product and all associated labels (hard delete, permanent; includes all
  label images)
- Unlink labels (make them standalone) and delete product
- Cancel deletion

### Label Scanning

#### User Stories

- As an inspector, I want to scan a label without requiring a product to exist
  first, so that I can extract data and identify/create the product later.
- As an inspector, I want to scan a label for a pre-selected product, so that I
  can add a new label version to an existing product.

#### Requirements

- Requires at least 1 image to create a label (0 images no longer allowed).
- Requires at least 1 image to initiate extraction.
- Supports on-demand data extraction from label images using an AI pipeline
  (extraction is a user-initiated tool, not a tracked workflow state).
- Stores field values on the label when extraction completes (fields store
  single values, not separate extracted/verified pairs).
- Supports partial extraction results (some fields populated, others remain
  empty).
- Field-level metadata (review flags, notes, AI generation indicators) is
  tracked separately in meta models (LabelDataFieldMeta,
  FertilizerLabelDataMeta).
- Automatically attempts to link labels to existing products by matching
  registration numbers after extraction completes.
- If no product match is found, label remains unlinked (product creation
  deferred until after review).
- Supports linking labels to pre-selected products during scanning workflow.

#### Workflows

The label creation process follows a clear step-by-step workflow:

##### Step 1: Upload Images

- User selects 1 to 5 label images for upload
- User clicks "Upload Files" button
- System creates empty label record first (review_status: not_started)
- System requests presigned upload URLs individually for each file (validates
  files atomically, prevents race conditions)
- System uploads images to storage asynchronously using presigned URLs (with
  progress tracking per file)
- Each file is uploaded individually and linked to the label as it completes
- Label exists even if all uploads fail (can be cleaned up later if needed)
- User can retry failed uploads individually

##### Step 2: Scan/Extract

- User initiates extraction (requires at least 1 image)
- System extracts structured data asynchronously (on-demand operation)
- System stores field values on label when extraction completes

##### Step 3: Review & Product Management

- User reviews and corrects label data
- System attempts to identify existing product by registration number from label
  data (if standalone)
- User completes review and optionally updates/creates product

##### Standalone Label Scanning

1. Create Label: User clicks "Upload Files" button, system creates empty label
   record
2. Upload: System requests presigned URLs individually, user uploads label
   images using presigned URLs (files uploaded individually, linked to label as
   they complete)
3. Scan: User initiates extraction (on-demand operation)
4. Extract: System extracts structured data asynchronously
5. Store: System stores field values on label
6. Link: System attempts to identify existing product by registration number
   from label data:
   - If match found: link label to existing product
   - If no match: label remains unlinked

##### Product-Associated Label Scanning

1. Select Product: User selects/creates a product first
2. Create Label: User clicks "Upload Files" button, system creates empty label
   record linked to product
3. Upload: System requests presigned URLs individually, user uploads label
   images using presigned URLs (files uploaded individually, linked to label as
   they complete)
4. Scan: User initiates extraction (on-demand operation)
5. Extract: System extracts structured data asynchronously
6. Store: System stores field values on label
7. Link: Label remains linked to pre-selected product

### File Upload

#### User Story

As an inspector, I want to upload label images, so that I can create a new label
and prepare it for extraction.

#### Requirements

- Can upload 1 to 5 images per label.
- Supports drag-and-drop file upload.
- Supports file browser selection for upload.
- Validates image file formats (PNG, JPG, JPEG, WebP).
- **Uploads are asynchronous** - files upload to storage (MinIO) with progress
  tracking per file in UI.
- **Label record is created first** - empty label is created when user clicks
  "Upload Files" button (not when files are selected), before files are
  uploaded.
- **Presigned URLs are requested individually** - frontend requests presigned
  upload URLs for each file individually, backend validates each file atomically
  (prevents race conditions with 5-image limit).
- Files are uploaded individually to storage using presigned URLs and linked to
  the label as they complete.
- Upload state (uploading, success, error) is tracked per file in UI.
- If any upload fails, user can retry failed files individually (label already
  exists).
- Displays image previews after successful upload.
- **Before initiating extraction/scanning, user can manage images:**
  - Remove individual uploaded images (must maintain at least 1 image)
    - When an image is deleted, remaining images are renumbered to maintain
      consecutive sequence order (1, 2, 3...)
  - Add more images (up to the 5-image limit)
  - Change image order (reorder sequence - sequence matters for extraction)
  - Replace individual images
  - Replace all images at once
  - View/download images at any time
- **After extraction/scanning is completed, user can still manage images, but
  this will invalidate extraction and review results:**
  - Any changes to images (add, remove, reorder, replace) invalidates extraction
    results
  - Invalidated extraction also invalidates any review work done (cascade
    invalidation)
  - System warns user before allowing image changes after extraction
  - User must re-initiate extraction after changing images
  - View/download images remains available without invalidation
- Images are stored with sequence order (1-indexed, order matters for
  extraction).
- Storage path structure: `{app_prefix}/labels/{label_id}/{uuid}.{ext}` where
  app_prefix is configurable (e.g., "fertiscan") and UUID is the storage
  filename.
- When a label is deleted, all associated storage files are also deleted
  synchronously.
- **Label record is created first** (before extraction is initiated, before
  files are uploaded).
- Label starts in initial state (review_status: not_started).
- Label requires at least 1 image (cannot create label without images).
- Label exists even if all file uploads fail (can be cleaned up later if
  needed).

### Label Management

#### User Story

As an inspector, I want to view and manage labels to track progress and resume
work, so that I can efficiently process multiple labels.

#### Requirements

- Can view all labels.
- Can filter/search labels by:
  - Review status
  - Product association
  - Date range
  - Text search within field values (product name, registration number, etc.)
- Can view labels ready for review (awaiting user review).
- Displays user-friendly error messages for extraction failures.
- Logs detailed error information server-side for debugging.
- Can view/download images at any time.
- Processes images in sequence order during extraction.
- Image management (add, remove, replace, reorder) is covered in File Upload
  section - see that section for details on image management capabilities and
  invalidation rules.
- Can resume work on labels in progress.
- Can discard labels (deletes label, associated LabelImage records, and storage
  files immediately and permanently).
- Labels can be standalone (unlinked from any product).
- Supports manual auto-link for unlinked labels (search for product by
  registration number and suggest linking).
- Auto-link is only available for unlinked labels.
- Auto-linking uses exact match on registration number.
- Can manually link unlinked labels to a product.
- Can manually unlink linked labels (make them standalone).
- Unlinking removes only the product relationship (product_id foreign key);
  registration number data on label remains unchanged.
- Can manually reassign labels from one product to another.
- If reassignment target has different registration number, warns user that
  label's registration number fields will be updated to match target product.
- If multiple products share the same registration number, flags this as a data
  integrity issue for admin investigation.

### Label Review

#### User Story

As an inspector, I want to review and correct label data, so that I can ensure
accuracy before saving and updating product records.

#### Requirements

- Can view data for labels ready for review.
- Can review/correct fields one by one:
  - Review field values
  - Make corrections as needed
  - Flag individual fields as needing review (using field-level metadata)
  - Add notes to individual fields
  - See which fields were AI-generated vs manually entered
- Saves review state incrementally (partial review is persisted).
- Can resume review on partially reviewed labels.
- Can discard labels at any point during review.
- Can enter data manually for any field at any time.
- Allows completing review when user is satisfied with the data.
- After completing review, prompts user to update product (optional):
  - If label is linked to existing product: show comparison of current product
    data vs target product data (from reviewed label) with highlighted
    differences, user chooses whether to update (all-or-nothing, cannot
    selectively update individual fields)
  - If label is unlinked: show new product data, user chooses whether to create
    product
  - Before creating product, check if registration number already exists; if
    exists, prompt user to link label to existing product instead
- Each label can independently update the product (multiple labels linked to the
  same product can each update it), and user is prompted for confirmation each
  time.
- Can reverse completion and make further modifications to completed labels.
- When reversing completion, product remains as-is (product update is not
  reversed).
- When review is completed again after reversal, prompts user to update product
  again (optional).
- Can edit reviewed labels after initial completion.

## Non-Functional Requirements

### Performance

- Extraction operations complete within reasonable time (minutes, not hours).

### Usability

- Provides user-friendly error messages for all user-facing operations.
- Provides clear warnings before destructive operations (deletion, image
  changes, completion reversal).

### Reliability

- Tracks operation state regardless of client connection status.

## Technical Constraints

### Architecture Decisions

- Extraction operations are user-initiated and run asynchronously.
- Extraction is a tool, not a tracked workflow state.

### Data Model Constraints

- Each product and label has exactly one registration number as unique
  identifier.
- Labels can have 0 to 5 images.
- Image sequence order matters for extraction processing.
- **Field values**: Label data fields (LabelData, FertilizerLabelData) store
  single values per field (not separate extracted/verified pairs).
- **Field metadata**: Field-level review metadata is tracked in separate meta
  models (LabelDataFieldMeta, FertilizerLabelDataMeta):
  - `needs_review`: Boolean flag indicating field needs user review
  - `note`: Optional note attached to field
  - `ai_generated`: Boolean flag indicating field was populated by AI extraction
  - Meta rows are created lazily (only when needed) and deleted when all
    metadata is cleared.

## Future Work

- Audit trail (track label modifications and product updates)
- Multi-user support
- Compliance checking (AI-powered validation against regulatory requirements)
- Label locking: Ability to lock a label to prevent any changes (images, data,
  etc.) to avoid accidental invalidations of extraction/review results
