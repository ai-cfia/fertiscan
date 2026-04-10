FROM python:3.14-slim AS build

# Force Python to write logs immediately instead of buffering
ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install curl for healthchecks
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.11.6@sha256:b1e699368d24c57cda93c338a57a8c5a119009ba809305cc8e86986d4a006754 /uv /uvx /bin/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

ENV PYTHONPATH=/app

# Copy application files
COPY ./scripts /app/scripts
COPY ./pyproject.toml ./uv.lock ./alembic.ini /app/
COPY ./alembic /app/alembic
COPY ./app /app/app
COPY ./tests /app/tests

# Sync the project
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev

FROM python:3.14-slim AS dev

# Force Python to write logs immediately instead of buffering
ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Keep curl in local development image for container healthchecks.
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Use the virtual environment built in the previous stage.
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

COPY --from=build /app /app

EXPOSE 5000

CMD ["fastapi", "run", "--workers", "4", "--port", "5000", "app/main.py"]

FROM gcr.io/distroless/python3-debian12:latest AS production

# Force Python to write logs immediately instead of buffering
ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Use the virtual environment built in the previous stage.
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

COPY --from=build /app /app

USER nonroot

EXPOSE 5000

CMD ["-m", "fastapi", "run", "--workers", "4", "--port", "5000", "app/main.py"]
