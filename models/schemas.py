"""Pydantic schemas for GraphRAG extractions, routing, global search map-reduce, and evaluation."""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class Entity(BaseModel):
    """An extracted entity node from a document chunk."""
    name: str = Field(..., description="Canonical name of the entity, title-cased or standard noun")
    type: str = Field(default="CONCEPT", description="Entity category, e.g. PERSON, ORGANIZATION, CONCEPT, LOCATION, TECHNOLOGY, EVENT")
    description: str = Field(default="", description="1-2 sentence description of what this entity is and does based on text context")


class Relation(BaseModel):
    """A directed semantic relationship between two entities."""
    source: str = Field(..., description="Name of the source entity")
    target: str = Field(..., description="Name of the target entity")
    relation: str = Field(..., description="Concise relationship predicate, e.g. 'CREATED', 'USES', 'PART_OF', 'LOCATED_IN'")
    description: str = Field(default="", description="Brief explanation of how source and target interact in this chunk")
    weight: float = Field(default=1.0, description="Strength or frequency of the relationship")


class Extraction(BaseModel):
    """Container for entities and relations extracted from a chunk."""
    entities: List[Entity] = Field(default_factory=list, description="Extracted unique entities")
    relations: List[Relation] = Field(default_factory=list, description="Extracted relationships between entities")


class Route(BaseModel):
    """Router decision determining query mode: local vs global search."""
    choice: Literal["local", "global"] = Field(
        ...,
        description="'local' for specific questions about named entities, facts, or relationships. 'global' for high-level thematic, comparative, or summarization questions across the entire corpus."
    )
    reasoning: str = Field(default="", description="One-sentence justification for the selected mode")


class MapAnswer(BaseModel):
    """Intermediate answer from one community report during global search."""
    answer: str = Field(..., description="Synthesized partial answer based on this community's report, or 'IRRELEVANT' if unrelated")
    score: int = Field(default=0, ge=0, le=100, description="Relevance score from 0 (completely unrelated) to 100 (directly answers the question)")
    reasoning: str = Field(default="", description="Short rationale for the score")


class JudgeScore(BaseModel):
    """Structured evaluation score from an LLM judge."""
    score: float = Field(..., ge=0.0, le=1.0, description="Normalized score between 0.0 and 1.0")
    reasoning: str = Field(default="", description="Detailed step-by-step reasoning behind the evaluation score")
    passed: bool = Field(default=True, description="True if score >= 0.70")

