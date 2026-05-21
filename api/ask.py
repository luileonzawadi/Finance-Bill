import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from groq import Groq
app = FastAPI()

# -------------------------------------------------
# Load data – executed once per cold start
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_PATH = os.path.join(BASE_DIR, "data", "Finance_Bill_2026.txt")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    RAW_TEXT = f.read()

# Split into paragraphs (blank line = new paragraph)
PARAGRAPHS = [p.strip() for p in RAW_TEXT.split("\n\n") if p.strip()]

# Load the embedding model (cached for the lifetime of the function)
MODEL = SentenceTransformer("all-mpnet-base-v2")
EMB_PARAGRAPHS = MODEL.encode(PARAGRAPHS, show_progress_bar=False, convert_to_numpy=True)

# -------------------------------------------------
def best_match(query: str, top_k: int = 3):
    """Return the top‑k most similar paragraphs and their cosine scores."""
    q_vec = MODEL.encode([query], convert_to_numpy=True)
    sims = cosine_similarity(q_vec, EMB_PARAGRAPHS)[0]
    idxs = np.argsort(sims)[::-1][:top_k]
    return [(i, PARAGRAPHS[i], float(sims[i])) for i in idxs]

# The exact paragraph from the Finance Bill is returned.
# No summarisation or paraphrasing is used.

# -------------------------------------------------
@app.post("/api/ask")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing `query` field"}, status_code=400)

    matches = best_match(query, top_k=3)
    best_idx, best_para, confidence = matches[0]

    # Use Groq to explain the text with examples
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            client = Groq(api_key=groq_api_key)
            prompt = f"""You are a helpful assistant explaining the Kenya Finance Bill 2026.
Based on the following exact text from the bill, provide an explanation.

Rules:
1. First, quote the relevant text exactly as it is.
2. Then, explain what it means using simple, practical examples.
3. Arrange your detailed response in clear paragraphs.
4. STRICTLY do not include any information or rules that are not in the provided text.

Text from the bill:
{best_para}

Question:
{query}
"""
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            answer = completion.choices[0].message.content
        except Exception as e:
            answer = f"{best_para}\n\n(Error connecting to AI for explanation: {str(e)})"
    else:
        answer = f"{best_para}\n\n(Note: Set GROQ_API_KEY in Vercel to get detailed explanations and examples)"

    return JSONResponse({
        "answer": answer,
        "source": f"Paragraph {best_idx + 1}",
        "confidence": round(confidence, 3),
    })

# -------------------------------------------------
# expose the FastAPI app for Vercel's serverless handler
handler = app
