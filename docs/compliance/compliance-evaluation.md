# Compliance Evaluation

Evaluation is per requirement: the frontend loops over the selected
requirements, calling the backend once per requirement. Confirmed results are
saved as `NonComplianceDataItem` rows (one per label/requirement pair).

```mermaid
%%{init: { "sequence": { "mirrorActors": false } }}%%
sequenceDiagram
    actor usr as User
    participant fe as Frontend
    participant be as Backend
    participant db as Database
    participant llm as LLM

    usr ->> fe : click "verify"

    loop for each selected requirement
        fe ->> be : GET /labels/{label_id}/evaluate-non-compliance/{requirement_id}
        be ->> db : get label data
        db -->> be : label data
        be ->> db : get requirement, provisions, definitions, modifiers
        db -->> be : requirement context
        be ->> be : render prompt (compliance_verification.md)
        be ->> llm : evaluate requirement
        llm -->> be : ComplianceResult (status, explanation)
        be -->> fe : 200 OK (result)
    end

    fe -->> usr : display compliance results

    usr ->> fe : review and confirm results
    fe ->> be : POST /labels/{label_id}/non_compliance_data_items
    be ->> db : save verdicts
    be -->> fe : 201 Created
```
