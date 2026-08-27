# FertiScan

AI-assisted analysis of fertilizer labels for compliance verification. A user
uploads photos of a fertilizer label, a
vision LLM extracts the label's fields into a structured, bilingual form, the
user reviews and corrects it, and an LLM-based evaluator checks the label
against a curated base of regulatory requirements.

## Quick start

Prerequisites and full setup: [DEVELOPMENT.md](./DEVELOPMENT.md). With Docker
running and `backend/.env` / `frontend/.env` in place (copy from the
`.env.example` files):

```bash
make docker-watch
```

This starts everything: frontend at <http://localhost:5173>, backend at
<http://localhost:8000> (API docs at `/docs`), plus PostgreSQL, MinIO, and
pgAdmin.

## Structure

- `backend/` - FastAPI backend API ([README](./backend/README.md))
- `frontend/` - TanStack Start frontend ([README](./frontend/README.md))

## Architecture

See [docs/architecture.md](./docs/architecture.md) for the system architecture:
components, data flow, conventions, and how to run everything locally.

## Project status and directions

FertiScan is a prototype under active development. Inspectors are currently
trying it out on real fertilizer labels, and their feedback drives
improvements.

Planned extensions of the current system:

- **Feed labels** — extend label analysis to animal feed (regulated under the
  Feeds Act and Feeds Regulations, 2024). Same problem shape as fertilizer:
  guaranteed analysis, ingredients, registration numbers, bilingual
  requirements.
- **Registration verification** — given a label, determine whether the product
  and/or its components are registered. Possibly a dedicated microservice;
  design TBD.

Architectural directions being explored — not committed decisions, and not
necessarily complementary:

- **Agent architecture** — replace the current direct-to-LLM processing
  (single structured calls for extraction and compliance) with an agent-based
  architecture.
- **Retrieval (RAG)** — evaluate retrieval over legislation against the
  current curated compliance knowledge base (see
  [docs/architecture.md](./docs/architecture.md)).
