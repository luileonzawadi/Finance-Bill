import os
import re
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from groq import Groq

load_dotenv()
app = FastAPI()

KNOWLEDGE_BASE = """
THE FINANCE BILL, 2026 — KENYA GAZETTE SUPPLEMENT NO. 113, 5th May 2026

MOTOR VEHICLE TAX (New Section 12B Income Tax Act):
Rate: 2.5% of vehicle value per year. Minimum Ksh 5,000/year. Maximum Ksh 100,000/year.
Collected by insurance companies when issuing or renewing motor vehicle insurance.
Insurers remit to KRA within 5 working days. Penalty for insurers: 2% of uncollected tax per month.
Exemptions: Government vehicles, ambulances, fire engines, diplomatic vehicles, registered charities.
Examples: Car worth Ksh 200,000 pays Ksh 5,000/year. Car worth Ksh 1,000,000 pays Ksh 25,000/year. Car worth Ksh 4,000,000 pays capped Ksh 100,000/year.

BREAD VAT: BREAD REMAINS ZERO-RATED. NOT moved to 16% VAT. Bread prices will NOT increase. Bakers still recover input VAT.

ECO LEVY: Smartphones/tablets/laptops Ksh 228/unit. Desktop computers Ksh 300/unit. Lithium-ion batteries Ksh 350/unit. Rubber tyres Ksh 1,000/tyre. Plastic packaging Ksh 98/kg. Diapers with plastic Ksh 150/package.

EXCISE DUTY ON IMPORTED PHONES: Increased from 10% to 25%.

ROAD MAINTENANCE LEVY: Reduced from Ksh 3 to Ksh 1.50 per litre of fuel. Fuel prices will drop slightly.

NON-CASH EMPLOYEE BENEFITS: Tax-free threshold increased from Ksh 2,000 to Ksh 10,000 per month.

HOUSING LOAN INTEREST DEDUCTION: Up to Ksh 360,000 per year deductible for CBK housing loans.

DIGITAL CONTENT MONETIZATION WHT: Resident creators 5% WHT. Non-resident creators 20% WHT. Covers YouTube, TikTok, Instagram, podcasts, brand deals.

DIGITAL SERVICES TAX: 1.5% of gross transaction value. Now covers both resident and non-resident digital platforms including Uber, Bolt, streaming, e-commerce.

SCRAP METAL WHT: 1.5% WHT on scrap metal purchases.

GAMBLING WINNINGS WHT: 20% WHT on net winnings (payout minus stake).

ROYALTIES EXPANDED: Now includes software licensing, development, training, maintenance, support fees. Also card networks (Visa, Mastercard), payment schemes, clearing and switching systems. All subject to WHT.

MANAGEMENT FEES EXPANDED: Now includes merchant service fees and card interchange fees. Subject to WHT.

NON-RESIDENT RENTAL INCOME TAX (New Section 6B): Final WHT on rental income earned in Kenya by non-residents. Register on KRA portal, file and pay by 20th of following month.

GRATUITY EXEMPTION: Exempt only if contract is at least 3 years continuous and amount does not exceed 31% of basic salary per year.

SHIPPING TAX: Must be paid within 5 days of payment receipt or ship departure, whichever is earlier.

eTIMS: All businesses must use Electronic Tax Invoice Management System. Non-compliance: Ksh 100,000 fine for companies, Ksh 10,000 for individuals.

KRA ENFORCEMENT: Can access bank records, M-Pesa, Airtel Money without court order for tax evasion. Can freeze accounts.

TAX AMNESTY: Pay all principal tax due by 31 December 2025 to get waiver on penalties and interest.

VIRTUAL ASSET SERVICE PROVIDERS: Must file information returns with KRA on all crypto users. Penalty: Ksh 1,000,000 per failure.

VAT RECLASSIFICATION ZERO-RATED TO EXEMPT: Electric motorcycles, electric buses, solar panels, basic mobile handsets, sugarcane transport moved from Zero-Rated to Exempt.

IMPORT DECLARATION FEE: 2.5% of customs value.
RAILWAY DEVELOPMENT LEVY: 2% of customs value of all imports.

IMPLEMENTATION: 1st July 2026 for most sections. 1st January 2027 for sections 19, 20, 25, 35, 36, 37, 59, 32.
"""

def get_groq_keys():
    keys = []
    primary = os.getenv("GROQ_API_KEY", "").strip()
    if primary:
        keys.append(primary)
    extras = os.getenv("GROQ_API_KEYS", "")
    if extras:
        keys.extend([k.strip() for k in extras.split(",") if k.strip()])
    return list(dict.fromkeys(keys))

def call_groq(query: str) -> str:
    keys = get_groq_keys()
    if not keys:
        return "GROQ_API_KEY is not set. Go to Vercel dashboard, Settings, Environment Variables and add GROQ_API_KEY, then redeploy."

    prompt = f"""You are a Senior Tax Advisor for the Kenya Finance Bill 2026.

RULES:
1. Answer ONLY using the knowledge base below.
2. No asterisks, no hash symbols, no markdown. Plain text only.
3. Use numbers for lists: 1. 2. 3.
4. Quote exact rates and amounts.
5. Explain simply. Relate to everyday Kenyan life (matatu, duka, boda boda, mama mboga).
6. Match the user language. If Swahili or Sheng, reply in that language.
7. BREAD REMAINS ZERO-RATED. It will NOT increase in price.
8. If outside scope, refer to KRA at www.kra.go.ke.

KNOWLEDGE BASE:
{KNOWLEDGE_BASE}

USER QUESTION: {query}

ANSWER:"""

    last_error = None
    for key in keys:
        try:
            client = Groq(api_key=key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1000,
            )
            raw = completion.choices[0].message.content
            raw = re.sub(r"#{1,6}\s*", "", raw)
            raw = re.sub(r"\*\*(.*?)\*\*", r"\1", raw)
            raw = re.sub(r"\*(.*?)\*", r"\1", raw)
            raw = re.sub(r"`{1,3}", "", raw)
            raw = re.sub(r" {2,}", " ", raw)
            return raw.strip()
        except Exception as e:
            last_error = e
            continue

    return f"Service temporarily unavailable. Error: {str(last_error)}"

@app.get("/api/health")
async def health():
    keys = get_groq_keys()
    return {"status": "ok", "groq_configured": len(keys) > 0, "key_count": len(keys)}

@app.post("/api/ask")
@app.post("/")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing query field"}, status_code=400)
    answer = call_groq(query)
    return JSONResponse({"answer": answer})

@app.post("/api/chat")
async def chat(request: Request):
    try:
        payload = await request.json()
        messages = payload.get("messages", [])
        context = payload.get("context", "")

        if not messages or not context:
            return JSONResponse({"error": "Missing required fields: messages and context"}, status_code=400)
        
        keys = get_groq_keys()
        if not keys:
            return JSONResponse({"error": "Something went wrong. Please try again in a moment."}, status_code=500)

        system_prompt = f"""You are a warm, helpful, and highly accurate Kenyan Finance Bill AI Advisor. Your absolute priority is accuracy and truth, explained in a friendly, conversational, and easy-to-understand manner.
Your knowledge base is strictly limited to the provided GROUND TRUTH CONTEXT.

GROUND TRUTH CONTEXT:
{context}

CRITICAL INSTRUCTIONS:
1. STRICT TOPIC GUARD: You MUST ONLY answer questions directly related to Kenya's economy, taxes, fiscal policy, or the Finance Bills (2025 and 2026).
   If the user asks an off-topic question (anything unrelated to economy, taxes, or the Finance Bill, such as general advice, history of other topics, programming, creative writing, science, etc.), you MUST reply with this exact message:
   "I can only answer questions related to the Kenyan Finance Bill, taxes, and the economy. Please ask a question related to these topics."
2. NO HALLUCINATIONS: Do not invent, extrapolate, or assume any information, tax rates, rates, timelines, or provisions not explicitly mentioned in the GROUND TRUTH CONTEXT. If the context does not contain the answer, you must state: "I cannot find that information in the official 2025/2026 Finance Bill documents."
3. WARM & HUMAN TONE: Be warm, polite, and explanatory. Respond nicely, use friendly greetings, and explain tax concepts simply (relating to everyday Kenyan life like boda boda, mama mboga, matatus, or dukas if helpful). Do not say "Based on the context" or "As an AI..." but do greet the user nicely and explain with friendly, human warmth.
4. ACCURACY IS PARAMOUNT: Statically compare 2025 and 2026 ONLY when the user explicitly asks for comparison. Use 2026 as the default for current questions.
5. MEMORY AND CONTINUITY: You will receive the conversation history. Review past exchanges to maintain continuity, identify references, and build upon previous answers naturally.
6. LANGUAGE: Match the language of the user's question exactly (English, Swahili, or Sheng).
   - If they write in Swahili, respond in warm, polite Swahili (Kiswahili). Use phrases like "Habari!", "Asante kwa swali lako," "Kwa ufupi," or "Karibu!" to sound welcoming.
   - If they write in Sheng, respond in warm, natural Sheng to make them feel comfortable, while keeping tax terms clear."""

        completion_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            completion_messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })

        last_error = None
        for key in keys:
            try:
                client = Groq(api_key=key)
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=completion_messages,
                    temperature=0.1,
                    max_tokens=1000,
                )
                success_response = completion.choices[0].message.content
                return JSONResponse({"response": success_response})
            except Exception as e:
                last_error = e
                continue

        return JSONResponse({"error": f"Something went wrong. Error: {str(last_error)}"}, status_code=500)
    except Exception as e:
        return JSONResponse({"error": f"Server Error: {str(e)}"}, status_code=500)

ALLOWED_STATIC_FILES = {
    "index.html",
    "analysis.html",
    "comparison.html",
    "impact.html",
    "style.css",
    "script.js",
    "config.js",
    "knowledge_base.js",
    "layout.js",
    "robots.txt",
    "sitemap.xml"
}

@app.get("/")
async def serve_index():
    return FileResponse("index.html")

@app.get("/{filename}")
async def get_static_file(filename: str):
    target = filename
    if "." not in target:
        html_file = f"{target}.html"
        if html_file in ALLOWED_STATIC_FILES:
            target = html_file

    if target in ALLOWED_STATIC_FILES:
        file_path = os.path.join(".", target)
        if os.path.exists(file_path):
            return FileResponse(file_path)

    return JSONResponse({"detail": "Not Found"}, status_code=404)

if os.path.exists("images"):
    app.mount("/images", StaticFiles(directory="images"), name="images")
if os.path.exists("layout"):
    app.mount("/layout", StaticFiles(directory="layout"), name="layout")

