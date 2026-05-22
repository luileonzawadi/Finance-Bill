"""
build_index.py
Run this ONCE locally to build the ChromaDB vector index from Finance_Bill_2026.txt

Usage:
    python api/build_index.py
"""

import os
import re
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEXT_PATH = os.path.join(BASE_DIR, "Finance_Bill_2026.txt")
INDEX_DIR = os.path.join(BASE_DIR, "chroma_index")

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80):
    """Split text into overlapping chunks by word count."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def build():
    print("Reading Finance Bill 2026 text...")
    with open(TEXT_PATH, "r", encoding="utf-8") as f:
        raw = f.read()

    # Clean up OCR artifacts
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    raw = re.sub(r"[ \t]+", " ", raw)

    print("Chunking text...")
    chunks = chunk_text(raw, chunk_size=400, overlap=80)
    print(f"Total chunks: {len(chunks)}")

    print("Building ChromaDB index with sentence-transformers embeddings...")
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=INDEX_DIR)

    # Delete existing collection if rebuilding
    try:
        client.delete_collection("finance_bill_2026")
    except Exception:
        pass

    collection = client.create_collection(
        name="finance_bill_2026",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

    # Add in batches of 100
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        ids = [f"chunk_{i + j}" for j in range(len(batch))]
        collection.add(documents=batch, ids=ids)
        print(f"  Indexed chunks {i} to {i + len(batch)}")

    print(f"\nDone! Index saved to: {INDEX_DIR}")
    print(f"Total documents indexed: {collection.count()}")

if __name__ == "__main__":
    build()
