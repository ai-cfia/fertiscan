"""MCP client for agents (stdio transport)."""

# mcp_client.py
from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

from mcp import ClientSession, StdioServerParameters, stdio_client

logger = logging.getLogger("mcp_client")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


class MCPClient:
    """
    MCP client-side gateway:
        - starts the MCP server (stdio)
        - handles initialization (handshake)
        - exposes call_tool() with optional timeout and retries
    """

    def __init__(
        self,
        server_cmd: list[str] | None = None,
        initialize_kwargs: dict[str, Any] | None = None,
        request_timeout_s: float = 30.0,
        max_retries: int = 1,
    ) -> None:
        # server_cmd format: ["python", "/absolute/path/to/mcp_server.py"]
        if server_cmd is None:
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            mcp_server_path = os.path.join(backend_dir, "app", "agent", "mcp_server.py")
            server_cmd = ["python", mcp_server_path]

        self.server_cmd = server_cmd
        self.request_timeout_s = float(request_timeout_s)
        self.max_retries = int(max_retries)
        self._session: ClientSession | None = None
        self._session_context_manager: Any = None
        self._context_manager: Any = None
        self._initialize_kwargs = initialize_kwargs or {}

    async def start(self) -> None:
        """
        Starts the MCP server via stdio and performs the handshake.
        Idempotent (no effect if already started).
        """
        if self._session is not None:
            return  # already started

        # 1) Build stdio server parameters
        server_params = StdioServerParameters(
            command=self.server_cmd[0],
            args=self.server_cmd[1:],
        )

        # 2) Start stdio client (returns a context manager)
        self._context_manager = stdio_client(server_params)
        read_stream, write_stream = await self._context_manager.__aenter__()

        # 3) Create and enter client session context manager
        self._session_context_manager = ClientSession(read_stream, write_stream)
        self._session = await self._session_context_manager.__aenter__()

        # 4) Handshake (initialize + tool discovery)
        logger.info("Initializing MCP session... (server_cmd=%s)", self.server_cmd)
        await self._session.initialize(**self._initialize_kwargs)
        logger.info("MCP session initialized.")

    async def close(self) -> None:
        """Closes the MCP session cleanly."""
        try:
            if self._session_context_manager is not None:
                await self._session_context_manager.__aexit__(None, None, None)
        finally:
            if self._context_manager is not None:
                try:
                    await self._context_manager.__aexit__(None, None, None)
                except Exception:
                    pass
            self._session = None
            self._session_context_manager = None
            self._context_manager = None
            logger.info("MCP session closed.")

    async def call_tool(self, tool_name: str, **kwargs: Any) -> Any:
        """
        Calls a tool on the FastMCP server.
        - Configured timeout (request_timeout_s)
        - Lightweight retries (max_retries)
        """
        if self._session is None:
            raise RuntimeError("MCPClient is not started. Call await start().")

        last_exc: Exception | None = None

        # max_retries = 1 => 2 total attempts
        for attempt in range(1, self.max_retries + 2):
            try:
                logger.info("Calling tool '%s' (attempt %d)…", tool_name, attempt)
                return await asyncio.wait_for(
                    self._session.call_tool(tool_name, kwargs),
                    timeout=self.request_timeout_s,
                )
            except Exception as e:
                last_exc = e
                logger.warning(
                    "Tool '%s' failed on attempt %d: %s",
                    tool_name,
                    attempt,
                    repr(e),
                )
                if attempt <= self.max_retries:
                    # Small progressive backoff
                    await asyncio.sleep(0.2 * attempt)
                else:
                    break

        # If we get here, all attempts failed
        raise RuntimeError(
            f"call_tool('{tool_name}') failed after {self.max_retries + 1} attempt(s)"
        ) from last_exc


# Local demo
async def _demo() -> None:
    """
    Demonstrates the usage of the MCPClient and the tools provided by the MCP server.
    - Lists available models
        - Gets some records from the database
        - Searches with filters
        - Reads a prompt template

    """
    mcp = MCPClient(
        request_timeout_s=20.0,
        max_retries=1,
        # initialize_kwargs={
        #     "client_info": {"name": "fertiscan-client", "version": "0.1.0"},
        #     "capabilities": {"tools": True},
        # },
    )
    await mcp.start()

    try:
        models = await mcp.call_tool("list_available_models")
        logger.info("AVAILABLE MODELS: %s", models)

        labels = await mcp.call_tool("get_all_records", model_name="Label", limit=5)
        logger.info("LABELS (5): %s", labels)

        # Search example
        results = await mcp.call_tool(
            "search_records",
            model_name="Label",
            filters={"review_status": "in_progress"},
            limit=10,
        )
        logger.info("SEARCH: %s", results)

        # Template example
        tmpl = await mcp.call_tool(
            "read_prompt_template", template_name="compliance_verification"
        )
        logger.info("TEMPLATE: %s", tmpl)

    finally:
        await mcp.close()


if __name__ == "__main__":
    asyncio.run(_demo())
