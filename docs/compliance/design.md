# General Design

## Local verification

```mermaid
%%{init: { "sequence": { "mirrorActors": false } }}%%
sequenceDiagram
    actor usr as User
    participant fe as Frontend
    participant be as Backend
    participant db as Database
    participant ai as AI Pipeline

    usr ->> fe : click "verify"
    fe ->> be : GET /api/verify/{label_id}

    be ->> db : get product and label data
    db -->> be : product and label data

    be ->> be : local non compliance processing
    be ->> ai : ai non compliance processing
    ai -->> be : non compliance data

    be ->> db : save non compliance data

    be -->> fe: 201 Created (non compliance data)

    fe -->> usr: Display non compliance alerts
```

## ERD

```mermaid
erDiagram

    Label ||--o| LabelData : "has"
    Product ||--o{ Label : "has"
    LabelNonComplianceData |o--|| Label:"has"
    NonComplianceData ||--||LabelNonComplianceData:"has"
    NonComplianceData ||--|{NonComplianceDataItem:"has"


    NonComplianceDataItem{
        uuid id PK
        uuid non_compliance_data_id FK
        string name_en
        string name_fr
        string description_en
        string description_fr
        string comment "nullable"
        boolean is_good

    }

    NonComplianceData{
        uuid id PK
        uuid label_non_compliance_data_id FK
        string comment "nullable"
        timestamp created_at
        timestamp updated_at
    }

    LabelNonComplianceData{
        uuid id PK
        uuid label_id FK
        uuid NonCompliance_id FK
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
        uuid label_non_compliance_data_id FK
        string review_status
        timestamp created_at
        timestamp updated_at
    }

    LabelData {
        uuid id PK
        uuid label_id FK "unique"
        string brand_name_en "nullable"
        string brand_name_fr "nullable"
        string product_name_en "nullable"
        string product_name_fr "nullable"
        jsonb contacts "nullable"
        string registration_number "nullable"
        string lot_number "nullable"
        string net_weight "nullable"
        string volume "nullable"
        timestamp created_at
        timestamp updated_at
    }
```
