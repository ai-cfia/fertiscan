# Entity Relationship Diagram

## ERD

```mermaid
erDiagram
    ProductType ||--o{ Product : "has"
    ProductType ||--o{ Label : "has"
    Product ||--o{ Label : "has"
    Label ||--o{ LabelImage : "has"
    Label ||--o| LabelData : "has"
    Label ||--o| FertilizerLabelData : "has"
    User ||--o{ Label : "creates"
    User ||--o{ Product : "creates"

    ProductType {
        uuid id PK
        string code UK
        string name_en "nullable"
        string name_fr "nullable"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    Product {
        uuid id PK
        uuid created_by_id FK
        uuid product_type_id FK
        string brand_name_en "nullable"
        string brand_name_fr "nullable"
        string registration_number UK
        string name_en "nullable"
        string name_fr "nullable"
        timestamp created_at
        timestamp updated_at
    }

    Label {
        uuid id PK
        uuid product_id FK "nullable"
        uuid product_type_id FK
        uuid created_by_id FK
        string extraction_status
        string verification_status
        string extraction_error_message "nullable"
        timestamp created_at
        timestamp updated_at
    }

    LabelImage {
        uuid id PK
        uuid label_id FK
        string file_path
        int sequence_order
        timestamp created_at
    }

    LabelData {
        uuid id PK
        uuid label_id FK
        string brand_name_en_extracted "nullable"
        string brand_name_en_verified "nullable"
        string brand_name_fr_extracted "nullable"
        string brand_name_fr_verified "nullable"
        string product_name_en_extracted "nullable"
        string product_name_en_verified "nullable"
        string product_name_fr_extracted "nullable"
        string product_name_fr_verified "nullable"
        jsonb contacts_extracted "nullable"
        jsonb contacts_verified "nullable"
        string registration_number_extracted "nullable"
        string registration_number_verified "nullable"
        string lot_number_extracted "nullable"
        string lot_number_verified "nullable"
        string net_weight_extracted "nullable"
        string net_weight_verified "nullable"
        string volume_extracted "nullable"
        string volume_verified "nullable"
    }

    FertilizerLabelData {
        uuid id PK
        uuid label_id FK
        decimal n_extracted "nullable"
        decimal n_verified "nullable"
        decimal p_extracted "nullable"
        decimal p_verified "nullable"
        decimal k_extracted "nullable"
        decimal k_verified "nullable"
        jsonb ingredients_en_extracted "nullable"
        jsonb ingredients_en_verified "nullable"
        jsonb ingredients_fr_extracted "nullable"
        jsonb ingredients_fr_verified "nullable"
        jsonb guaranteed_analysis_en_extracted "nullable"
        jsonb guaranteed_analysis_en_verified "nullable"
        jsonb guaranteed_analysis_fr_extracted "nullable"
        jsonb guaranteed_analysis_fr_verified "nullable"
        string caution_en_extracted "nullable"
        string caution_en_verified "nullable"
        string caution_fr_extracted "nullable"
        string caution_fr_verified "nullable"
        string instructions_en_extracted "nullable"
        string instructions_en_verified "nullable"
        string instructions_fr_extracted "nullable"
        string instructions_fr_verified "nullable"
    }

    User {
        uuid id PK
        string email UK
        string first_name "nullable"
        string last_name "nullable"
        boolean is_active
        boolean is_superuser
        timestamp created_at
        timestamp updated_at
    }
```

## Label Status State Machine

Labels track state through two status fields (one per major step):

### Extraction Status (`extraction_status`)

- **`pending`**: Extraction not started
- **`in_progress`**: Extraction running
- **`completed`**: Extraction finished successfully
- **`failed`**: Extraction failed

**Transitions:** `pending` → `in_progress` → `completed` / `failed` → `pending`
(retry)

**Business Rules**:

- Requires at least 1 image to initiate extraction
- Supports manual data entry without extraction (0 images)
- Partial extraction results are supported
- Extraction error details stored in `extraction_error_message` when failed

### Verification Status (`verification_status`)

- **`not_started`**: Verification not begun
- **`in_progress`**: User verifying/correcting data
- **`completed`**: All fields verified

**Transitions:** `not_started` → `in_progress` → `completed` → `in_progress`
(reversal)

**Business Rules**:

- Can start with extracted data OR manual entry
- Field-level verification (incremental, persisted)
- Completion requires all fields verified
- Product update prompt after completion (optional)

## Key Design Decisions

### Nullable Fields

- **`Label.product_id`**: Nullable to support standalone labels (REQ-LM-016)
- **`LabelData` fields**: All nullable to support partial extraction and manual
  entry
- **`FertilizerLabelData`**: Optional, only created for fertilizer labels
- **`FertilizerLabelData` fields**: All nullable to support partial extraction
  and manual entry
- **`Label.extraction_error_message`**: Nullable, only populated when extraction
  fails

### Status Tracking

- **Two status fields on Label**: `extraction_status`, `verification_status`
- **LabelData creation**: Created lazily when extraction completes or when user
  starts manual entry (not always present)
- **FertilizerLabelData creation**: Created lazily for fertilizer labels when
  extraction completes or when user starts manual entry (optional, only for
  fertilizer labels)

### Field Verification

- Verification means copying values from `*_extracted` fields to `*_verified`
  fields
- A field is considered verified when its `*_verified` field has a value
  (non-null)
- Users can verify fields individually, and verification state is saved
  incrementally
- Manual entry allowed at any time (regardless of extraction status)

### Image Management

- Images stored in separate `LabelImage` entity with sequence order
- Sequence order is 1-indexed (starts at 1, not 0)
- Sequence order matters for extraction processing
- Image changes cascade invalidate extraction and verification results
- When an individual image is deleted, remaining images are renumbered to
  maintain consecutive sequence order (1, 2, 3...)
- Storage path structure: `{app_prefix}/labels/{label_id}/{uuid}.{ext}` where
  app_prefix is configurable (e.g., "fertiscan") and UUID is the storage
  filename
- When a label is deleted, all associated storage files are also deleted
  synchronously

### Product-Label Relationship

- Labels can exist without products (standalone)
- Auto-linking after extraction via registration number matching
- Manual linking/unlinking/reassignment supported
- Product deletion requires explicit handling of associated labels

### Bilingual Support

- **Bilingual fields**: `brand_name` and `product_name` stored as separate
  columns for English (`_en`) and French (`_fr`) to comply with Canadian
  labeling requirements
- **Product entity**: `brand_name_en`, `brand_name_fr`, `name_en`, `name_fr`
- **LabelData entity**: `brand_name_en_extracted/verified`,
  `brand_name_fr_extracted/verified`, `product_name_en_extracted/verified`,
  `product_name_fr_extracted/verified`
- **FertilizerLabelData entity**: `caution_en_extracted/verified`,
  `caution_fr_extracted/verified`, `instructions_en_extracted/verified`,
  `instructions_fr_extracted/verified`
- **French fields nullable**: French versions are nullable as not all products may
  have French labels, but English is typically required

### Product Type Management

- **ProductType table**: Central registry of product types (fertilizer, pesticide,
  etc.)
  - `code`: Unique identifier (e.g., "fertilizer", "pesticide")
  - `name_en`/`name_fr`: Display names for i18n support (both nullable for
    flexibility)
  - `is_active`: Allows disabling types without deleting data
- **Product.product_type_id**: Foreign key to ProductType (required)
- **Label.product_type_id**: Foreign key to ProductType (required, even for
  standalone labels)
  - Labels always have an explicit product type, even when not linked to a product
  - Enables efficient filtering and querying by product type

### Product Type Separation

- **Generic fields in LabelData**: Common fields shared across all product types
  (brand_name_en/fr, product_name_en/fr, registration_number, lot_number,
  contacts, net_weight, volume)
- **Fertilizer-specific fields in FertilizerLabelData**: NPK values (n, p, k),
  ingredients_en/fr, guaranteed_analysis_en/fr, caution_en/fr, and
  instructions_en/fr specific to fertilizer products
- **Extensibility**: Other product types can have their own label data tables
  (e.g., `PesticideLabelData`) following the same pattern
- **Optional relationship**: `FertilizerLabelData` is optional (0..1), only
  created when the label is for a fertilizer product
- **Type-specific table mapping**: The ProductType table serves as a registry,
  while type-specific tables (FertilizerLabelData, etc.) are created via code
  and migrations. This mismatch is acceptable because:
  - Product types are domain concepts requiring code changes anyway (UI,
    validation, extraction logic)
  - Type-specific tables provide queryability and type safety
  - ProductType table enables efficient filtering without relationship checks

### Structured Data Fields (JSONB)

**Note:** JSONB fields are temporary and may be normalized into separate tables
in the future for better queryability and structure.

All JSONB fields follow a consistent structure. Expected formats:

#### `contacts_extracted/verified` (in LabelData)

Array of contact information objects:

```json
[
  {
    "type": "manufacturer",
    "name": "ABC Fertilizer Co.",
    "address": "123 Main St, City, State, ZIP",
    "phone": "1-800-123-4567",
    "email": "info@abc.com",
    "website": "https://www.abc.com"
  },
  {
    "type": "distributor",
    "name": "XYZ Distribution",
    "address": "456 Oak Ave, City, State, ZIP",
    "phone": "1-800-987-6543"
  }
]
```

**Fields:**

- `type` (string): Type of contact (manufacturer, distributor, importer, etc.)
- `name` (string): Company name
- `address` (string, optional): Full address
- `phone` (string, optional): Phone number
- `email` (string, optional): Email address
- `website` (string, optional): Website URL

#### `ingredients_en/fr_extracted/verified` (in FertilizerLabelData)

Array of ingredient objects with optional nested sub-ingredients:

```json
[
  {
    "name": "Urea",
    "value": 46.0,
    "unit": "%"
  },
  {
    "name": "Total Nitrogen",
    "value": 10.0,
    "unit": "%",
    "sub_ingredients": [
      { "name": "Ammoniacal Nitrogen", "value": 5.0, "unit": "%" },
      { "name": "Urea Nitrogen", "value": 5.0, "unit": "%" }
    ]
  }
]
```

**Fields:**

- `name` (string): Ingredient name
- `value` (decimal): Ingredient value/percentage
- `unit` (string): Unit of measurement (typically "%")
- `sub_ingredients` (array, optional): Nested array of sub-ingredient objects
  with same structure

#### `guaranteed_analysis_en/fr_extracted/verified` (in FertilizerLabelData)

Object containing analysis title and nutrients array:

```json
{
  "title": "Minimum Guaranteed Analysis",
  "is_minimum": true,
  "nutrients": [
    {
      "name": "Total Nitrogen (N)",
      "value": 10.0,
      "unit": "%"
    },
    {
      "name": "Available Phosphate (P₂O₅)",
      "value": 20.0,
      "unit": "%"
    },
    {
      "name": "Calcium (Ca)",
      "value": 1.0,
      "unit": "%"
    }
  ]
}
```

**Fields:**

- `title` (string): Section title from label ("Minimum Guaranteed Analysis" or
  "Guaranteed Analysis")
- `is_minimum` (boolean): True if title contains "Minimum", false otherwise
- `nutrients` (array): Array of nutrient objects, each containing:
  - `name` (string): Nutrient name (e.g., "Total Nitrogen (N)")
  - `value` (decimal): Nutrient percentage value
  - `unit` (string): Unit of measurement (typically "%")

### Audit Trail

- **`Product.created_by_id`**: Tracks who created each product (required for
  regulatory compliance)
- **`Label.created_by_id`**: Tracks who created each label (audit trail)
- Both fields are non-nullable to ensure complete audit trail
