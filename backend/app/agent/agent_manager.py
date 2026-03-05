"""The Agent Manager"""

import asyncio

from .azure_agent import AzureAgent
from .mcp_client import MCPClient


class AgentManager:
    """Top-level manager for all agents."""

    def __init__(self) -> None:
        self.azure = AzureAgent()
        self.mcp = MCPClient()

        self.registry = {"nlp": self.azure, "tool": self.mcp}

    async def run(self) -> None:
        """Run all agents concurrently."""
        await self.azure.main()
        await self.mcp.start()


if __name__ == "__main__":
    manager: AgentManager = AgentManager()
    asyncio.run(manager.run())
