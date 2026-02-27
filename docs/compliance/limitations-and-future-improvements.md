# Limitations, Alternatives & Future Improvements

## Known Limitations

- **Performance & Cost:** Currently, all `Requirements` are evaluated
  individually by the LLM (to check applicability/modifiers), including global
  rules which are re-injected into every prompt rather than evaluated once. In a
  document with hundreds of requirements, this will be expensive and slow.
- **Versioning:** The model is currently snapshot-based; it represents the most
  recent version of the legislation. Implementing historical versioning for past
  laws is a future milestone.
- **Label Data Filtering:** The full label data JSON is injected into every
  requirement prompt. Scoping this to relevant data points (e.g. only injecting
  `ingredients` for 16(7)) would improve token efficiency.
- **Missing Registry Verification Skill:** The system currently cannot verify
  the authenticity or status of registration numbers against a live CFIA
  database (Section 16(1)(c)). These checks currently result in `INCONCLUSIVE`
  for human review.
- **Missing Component Validation Skill:** There is no automated capability yet
  to validate ingredients against the specific definitions and guidelines in the
  **List of Materials** (Section 16(1)(k)). Since these entries contain complex
  safety standards and criteria for regulatory decisions, the LLM identifies
  candidate terms but relies on `INCONCLUSIVE` flags for terminal human
  verification.

## Considered Alternatives

- **Knowledge Graph:** The current relational model acts as a manually curated
  graph. To explore later.
- **RAG:** Skipped to prioritize precision for safety-critical checks. To
  explore later.
