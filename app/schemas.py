from typing import Literal

from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    # Recent messages from the same conversation, oldest first, so follow-up
    # questions ("what about Jeddah?") can be understood.
    history: list[HistoryMessage] = Field(default_factory=list, max_length=10)
