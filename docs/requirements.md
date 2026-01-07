# FertiScan Requirements

Notes on what the system needs to do - product management, label scanning, and
verification workflows.

## Overview

### What This Covers

Core domain model, database schema, and business logic for:

- Product lifecycle management
- Label scanning and data extraction
- Label verification workflows
- Label-product relationship management

### Key Terms

- **Product**: A registered fertilizer product with a unique registration number
- **Label**: A scanned product label containing images and extracted/verified
  data
- **Extraction**: AI-powered process to extract structured data from label
  images
- **Verification**: User review and correction of extracted data

## User Roles

### Inspector

The main user role - responsible for:

- Managing product records
- Scanning and processing labels
- Verifying extracted data

## Functional Requirements

### Product Management

#### User Story

As an inspector, I want to manage products (create, read, update, delete), so
that I can maintain accurate product records.

#### Requirements

- Can create products with a registration number.
- Can read/view product details.
- Can update product information.
- Can delete products.
- Each product has exactly one registration number as its unique identifier.
- Products can exist without associated labels.
- Product updates do not affect existing labels or their verification status.
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

- Can upload 0 to 5 images per label.
- Allows manual data entry for labels with 0 images.
- Requires at least 1 image to initiate extraction.
- Supports asynchronous data extraction from label images using an AI pipeline.
- Tracks extraction status (pending, in_progress, completed, failed).
- Stores extracted fields on the label when extraction completes.
- Supports partial extraction results (some fields extracted, others missing).
- Automatically attempts to link labels to existing products by matching
  registration numbers after extraction completes.
- If no product match is found, label remains unlinked (product creation
  deferred until after verification).
- Supports linking labels to pre-selected products during scanning workflow.

#### Workflows

##### Standalone Label Scanning

1. User uploads label images
2. User initiates extraction
3. System extracts structured data asynchronously (status: pending → in_progress
   → completed/failed)
4. System stores extracted fields on label
5. System attempts to identify existing product by extracted registration
   number:
   - If match found: link label to existing product
   - If no match: label remains unlinked

##### Product-Associated Label Scanning

1. User selects/creates a product first
2. User uploads label images
3. User initiates extraction
4. System extracts structured data asynchronously (status: pending → in_progress
   → completed/failed)
5. System stores extracted fields on label
6. System links label to pre-selected product

### Label Management

#### User Story

As an inspector, I want to view and manage labels to track progress and resume
work, so that I can efficiently process multiple labels.

#### Requirements

- Can view all labels.
- Can filter/search labels by:
  - Extraction status
  - Overall label status
  - Product association
  - Date range
  - Text search within extracted/verified field values (product name,
    registration number, etc.)
- Can view labels ready for verification (extraction completed, awaiting user
  review).
- Can view labels needing attention (extraction failed, errors).
- Can retry extraction for failed labels (re-run extraction on same images).
- Displays user-friendly error messages for extraction failures.
- Logs detailed error information server-side for debugging.
- Can manage images at any label stage (before extraction, during verification,
  after completion):
  - Add individual images (up to 5-image limit)
  - Remove individual images (can remove all, leaving 0 images)
  - Replace individual images
  - Replace all images at once
  - Reorder images (sequence matters)
  - View/download images at any time
- Processes images in sequence order during extraction.
- Invalidates extraction results when images are reordered after extraction.
- Warns user when changing images after extraction that this will invalidate
  extraction results.
- Changing images invalidates extraction and verification results (cascade
  invalidation).
- Can resume work on pending labels.
- Can discard labels (deletes label and associated images immediately and
  permanently).
- Blocks discard operation during active extraction.
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

### Label Verification

#### User Story

As an inspector, I want to verify and correct extracted label data, so that I
can ensure accuracy before saving and updating product records.

#### Requirements

- Can view extracted data for labels ready for verification.
- Can verify/correct extracted fields one by one:
  - Review extracted values
  - Make corrections as needed
  - Mark individual fields as verified
- Saves verification state incrementally (partial verification is persisted).
- Can resume verification on partially verified labels.
- Can discard labels at any point during verification.
- Can enter data manually for any field at any time (regardless of extraction
  status).
- Allows completing verification only after all fields are verified.
- After completing verification, prompts user to update product (optional):
  - If label is linked to existing product: show comparison of current product
    data vs target product data (from verified label) with highlighted
    differences, user chooses whether to update (all-or-nothing, cannot
    selectively update individual fields)
  - If label is unlinked: show new product data, user chooses whether to create
    product
  - Before creating product, check if registration number already exists; if
    exists, prompt user to link label to existing product instead
- Each label can independently update the product (multiple labels linked to
  the same product can each update it), and user is prompted for confirmation
  each time.
- Can reverse completion and make further modifications to completed labels.
- When reversing completion, product remains as-is (product update is not
  reversed).
- When verification is completed again after reversal, prompts user to update
  product again (optional).
- Can edit verified labels after initial verification.

## Non-Functional Requirements

### Performance

- Extraction operations complete within reasonable time (minutes, not hours).
- Provides real-time status updates for long-running operations (extraction).

### Usability

- Provides user-friendly error messages for all user-facing operations.
- Provides clear warnings before destructive operations (deletion, image
  changes, completion reversal).

### Reliability

- Tracks operation state regardless of client connection status.
- Supports automatic polling fallback if WebSocket connection fails.

## Technical Constraints

### Architecture Decisions

- FastAPI's BackgroundTasks are used for asynchronous extraction operations.
- WebSocket connections are used for real-time status updates, with automatic
  polling fallback on connection failure.
- Extraction status changes (pending → in_progress → completed/failed) are
  pushed to connected clients via WebSocket.

### Data Model Constraints

- Each product and label has exactly one registration number as unique
  identifier.
- Labels can have 0 to 5 images.
- Image sequence order matters for extraction processing.

## Future Work

- Audit trail (track label modifications and product updates)
- Multi-user support
- Compliance checking (AI-powered validation against regulatory requirements)
