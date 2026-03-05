"""The Azure Agent"""

import asyncio
import logging
import sys

from openai import AsyncAzureOpenAI, AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)


async def ask_agent(question: str) -> str:
    endpoint = settings.AZURE_AGENT_ENDPOINT
    if not endpoint:
        raise ValueError("AZURE_AGENT_ENDPOINT is not configured")

    if not settings.AZURE_AGENT_API_KEY:
        raise ValueError("AZURE_AGENT_API_KEY is not configured")
    api_key = settings.AZURE_AGENT_API_KEY.get_secret_value()

    endpoint_clean = endpoint.rstrip("/")
    is_azure_openai = "openai.azure.com" in endpoint_clean

    if is_azure_openai:
        client = AsyncAzureOpenAI(
            azure_endpoint=endpoint_clean,
            api_key=api_key,
            api_version=settings.AZURE_AGENT_API_VERSION,
        )
    else:
        # For OpenAI-compatible endpoints, add /v1 which is standard for OpenAI-compatible APIs
        base_url = endpoint_clean
        if not base_url.endswith("/v1"):
            base_url = f"{base_url}/v1"
        client = AsyncOpenAI(base_url=base_url, api_key=api_key)  # type: ignore[assignment]

    response = await client.chat.completions.create(
        model=settings.AZURE_AGENT_MODEL,
        messages=[{"role": "user", "content": question}],
    )

    return response.choices[0].message.content or ""


class AzureAgent:
    """Agent that interacts with Azure OpenAI for complex tasks."""

    async def main(self) -> None:
        """Main loop for the Azure Agent."""
        logger.info("Azure Agent is running. Type 'exit' to quit.")
        while True:
            question = input("Enter your question: ")
            if question.lower() == "exit":
                logger.info("Exiting Azure Agent.")
                break
            answer = await self.answer_question(question)
            logger.info("Answer: %s", answer)

    async def answer_question(self, question: str) -> str:
        """Use Azure OpenAI to answer a question."""
        return await ask_agent(question)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) > 1 and sys.argv[1] == "--question":
        if len(sys.argv) > 2:
            question = " ".join(sys.argv[2:])
            answer = asyncio.run(ask_agent(question))
            logger.info("Response: %s", answer)
        else:
            logger.error("Usage: python -m app.agent.azure_agent --question <question>")
            sys.exit(1)
    else:
        agent = AzureAgent()
        asyncio.run(agent.main())
