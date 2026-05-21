import sys
from pathlib import Path
from PyPDF2 import PdfReader

pdf_path = Path('Finance_Bill_2026.pdf')
output_path = Path('Finance_Bill_2026.txt')

if not pdf_path.is_file():
    print(f'PDF not found at {pdf_path}')
    sys.exit(1)

reader = PdfReader(str(pdf_path))
text_parts = []
for page_num, page in enumerate(reader.pages, start=1):
    try:
        txt = page.extract_text()
    except Exception as e:
        txt = ''
        print(f'Error extracting page {page_num}: {e}')
    if txt:
        text_parts.append(txt)

full_text = "\n\n".join(text_parts)
output_path.write_text(full_text, encoding='utf-8')
print(f'Extracted text written to {output_path}')
