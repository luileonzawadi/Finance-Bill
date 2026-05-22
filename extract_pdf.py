import re, sys, pdfplumber
from pathlib import Path

PDF_PATH = Path("Finance_Bill_2026.pdf")
OUTPUT_PATH = Path("Finance_Bill_2026.txt")

def clean(text):
    text = re.sub(r"-\n(\w)", r"\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"^\s*\d{1,4}\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"The Finance Bill,?\s*2026\s*\n", "", text)
    return text.strip()

with pdfplumber.open(str(PDF_PATH)) as pdf:
    pages = []
    for i, page in enumerate(pdf.pages, 1):
        txt = page.extract_text(x_tolerance=2, y_tolerance=3)
        if txt:
            pages.append(txt)
        if i % 20 == 0:
            print(f"Page {i}/{len(pdf.pages)}")

OUTPUT_PATH.write_text(clean("\n\n".join(pages)), encoding="utf-8")
print(f"Done. Words: {len(OUTPUT_PATH.read_text().split()):,}")
