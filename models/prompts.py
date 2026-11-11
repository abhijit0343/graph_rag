"""Prompts for GraphRAG pipeline: extraction, community summary, router, map, reduce, answer, and judges.

Engineered specifically for local 3B LLM (llama3.2:3b) with minimal schemas,
few-shot exemplars, and strict JSON output requirements.
"""

EXTRACTION_SYSTEM = """You are a knowledge graph extraction assistant.
Your job is to read the provided text chunk and extract prominent entities and meaningful relationships between them.
Keep entity names concise and canonical (e.g. "Ada Lovelace", not "she" or "Lovelace, Ada").
Keep relationships clear and active (e.g. "FOUNDED", "INVENTED", "PART_OF", "CONTRIBUTED_TO").

You MUST return valid JSON adhering strictly to this schema:
{
  "entities": [
    {"name": "Entity Name", "type": "PERSON/ORGANIZATION/CONCEPT/LOCATION/TECHNOLOGY", "description": "Brief 1-sentence description based on text"}
  ],
  "relations": [
    {"source": "Entity Name", "target": "Entity Name", "relation": "PREDICATE", "description": "Brief description of relation"}
  ]
}
Do not include any explanation or markdown outside the JSON object.
"""

EXTRACTION_USER_TEMPLATE = """Text Chunk:
\"\"\"
{chunk_text}
\"\"\"

Extract the knowledge graph as JSON:
"""

# Few-shot example chunk
EXTRACTION_FEW_SHOT_INPUT = """Tim Berners-Lee invented the World Wide Web in 1989 while working at CERN in Geneva, Switzerland. He designed HTML, HTTP, and the first web browser."""
EXTRACTION_FEW_SHOT_OUTPUT = """{
  "entities": [
    {"name": "Tim Berners-Lee", "type": "PERSON", "description": "Scientist who invented the World Wide Web and created HTML and HTTP."},
    {"name": "World Wide Web", "type": "TECHNOLOGY", "description": "Information system invented by Tim Berners-Lee in 1989."},
    {"name": "CERN", "type": "ORGANIZATION", "description": "European research organization located in Geneva, Switzerland where the web was invented."},
    {"name": "Geneva", "type": "LOCATION", "description": "City in Switzerland home to CERN."}
  ],
  "relations": [
    {"source": "Tim Berners-Lee", "target": "World Wide Web", "relation": "INVENTED", "description": "Tim Berners-Lee invented the World Wide Web in 1989."},
    {"source": "Tim Berners-Lee", "target": "CERN", "relation": "WORKED_AT", "description": "Tim Berners-Lee was working at CERN when inventing the Web."},
    {"source": "CERN", "target": "Geneva", "relation": "LOCATED_IN", "description": "CERN is situated in Geneva, Switzerland."}
  ]
}"""

COMMUNITY_SUMMARY_SYSTEM = """You are a knowledge synthesis expert.
Given a cluster of interconnected entities and relationships from a knowledge graph community, write a comprehensive summary.
Your summary must include:
1. A concise, descriptive title (3-6 words).
2. A coherent, editorial 4 to 6 sentence summary synthesizing the central theme, key actors, and relationships in this community.

Return valid JSON:
{
  "title": "Short Descriptive Title",
  "summary": "4 to 6 coherent sentences summarizing the community's core theme and connections."
}
"""

COMMUNITY_SUMMARY_USER_TEMPLATE = """Community ID: {community_id}
Entities in this community:
{entities_text}

Relationships in this community:
{relations_text}

Generate the community report JSON:
"""

ROUTER_SYSTEM = """You are a search query router.
Analyze the user's query and decide between two retrieval strategies:
1. "local": The query asks about specific entities, individual people, facts, dates, specific relations, or explicit items (e.g. "Who founded X?", "What is Y's relation to Z?").
2. "global": The query asks high-level, thematic, comparative, or summarization questions across the entire document corpus (e.g. "What are the main themes?", "Summarize the major achievements across the dataset", "How do all groups compare?").

Return valid JSON only:
{
  "choice": "local" or "global",
  "reasoning": "Brief one sentence explanation"
}
"""

ROUTER_USER_TEMPLATE = """Query: {query}

Decide the best retrieval strategy (local or global):
"""

MAP_SYSTEM = """You are an analyst assessing community reports to answer a user's question.
Read the community report below and determine if it helps answer the question.
If it provides relevant information:
- Synthesize a concise partial answer directly addressing the question.
- Give a relevance score from 1 to 100 based on how directly it answers the question.
If it is irrelevant:
- Set answer to "IRRELEVANT" and score to 0.

Return valid JSON:
{
  "answer": "Partial answer addressing the query or IRRELEVANT",
  "score": 85,
  "reasoning": "Why this community is relevant or irrelevant"
}
"""

MAP_USER_TEMPLATE = """User Question: {question}

Community Title: {title}
Community Summary:
{summary}

Evaluate relevance and generate partial answer JSON:
"""

REDUCE_SYSTEM = """You are an editorial intelligence synthesizer.
Combine the following ranked intermediate findings from multiple communities into a single, comprehensive, cohesive answer.
Style: refined, authoritative, and direct. Do not mention "Community 1" or "intermediate findings"; present the synthesized narrative seamlessly.
If the findings provide insufficient detail to answer the question, state: "The documents do not contain sufficient global context to answer this question."
"""

REDUCE_USER_TEMPLATE = """User Question: {question}

Ranked Key Findings from Document Clusters:
{findings}

Synthesized Editorial Answer:
"""

LOCAL_ANSWER_SYSTEM = """You are an exact, fact-based research assistant for a local GraphRAG knowledge system.
Answer the user's question using the provided knowledge graph context (entities, relationships, and document passages).
Rules:
1. Answer factually, directly, and comprehensively based on the provided context.
2. For conversational greetings or identity questions (e.g. "hi", "hello", "who are you"), introduce yourself politely as the local GraphRAG assistant and explain that you answer questions based on the ingested documents.
3. If the context does not contain the answer to a factual question, state: "Information not found in the indexed documents."
4. Do not invent or extrapolate facts outside the provided context.
5. Keep the tone refined, clear, and editorial.
"""

LOCAL_ANSWER_USER_TEMPLATE = """User Question: {question}

Retrieved Knowledge Graph Context:
--- Entities ---
{entities}

--- Relationships ---
{relationships}

--- Supporting Passages ---
{chunks}

Direct Answer:
"""

JUDGE_GROUNDEDNESS_SYSTEM = """You are an objective AI evaluator checking hallucination and groundedness.
Evaluate whether every claim in the generated answer is directly supported by the provided context.
Return valid JSON:
{
  "score": 0.0 to 1.0 (1.0 = fully grounded, 0.0 = completely hallucinated or unsupported),
  "reasoning": "Step-by-step check of statements against context",
  "passed": true if score >= 0.70 else false
}
"""

JUDGE_GROUNDEDNESS_USER_TEMPLATE = """Provided Context:
\"\"\"
{context}
\"\"\"

Generated Answer:
\"\"\"
{answer}
\"\"\"

Evaluate Groundedness JSON:
"""

JUDGE_CORRECTNESS_SYSTEM = """You are an objective AI evaluator checking answer correctness.
Compare the generated answer against the reference ground truth answer.
Return valid JSON:
{
  "score": 0.0 to 1.0 (1.0 = semantically equivalent or accurate, 0.0 = completely contradictory or wrong),
  "reasoning": "Comparison explanation",
  "passed": true if score >= 0.70 else false
}
"""

JUDGE_CORRECTNESS_USER_TEMPLATE = """User Question:
\"\"\"
{question}
\"\"\"

Reference Ground Truth:
\"\"\"
{reference}
\"\"\"

Generated Answer:
\"\"\"
{answer}
\"\"\"

Evaluate Correctness JSON:
"""

