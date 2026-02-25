# General Design

## Compliance Evaluation

```mermaid
%%{init: { "sequence": { "mirrorActors": false } }}%%
sequenceDiagram
    actor usr as User
    participant fe as Frontend
    participant be as Backend
    participant db as Database
    participant llm as LLM

    usr ->> fe : click "verify"
    fe ->> be : GET /evaluate-compliance (label_id, requirement_ids)

    be ->> db : get label data
    db -->> be : label data

    be ->> db : get specified requirements, provisions, definitions
    db -->> be : requirement contexts

    loop for each requirement
        be ->> be : assemble prompt (dictionary, global rules, exemptions, applicability conditions, rules)
        be ->> llm : evaluate requirement
        llm -->> be : ComplianceResult (status, explanation)
    end

    be -->> fe : 200 OK (compliance results)

    fe -->> usr : display compliance results

    usr ->> fe : review and confirm results
    fe ->> be : POST /save-compliance-results
    be ->> db : save compliance results
    be -->> fe : 201 Created
```

## ERD

```mermaid
erDiagram

    Label ||--o{ NonComplianceDataItem : "has"
    NonComplianceDataItem }o--|| Requirement : "evaluated by"
    Requirement }o--|| Document : "belongs to"
    Requirement ||--o{ RequirementProvision : "has rules"
    Requirement ||--o{ RequirementModifier : "has modifiers"
    Requirement ||--o{ RequirementDefinition : "has definitions"
    RequirementProvision }o--|| Provision : "references"
    RequirementModifier }o--|| Provision : "references"
    Document ||--o{ Provision : "contains"
    Document ||--o{ Definition : "defines terms"
    RequirementDefinition }o--|| Definition : "references"

    Document {
        uuid id PK
        string title
        string citation_reference UK
        string document_type "nullable"
        string source_url_en "nullable"
        string source_url_fr "nullable"
        date last_amended_date "nullable"
        timestamp created_at
        timestamp updated_at
    }

    Provision {
        uuid id PK
        uuid document_id FK
        string citation UK
        text text_en
        text text_fr
        boolean is_global_rule "default false"
        timestamp created_at
        timestamp updated_at
    }

    Definition {
        uuid id PK
        uuid document_id FK
        string term_en
        string term_fr
        text text_en
        text text_fr
        timestamp created_at
        timestamp updated_at
    }

    Requirement {
        uuid id PK
        uuid document_id FK
        string name UK
        timestamp created_at
        timestamp updated_at
    }



    RequirementProvision {
        uuid id PK
        uuid requirement_id FK
        uuid provision_id FK
    }

    RequirementModifier {
        uuid id PK
        uuid requirement_id FK
        uuid provision_id FK
        string type "EXEMPTION | APPLICABILITY_CONDITION"
    }

    RequirementDefinition {
        uuid id PK
        uuid requirement_id FK
        uuid definition_id FK
    }

    NonComplianceDataItem {
        uuid id PK
        uuid label_id FK
        uuid requirement_id FK
        string note "nullable"
        string description_en "nullable"
        string description_fr "nullable"
        boolean is_compliant
        timestamp created_at
        timestamp updated_at
    }

    Label {
        uuid id PK
        uuid product_id FK "nullable"
        uuid product_type_id FK
        uuid created_by_id FK
        string review_status
        timestamp created_at
        timestamp updated_at
    }

```

## LLM Response Format

The LLM response is parsed into a structured `ComplianceResult`:

```python
class ComplianceResult(BaseModel):
    status: Literal["COMPLIANT", "NON_COMPLIANT", "NOT_APPLICABLE"]
    explanation_en: str
    explanation_fr: str
```

- `COMPLIANT` — The label satisfies the requirement.
- `NON_COMPLIANT` — The label violates the requirement.
- `NOT_APPLICABLE` — An exemption or applicability condition short-circuited the
  evaluation.

## Prompt Engineering

The compliance prompt template `compliance_verification.md` injects separated
context sections built from the `Requirement` hub. The template follows this
structure:

````markdown
# Compliance Verification

## Role

You are a Regulatory Compliance Engine. Your sole purpose is to verify if a
product's label data adheres to a specific regulatory requirement.

## Verification Protocol

1. Consult the **Dictionary** to establish the strict legal definitions of
   terms used in the subsequent texts.
2. Evaluate the **Global Rules**. If the product is globally exempt or
   fundamentally violates a core prohibition, stop and return the overarching
   result.
3. Evaluate the **Exemptions**. If any exemption applies to the product,
   stop and return "Not Applicable" for this check.
4. Evaluate the **Applicability Conditions**. If any condition is not met,
   stop and return "Not Applicable" for this check.
5. Evaluate compliance exclusively against the **Rules**.

## Constraints

- Do not assume the presence of data not explicitly provided in the Label Data.
- Base your decision solely on the provided legal texts and data.
- Support your conclusion with specific evidence from the Label Data.
- Apply definitions from the Dictionary strictly — do not use colloquial
  interpretations of legal terms.

## Dictionary

```text
{{ dictionary }}
```

## Global Rules

```text
{{ global_rules }}
```

## Exemptions

```text
{{ exemptions }}
```

## Applicability Conditions

```text
{{ applicability_conditions }}
```

## Rules

```text
{{ rules }}
```

## Label Data

```json
{{ label_data }}
```
````

## Considered Alternatives

- **Knowledge Graph:** The current relational model acts as a manually curated
  graph. To explore later.
- **RAG:** Skipped to prioritize precision for safety-critical checks. To
  explore later.

## Limitations & Improvements

- **Cost/Latency:** Global rules are repeatedly injected and evaluated for
  _every_ requirement. If a product is globally exempt, `N` LLM calls calculate
  the same short-circuit.
- **Improvement:** Introduce a preliminary orchestration step: evaluate Global
  Rules _once_. If broadly exempt or prohibited, halt the entire process. If
  applicable, fan out to evaluate individual requirements.
