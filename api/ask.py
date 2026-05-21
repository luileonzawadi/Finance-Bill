import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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
    answer = best_para

    return JSONResponse({
        "answer": answer,
        "source": f"Paragraph {best_idx + 1}",
        "confidence": round(confidence, 3),
    })

# -------------------------------------------------
# expose the FastAPI app for Vercel's serverless handler
handler = app
