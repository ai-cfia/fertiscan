"""MCP Server for FertiScan Agent with ORM tools."""

import logging
import os
from typing import Any

from mcp.server.fastmcp import FastMCP

from app.agent.orm_agent import ORMAgent as SQLAgent
from app.config import settings

mcp = FastMCP(
    "FertiScanMCPServer",
    "1.0.0",
    "MCP server for FertiScan with ORM database access",
    json_response=True,
)


# ============= ORM TOOLS =============


@mcp.tool()
def get_all_records(model_name: str, limit: int = 100) -> dict[str, Any]:
    """
    Fetch all records from a table.

    Args:
        model_name: Model name (user, label, product, fertilizer_label_data, non_compliance_data_item)
        limit: Max rows returned (default 100)

    Returns:
        Results as JSON
    """
    return SQLAgent.find_all(model_name, limit)


@mcp.tool()
def get_record_by_id(model_name: str, id: str) -> dict[str, Any]:
    """
    Fetch a single record by ID.

    Args:
        model_name: Model name
        id: Record UUID

    Returns:
        Record data or error
    """
    return SQLAgent.find_by_id(model_name, id)


@mcp.tool()
def search_records(
    model_name: str,
    filters: dict[str, Any],
    limit: int = 100,
) -> dict[str, Any]:
    """
    Search for records with filters (WHERE clause).

    Args:
        model_name: Model name
        filters: Filter dictionary {"column": value}
        limit: Max results

    Returns:
        Filtered results
    """
    return SQLAgent.find_by_filter(model_name, filters, limit)


@mcp.tool()
def get_database_schema() -> dict[str, Any]:
    """
    Get the complete schema of all available models.

    Returns:
        Table structure with column types
    """
    return SQLAgent.get_schema()


@mcp.tool()
def list_available_models() -> dict[str, Any]:
    """
    List all available models for search.

    Returns:
        List of models and usage examples
    """
    return {
        "status": "success",
        "available_models": list(SQLAgent.MODELS.keys()),
        "models_info": {
            "user": "System users",
            "label": "Product labels",
            "product": "Fertilizer products",
            "fertilizer_label_data": "Fertilizer label data",
            "non_compliance_data_item": "Non-compliance items",
        },
        "examples": {
            "get_all": "Show all labels",
            "search": "Find active labels",
            "get_one": "Show a specific label",
        },
    }


# ============= PROMPT TOOLS =============


def ensure_file() -> bool:
    """Ensure that the compliance verification template file exists."""
    try:
        template_path = settings.prompt_template_env.get_template(
            "compliance_verification.md"
        ).filename
        if template_path is None:
            logging.error("Template path is None")
            return False
        if not os.path.exists(template_path):
            os.makedirs(os.path.dirname(template_path), exist_ok=True)
            with open(template_path, "w") as f:
                f.write("# Compliance Verification Template\n")
        return True
    except Exception:
        logging.error("Error ensuring prompt template file exists", exc_info=True)
        return False


@mcp.tool()
def read_prompt_template(template_name: str) -> dict[str, str]:
    """Read a prompt template by name."""
    if not ensure_file():
        return {"status": "error", "error": "Failed to ensure template file exists"}
    try:
        template = settings.prompt_template_env.get_template(f"{template_name}.md")
        return {
            "status": "success",
            "template_name": template_name,
            "content": template.render(),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    mcp.run()
