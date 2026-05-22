import os
import re
from typing import TypedDict
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from groq import Groq
from langgraph.graph import StateGraph, END

load_dotenv()

app = FastAPI()

# ─────────────────────────────────────────
# KNOWLEDGE BASE (Finance Bill 2026)
# ─────────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_PATH = os.path.join(BASE_DIR, "Finance_Bill_2026.txt")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    RAW_TEXT = f.read()

PARAGRAPHS = [p.strip() for p in RAW_TEXT.split("\n\n") if p.strip()]

# ─────────────────────────────────────────
# TOPIC CLASSIFICATION MAP
# ─────────────────────────────────────────
TOPIC_KEYWORDS = {
    "income_tax": [
        "income tax", "paye", "salary", "employment", "gratuity", "pension",
        "withholding", "royalty", "management fee", "professional fee",
        "motor vehicle tax", "non-resident", "resident", "benefit", "threshold",
        "housing loan", "scrap metal", "winnings", "betting", "gambling",
        "digital content", "content creator", "youtube", "tiktok", "influencer",
        "shipping", "trust", "dividend", "interest", "capital gains"
    ],
    "vat": [
        "vat", "value added tax", "zero rated", "exempt", "standard rated",
        "bread", "electric bus", "solar", "motorcycle", "mobile phone",
        "handset", "sugarcane", "financial services", "payment gateway",
        "merchant", "input tax", "taxable supply"
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
        "virtual asset service provider", "langgraph", "prepopulated return",
        "tax avoidance", "scheme", "kra", "commissioner"
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

# ─────────────────────────────────────────
# CONTEXT RETRIEVAL
# ─────────────────────────────────────────
def retrieve_context(query: str, topic: str) -> str:
    tokens = re.findall(r"\w+", query.lower())
    scored = []
    for para in PARAGRAPHS:
        lowered = para.lower()
        score = sum(1 for tok in tokens if tok in lowered)
        if score > 0:
            scored.append((score, para))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [p for _, p in scored[:5]]
    return "\n\n".join(top) if top else (PARAGRAPHS[0] if PARAGRAPHS else "")

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
        return "GROQ_API_KEY is not set. Please configure it in Vercel environment variables."
    last_error = None
    for key in keys:
        try:
            client = Groq(api_key=key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1024,
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
    is_out_of_scope: bool

# ─────────────────────────────────────────
# LANGGRAPH NODES
# ─────────────────────────────────────────
def node_classify(state: AgentState) -> AgentState:
    topic = classify_topic(state["query"])
    out_of_scope = topic == "general" and not any(
        kw in state["query"].lower()
        for kw in ["finance bill", "tax", "kenya", "kra", "levy", "duty", "vat"]
    )
    return {**state, "topic": topic, "is_out_of_scope": out_of_scope}

def node_retrieve(state: AgentState) -> AgentState:
    context = retrieve_context(state["query"], state["topic"])
    return {**state, "context": context}

def node_reason(state: AgentState) -> AgentState:
    topic_labels = {
        "income_tax": "Income Tax Act",
        "vat": "Value Added Tax Act",
        "excise_duty": "Excise Duty Act",
        "tax_procedures": "Tax Procedures Act",
        "miscellaneous": "Miscellaneous Fees and Levies / Road Maintenance Levy",
        "general": "Finance Bill 2026"
    }
    topic_label = topic_labels.get(state["topic"], "Finance Bill 2026")

    prompt = f"""You are a Senior Tax Advisor specializing in the Kenya Finance Bill 2026.

STRICT RULES:
1. Answer ONLY based on the Finance Bill 2026 context provided below.
2. Do NOT use asterisks (*), hash symbols (#), or markdown formatting.
3. Use plain paragraphs. If listing items, use numbers like 1. 2. 3.
4. If a point is important, write it in CAPITAL LETTERS instead of bold.
5. Be specific — quote exact rates, section numbers, and amounts from the context.
6. Explain in simple terms relatable to ordinary Kenyans (matatu, duka, boda boda, mama mboga).
7. Match the language of the question — if asked in Swahili or Sheng, reply in that language.
8. Do NOT mention the Finance Bill 2025 unless explicitly asked.
9. IMPORTANT: Bread REMAINS ZERO-RATED under the Finance Bill 2026. It will NOT increase in price due to VAT.

Topic Area: {topic_label}

Relevant Context from Finance Bill 2026:
{state["context"]}

User Question: {state["query"]}

Answer:"""

    answer = call_groq(prompt)
    # Clean up any remaining markdown
    answer = re.sub(r"#{1,6}\s*", "", answer)
    answer = re.sub(r"\*\*(.*?)\*\*", r"\1", answer)
    answer = re.sub(r"\*(.*?)\*", r"\1", answer)
    answer = re.sub(r" {2,}", " ", answer)
    return {**state, "answer": answer.strip()}

def node_fallback(state: AgentState) -> AgentState:
    answer = (
        "That question appears to be outside the scope of the Finance Bill 2026. "
        "I can only answer questions about the Kenya Finance Bill 2026, including income tax changes, "
        "VAT amendments, excise duty, motor vehicle tax, eco levy, digital services tax, "
        "and tax procedures. For other matters, please consult KRA at www.kra.go.ke "
        "or a qualified tax professional."
    )
    return {**state, "answer": answer}

def route_after_classify(state: AgentState) -> str:
    return "fallback" if state["is_out_of_scope"] else "retrieve"

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
async def health_check():
    return {"status": "ok", "message": "Finance Bill 2026 LangGraph Agent is running"}

@app.post("/api/ask")
@app.post("/")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing `query` field"}, status_code=400)

    initial_state: AgentState = {
        "query": query,
        "topic": "",
        "context": "",
        "answer": "",
        "is_out_of_scope": False
    }

    result = agent.invoke(initial_state)
    return JSONResponse({"answer": result["answer"]})
