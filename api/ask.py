import os
import re
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from groq import Groq

app = FastAPI()

# Load the Finance Bill text
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_PATH = os.path.join(BASE_DIR, "Finance_Bill_2026.txt")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    RAW_TEXT = f.read()

# Split into paragraphs (blank line denotes a new paragraph)
PARAGRAPHS = [p.strip() for p in RAW_TEXT.split("\n\n") if p.strip()]

def keyword_search(query: str) -> str:
    """Return the first paragraph that contains any word from the query (case‑insensitive)."""
    tokens = re.findall(r"\w+", query.lower())
    for para in PARAGRAPHS:
        lowered = para.lower()
        if any(tok in lowered for tok in tokens):
            return para
    return PARAGRAPHS[0] if PARAGRAPHS else ""

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "FastAPI is running"}

@app.post("/api/ask")
@app.post("/")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing `query` field"}, status_code=400)

    best_para = keyword_search(query)

    # Use Groq to explain with examples
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        client = Groq(api_key=groq_api_key)
        prompt = f"""You are a helpful assistant explaining the Kenya Finance Bill 2026.
Provide an explanation of the following exact paragraph, then give a short practical example.
Quote the paragraph exactly, then explain in clear paragraphs.
Do NOT add any information not present in the paragraph.

Paragraph:\n{best_para}\n\nQuestion: {query}\n"""
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        answer = completion.choices[0].message.content
    else:
        answer = f"{best_para}\n\n(Note: Set GROQ_API_KEY environment variable to get detailed explanation.)"

    return JSONResponse({"answer": answer})
