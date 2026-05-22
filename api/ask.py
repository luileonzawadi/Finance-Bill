import os
import re
from typing import TypedDict
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from groq import Groq
from langgraph.graph import StateGraph, END
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

load_dotenv()

app = FastAPI()

# ─────────────────────────────────────────
# LOAD CHROMADB RAG INDEX
# ─────────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_DIR = os.path.join(BASE_DIR, "chroma_index")

_collection = None

def get_collection():
    global _collection
    if _collection is None:
        ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        client = chromadb.PersistentClient(path=INDEX_DIR)
        # Build index if it doesn't exist
        existing = [c.name for c in client.list_collections()]
        if "finance_bill_2026" not in existing:
            _build_index(client, ef)
        _collection = client.get_collection(
            name="finance_bill_2026",
            embedding_function=ef
        )
    return _collection

def _build_index(client, ef):
    text_path = os.path.join(BASE_DIR, "Finance_Bill_2026.txt")
    with open(text_path, "r", encoding="utf-8") as f:
        raw = f.read()
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    raw = re.sub(r"[ \t]+", " ", raw)
    words = raw.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i+400]))
        i += 320
    collection = client.create_collection(
        name="finance_bill_2026",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )
    for i in range(0, len(chunks), 100):
        batch = chunks[i:i+100]
        collection.add(documents=batch, ids=[f"chunk_{i+j}" for j in range(len(batch))])

# ─────────────────────────────────────────
# TOPIC CLASSIFICATION
# ─────────────────────────────────────────
TOPIC_KEYWORDS = {
    "income_tax": [
        "income tax", "paye", "salary", "employment", "gratuity", "pension",
        "withholding", "royalty", "management fee", "professional fee",
        "motor vehicle tax", "non-resident", "benefit", "threshold",
        "housing loan", "scrap metal", "winnings", "betting", "gambling",
        "digital content", "content creator", "youtube", "tiktok", "influencer",
        "shipping", "trust", "dividend", "interest", "capital gains", "instalment tax"
    ],
    "vat": [
        "vat", "value added tax", "zero rated", "exempt", "standard rated",
        "bread", "electric bus", "solar", "motorcycle", "mobile phone",
        "handset", "sugarcane", "financial services", "payment gateway",
        "merchant", "input tax", "taxable supply", "zero-rated"
    ],
    "excise_duty": [
        "excise", "excise duty", "imported phone", "cellular", "tobacco",
        "cigarette", "alcohol", "beer", "spirits", "betting", "gaming",
        "virtual asset", "coal", "antique vehicle", "fruit juice",
        "plastic", "ceramic", "furniture", "glass", "paper", "kraft"
    ],
    "tax_procedures": [
        "tax procedures", "etims", "electronic invoice", "pin", "registration",
        "deregistration", "penalty", "interest", "amnesty", "refund",
        "overpayment", "objection", "appeal", "audit", "assessment",
        "virtual asset service provider", "prepopulated return",
        "tax avoidance", "scheme", "kra", "commissioner", "compliance"
    ],
    "miscellaneous": [
        "import declaration", "idf", "railway development levy", "rdl",
        "road maintenance levy", "fuel", "stamp duty", "real estate",
        "reit", "infrastructure", "public private partnership"
    ]
}

def classify_topic(query: str) -> str:
    q = query.lower()
    scores = {topic: 0 for topic in TOPIC_KEYWORDS}
    for topic, keywords in TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                scores[topic] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"

def is_out_of_scope(query: str, topic: str) -> bool:
    if topic != "general":
        return False
    finance_keywords = [
        "finance bill", "tax", "kenya", "kra", "levy", "duty", "vat",
        "income", "excise", "bill", "2026", "act", "parliament"
    ]
    return not any(kw in query.lower() for kw in finance_keywords)

# ─────────────────────────────────────────
# RAG RETRIEVAL
# ─────────────────────────────────────────
def retrieve_context(query: str, n_results: int = 6) -> str:
    try:
        collection = get_collection()
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        docs = results["documents"][0] if results["documents"] else []
        return "\n\n---\n\n".join(docs)
    except Exception as e:
        # Fallback to keyword search if ChromaDB fails
        return fallback_keyword_search(query)

def fallback_keyword_search(query: str) -> str:
    try:
        text_path = os.path.join(BASE_DIR, "Finance_Bill_2026.txt")
        with open(text_path, "r", encoding="utf-8") as f:
            raw = f.read()
        paragraphs = [p.strip() for p in raw.split("\n\n") if p.strip()]
        tokens = re.findall(r"\w+", query.lower())
        scored = []
        for para in paragraphs:
            score = sum(1 for tok in tokens if tok in para.lower())
            if score > 0:
                scored.append((score, para))
        scored.sort(key=lambda x: x[0], reverse=True)
        return "\n\n".join(p for _, p in scored[:5])
    except Exception:
        return "Finance Bill 2026 context unavailable."

# ─────────────────────────────────────────
# GROQ CLIENT
# ─────────────────────────────────────────
def get_groq_keys():
    keys = []
    primary = os.getenv("GROQ_API_KEY", "").strip()
    if primary:
        keys.append(primary)
    extras = os.getenv("GROQ_API_KEYS", "")
    if extras:
        keys.extend([k.strip() for k in extras.split(",") if k.strip()])
    return list(dict.fromkeys(keys))

def call_groq(prompt: str) -> str:
    keys = get_groq_keys()
    if not keys:
        return "GROQ_API_KEY is not configured. Please set it in Vercel environment variables."
    last_error = None
    for key in keys:
        try:
            client = Groq(api_key=key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1200,
            )
            return completion.choices[0].message.content
        except Exception as e:
            last_error = e
            continue
    return f"All Groq API keys failed. Last error: {str(last_error)}"

# ─────────────────────────────────────────
# LANGGRAPH STATE
# ─────────────────────────────────────────
class AgentState(TypedDict):
    query: str
    topic: str
    context: str
    answer: str
    out_of_scope: bool

# ─────────────────────────────────────────
# LANGGRAPH NODES
# ─────────────────────────────────────────
def node_classify(state: AgentState) -> AgentState:
    topic = classify_topic(state["query"])
    out_of_scope = is_out_of_scope(state["query"], topic)
    return {**state, "topic": topic, "out_of_scope": out_of_scope}

def node_retrieve(state: AgentState) -> AgentState:
    context = retrieve_context(state["query"])
    return {**state, "context": context}

def node_reason(state: AgentState) -> AgentState:
    topic_labels = {
        "income_tax": "Income Tax Act (Cap. 470)",
        "vat": "Value Added Tax Act",
        "excise_duty": "Excise Duty Act",
        "tax_procedures": "Tax Procedures Act",
        "miscellaneous": "Miscellaneous Fees, Levies and Road Maintenance",
        "general": "Finance Bill 2026"
    }
    topic_label = topic_labels.get(state["topic"], "Finance Bill 2026")

    prompt = f"""You are a Senior Tax Advisor specializing in the Kenya Finance Bill 2026.

STRICT RULES:
1. Answer ONLY using the context provided below from the Finance Bill 2026.
2. Do NOT use asterisks (*), hash symbols (#), or any markdown formatting.
3. Write in plain paragraphs. For lists use numbers: 1. 2. 3.
4. For important points write them in CAPITAL LETTERS.
5. Quote exact rates, section numbers, and amounts from the context.
6. Explain in simple terms relatable to ordinary Kenyans (matatu, duka, boda boda, mama mboga).
7. Match the language of the question. If asked in Swahili or Sheng, reply in that language.
8. CRITICAL: Bread REMAINS ZERO-RATED under the Finance Bill 2026. It will NOT increase in price.
9. If the context does not contain enough information to answer, say so honestly.

Topic Area: {topic_label}

Relevant Context from Finance Bill 2026 (retrieved via semantic search):
{state["context"]}

User Question: {state["query"]}

Answer:"""

    raw = call_groq(prompt)

    # Strip all markdown
    clean = re.sub(r"#{1,6}\s*", "", raw)
    clean = re.sub(r"\*\*(.*?)\*\*", r"\1", clean)
    clean = re.sub(r"\*(.*?)\*", r"\1", clean)
    clean = re.sub(r"`{1,3}", "", clean)
    clean = re.sub(r" {2,}", " ", clean)

    return {**state, "answer": clean.strip()}

def node_fallback(state: AgentState) -> AgentState:
    answer = (
        "That question is outside the scope of the Finance Bill 2026. "
        "I can only answer questions about the Kenya Finance Bill 2026 — income tax, "
        "VAT, excise duty, motor vehicle tax, eco levy, digital services tax, "
        "and tax procedures. For other matters, please consult KRA at www.kra.go.ke "
        "or a qualified tax professional."
    )
    return {**state, "answer": answer}

def route_after_classify(state: AgentState) -> str:
    return "fallback" if state["out_of_scope"] else "retrieve"

# ─────────────────────────────────────────
# BUILD LANGGRAPH
# ─────────────────────────────────────────
workflow = StateGraph(AgentState)
workflow.add_node("classify", node_classify)
workflow.add_node("retrieve", node_retrieve)
workflow.add_node("reason", node_reason)
workflow.add_node("fallback", node_fallback)

workflow.set_entry_point("classify")
workflow.add_conditional_edges("classify", route_after_classify, {
    "retrieve": "retrieve",
    "fallback": "fallback"
})
workflow.add_edge("retrieve", "reason")
workflow.add_edge("reason", END)
workflow.add_edge("fallback", END)

agent = workflow.compile()

# ─────────────────────────────────────────
# FASTAPI ENDPOINTS
# ─────────────────────────────────────────
@app.get("/")
async def health():
    return {"status": "ok", "message": "Finance Bill 2026 RAG Agent running"}

@app.post("/api/ask")
@app.post("/")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing query field"}, status_code=400)

    result = agent.invoke({
        "query": query,
        "topic": "",
        "context": "",
        "answer": "",
        "out_of_scope": False
    })

    return JSONResponse({"answer": result["answer"]})
