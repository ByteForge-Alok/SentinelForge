
"""Hindsight-backed incident memory for SentinelForge."""

from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv

# Load backend/.env when the application starts from the backend directory.
load_dotenv()


BANK_ID = os.getenv(
    "HINDSIGHT_BANK_ID",
    "sentinelforge-incidents",
).strip()

BASE_URL = os.getenv(
    "HINDSIGHT_BASE_URL",
    "https://api.hindsight.vectorize.io",
).strip()


class IncidentMemory:
    """Store and retrieve incident knowledge using Hindsight Cloud."""

    def __init__(self) -> None:
        self._client = None
        self._init_error: str | None = None

        api_key = os.getenv("HINDSIGHT_API_KEY", "").strip()

        if not api_key:
            self._init_error = (
                "HINDSIGHT_API_KEY is missing. "
                "Configure it in backend/.env."
            )
            return

        if not BANK_ID:
            self._init_error = "HINDSIGHT_BANK_ID is empty."
            return

        try:
            from hindsight_client import Hindsight

            self._client = Hindsight(
                base_url=BASE_URL,
                api_key=api_key,
                timeout=15.0,
            )

            # The memory bank already exists in Hindsight Cloud.
            # Do not create it during application startup.

        except Exception as exc:
            self._init_error = (
                f"Hindsight initialization failed: "
                f"{type(exc).__name__}: {exc}"
            )

    @property
    def configured(self) -> bool:
        """Return whether the client initialized locally."""
        return self._client is not None

    def status(self) -> dict[str, Any]:
        """Return the current Hindsight configuration status."""
        return {
            "provider": "Hindsight",
            "configured": self.configured,
            "bank_id": BANK_ID if self.configured else None,
            "base_url": BASE_URL if self.configured else None,
            "message": (
                "Hindsight client initialized. "
                "Remote memory operations have not necessarily been tested."
                if self.configured
                else self._init_error
            ),
        }

    def recall(self, query: str) -> dict[str, Any]:
        """Retrieve relevant memories for an incident investigation."""
        if not self._client:
            return {
                "status": "not_configured",
                "query": query,
                "results": [],
                "message": self._init_error,
            }

        try:
            result = self._client.recall(
                bank_id=BANK_ID,
                query=query,
                budget="low",
            )

            items = getattr(result, "results", []) or []

            memories = [
                {
                    "type": str(getattr(item, "type", "memory")),
                    "text": str(getattr(item, "text", item)),
                }
                for item in items
            ]

            return {
                "status": "success",
                "query": query,
                "results": memories,
                "message": (
                    f"Retrieved {len(memories)} memory item(s) from Hindsight."
                ),
            }

        except Exception as exc:
            return {
                "status": "error",
                "query": query,
                "results": [],
                "message": (
                    f"Hindsight recall failed: "
                    f"{type(exc).__name__}: {exc}"
                ),
            }

    def retain(
        self,
        content: str,
        context: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Store an incident outcome for future investigations."""
        if not self._client:
            return {
                "status": "not_configured",
                "message": self._init_error,
            }

        try:
            self._client.retain(
                bank_id=BANK_ID,
                content=content,
                context=context,
                metadata=metadata or {},
            )

            return {
                "status": "success",
                "message": "Incident outcome retained in Hindsight.",
            }

        except Exception as exc:
            return {
                "status": "error",
                "message": (
                    f"Hindsight retain failed: "
                    f"{type(exc).__name__}: {exc}"
                ),
            }


    async def aclose(self) -> None:
        """Close the Hindsight client during application shutdown."""
        if self._client is not None:
            await self._client.aclose()

memory = IncidentMemory()
