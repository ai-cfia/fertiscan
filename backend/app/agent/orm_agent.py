"""ORM Agent implementation using ORM."""

import logging
from typing import Any

from sqlalchemy import inspect, select

from app.db import models
from app.db.session import get_session

logger = logging.getLogger(__name__)


class ORMAgent:
    """Agent capable of performing ORM-based database searches."""

    # Available models
    MODELS = {
        class_name: getattr(models, class_name)
        for class_name in getattr(models, "__all__", [])
    }

    # Cache for schema to avoid repeated inspection of all models
    _schema_cache: dict[str, Any] | None = None

    @staticmethod
    def _row_to_dict(row: Any, model: Any) -> dict[str, Any]:
        """Convert ORM row to dictionary using inspect."""
        return {col.name: getattr(row, col.name) for col in inspect(model).columns}

    @staticmethod
    def _validate_filters(
        model: Any, filters: dict[str, Any]
    ) -> tuple[bool, list[str]]:
        """Validate that all filter keys exist as model attributes.

        Returns:
            tuple: (is_valid, list_of_invalid_keys)
        """
        invalid_keys = [key for key in filters.keys() if not hasattr(model, key)]
        return len(invalid_keys) == 0, invalid_keys

    @staticmethod
    def find_all(model_name: str, limit: int = 100) -> dict[str, Any]:
        """Fetch all records from a table."""
        if model_name not in ORMAgent.MODELS:
            return {
                "error": f"Model '{model_name}' not found. Available: {list(ORMAgent.MODELS.keys())}"
            }

        model = ORMAgent.MODELS[model_name]
        try:
            with get_session() as session:
                statement = select(model).limit(limit)
                results = session.exec(statement).scalars().all()  # type: ignore[call-overload]

                # Convert to dict using utility method
                data = [ORMAgent._row_to_dict(row, model) for row in results]

                return {
                    "status": "success",
                    "model": model_name,
                    "count": len(data),
                    "data": data,
                }
        except Exception as e:
            logger.error(f"Error fetching all from {model_name}: {e}")
            return {"status": "error", "model": model_name, "error": str(e)}

    @staticmethod
    def find_by_id(model_name: str, id: str) -> dict[str, Any]:
        """Fetch a single record by ID."""
        if model_name not in ORMAgent.MODELS:
            return {"error": f"Model '{model_name}' not found"}

        model = ORMAgent.MODELS[model_name]
        try:
            with get_session() as session:
                result = session.get(model, id)

                if not result:
                    return {"status": "not_found", "model": model_name, "id": id}

                data = ORMAgent._row_to_dict(result, model)

                return {"status": "success", "model": model_name, "data": data}
        except Exception as e:
            logger.error(f"Error fetching {model_name} with id {id}: {e}")
            return {"status": "error", "error": str(e)}

    @staticmethod
    def find_by_filter(
        model_name: str, filters: dict[str, Any], limit: int = 100
    ) -> dict[str, Any]:
        """Fetch filtered records (WHERE clause)."""
        if model_name not in ORMAgent.MODELS:
            return {"error": f"Model '{model_name}' not found"}

        model = ORMAgent.MODELS[model_name]

        # Validate filter keys before querying
        is_valid, invalid_keys = ORMAgent._validate_filters(model, filters)
        if not is_valid:
            return {
                "status": "error",
                "model": model_name,
                "error": f"Invalid filter keys: {invalid_keys}. Valid columns: {[col.name for col in inspect(model).columns]}",
            }

        try:
            with get_session() as session:
                statement = select(model)

                # Apply filters
                for key, value in filters.items():
                    if hasattr(model, key):  # type : ignore[call-overload]
                        statement = statement.where(getattr(model, key) == value)

                statement = statement.limit(limit)
                results = session.exec(statement).scalars().all()  # type: ignore[call-overload]

                data = [ORMAgent._row_to_dict(row, model) for row in results]

                return {
                    "status": "success",
                    "model": model_name,
                    "filters": filters,
                    "count": len(data),
                    "data": data,
                }
        except Exception as e:
            logger.error(f"Error filtering {model_name}: {e}")
            return {"status": "error", "error": str(e)}

    @staticmethod
    def get_schema() -> dict[str, Any]:
        """Get the schema of all available models."""
        # Return cached schema if available
        if ORMAgent._schema_cache is not None:
            return ORMAgent._schema_cache

        schema = {}
        for model_name, model in ORMAgent.MODELS.items():
            columns = {}
            for col in inspect(model).columns:
                columns[col.name] = str(col.type)
            schema[model_name] = columns

        result = {
            "status": "success",
            "models": list(ORMAgent.MODELS.keys()),
            "schema": schema,
        }

        # Cache the result for future calls
        ORMAgent._schema_cache = result
        return result
