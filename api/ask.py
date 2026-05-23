import os
import re
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from groq import Groq

load_dotenv()

app = FastAPI()

KNOWLEDGE_BASE = """
THE FINANCE BILL, 2026 — OFFICIAL KENYA GAZETTE SUPPLEMENT NO. 113
Published: 5th May 2026 | Kenya National Assembly

INCOME TAX ACT AMENDMENTS:

ROYALTIES: Now includes payments for proprietary software (licensing, development, training, maintenance, support). Also includes fees for access to digital platforms, card networks (Visa, Mastercard), payment schemes, clearing and switching systems. All subject to Withholding Tax (WHT).

MANAGEMENT OR PROFESSIONAL FEES: Now includes merchant service fees and card interchange fees. Subject to WHT.

WINNINGS: Defined per Gambling Control Act 2025. Winnings = payout minus stake. Only net gain is taxable.

NON-CASH EMPLOYEE BENEFITS: Tax-free threshold increased from Ksh 2,000 to Ksh 10,000 per month. Includes meals, airtime, gym, transport from employer.

GRATUITY EXEMPTION: Exempt only if contract is at least 3 years continuous service and amount does not exceed 31% of basic salary per year of service.

NON-RESIDENT RENTAL INCOME TAX (New Section 6B): New final WHT on rental income earned in Kenya by non-residents. Must register on KRA digital portal and file/pay by 20th of following month.

SHIPPING TAX: Must be paid within 5 days of payment receipt or ship departure, whichever is earlier.

DIGITAL CONTENT MONETIZATION WHT: Resident creators 5% WHT. Non-resident creators 20% WHT. Covers YouTube, TikTok, Instagram, podcasts, online courses, brand deals.

SCRAP METAL WHT: Payments for scrap metal purchases now subject to WHT at 1.5% of gross amount.

GAMBLING AND BETTING WINNINGS WHT: WHT on net winnings at 20%. Betting companies deduct before paying players.

MOTOR VEHICLE TAX (New Section 12B): Rate is 2.5% of vehicle value per year. Minimum Ksh 5,000/year. Maximum Ksh 100,000/year. Collected by insurance companies when issuing or renewing motor vehicle insurance. Insurers remit to KRA within 5 working days. Penalty for insurers: 2% of uncollected tax per month. Exemptions: Government vehicles, ambulances, fire engines, diplomatic vehicles, registered charities. Examples: Car worth Ksh 200,000 pays Ksh 5,000/year. Car worth Ksh 1,000,000 pays Ksh 25,000/year. Car worth Ksh 4,000,000 pays capped Ksh 100,000/year.

HOUSING LOAN INTEREST DEDUCTION: Employees repaying CBK housing loans can deduct interest up to Ksh 360,000 per year from taxable income.

DIGITAL SERVICES TAX (DST): Expanded from non-residents only to include resident local digital platforms. Rate 1.5% of gross transaction value. Covers streaming, ride-hailing (Uber, Bolt), food delivery, e-commerce, online advertising, cloud services.

VAT ACT AMENDMENTS:

BREAD VAT STATUS: BREAD REMAINS ZERO-RATED. It was NOT moved to standard-rated 16% VAT. Bread prices will NOT increase due to this Bill. Bakers can still recover input VAT.

VAT RECLASSIFICATION ZERO-RATED TO EXEMPT: Moved to Exempt: electric motorcycles, electric buses, solar panels, basic mobile handsets, sugarcane transport. Zero-Rated means supplier can claim input VAT back. Exempt means supplier cannot claim input VAT back.

VAT ON FINANCIAL SERVICES: Merchant acquiring services, card processing fees, payment gateway services now subject to VAT.

EXCISE DUTY ACT AMENDMENTS:

ECO LEVY: Smartphones, tablets, laptops Ksh 228 per unit. Desktop computers and monitors Ksh 300 per unit. Lithium-ion batteries Ksh 350 per unit. Rubber tyres Ksh 1,000 per tyre. Non-biodegradable plastic packaging Ksh 98 per kg. Diapers and sanitary products with plastic Ksh 150 per package.

EXCISE DUTY ON IMPORTED MOBILE PHONES: Previous rate 10%. New rate 25%. Increase of 15 percentage points. Purpose is to encourage local phone assembly.

ROAD MAINTENANCE LEVY REDUCTION: Reduced from Ksh 3 to Ksh 1.50 per litre of fuel. Purpose is to lower fuel pump prices and reduce transport costs.

TAX PROCEDURES ACT AMENDMENTS:

eTIMS: All businesses must use Electronic Tax Invoice Management System for real-time reporting to KRA. Non-compliance fines: Ksh 100,000 for companies, Ksh 10,000 for individuals.

KRA ENFORCEMENT: KRA can access bank records, M-Pesa, Airtel Money data without court order for tax evasion cases. Can freeze accounts of persistent defaulters.

TAX AMNESTY: Persons who pay all principal tax due by 31 December 2025 get waiver on penalties and interest.

VIRTUAL ASSET SERVICE PROVIDERS: Must file information returns with KRA on all crypto users and transactions. Penalty for failure: Ksh 1,000,000 per failure.

MISCELLANEOUS:

IMPORT DECLARATION FEE (IDF): 2.5% of customs value.
RAILWAY DEVELOPMENT LEVY (RDL): Maintained at 2% of customs value of all imports.
STAMP DUTY: Exemption extended for real estate investment trust (REIT) property transfers.

IMPLEMENTATION TIMELINE:
1st July 2026: Most sections including income tax, betting, scrap metal.
1st January 2027: Sections 19, 20, 25, 35, 36, 37, 59, 32.
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
        return "GROQ_API_KEY is not configured. Please add it in Vercel Environment Variables under Settings."

    prompt = f"""You are a Senior Tax Advisor for the Kenya Finance Bill 2026.

RULES:
1. Answer ONLY using the knowledge base below.
2. No asterisks, no hash symbols, no markdown. Plain text only.
3. Use numbers for lists: 1. 2. 3.
4. Quote exact rates and amounts from the knowledge base.
5. Explain simply and relate to everyday Kenyan life (matatu, duka, boda boda, mama mboga).
6. Match the user language. If asked in Swahili or Sheng, reply in that language.
7. BREAD REMAINS ZERO-RATED. It will NOT increase in price.
8. If question is outside scope, say so and refer to KRA at www.kra.go.ke.

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

    return f"Service temporarily unavailable. Please try again. Error: {str(last_error)}"

@app.get("/")
async def health():
    return {"status": "ok", "message": "Finance Bill 2026 AI running"}

@app.post("/api/ask")
@app.post("/")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing query field"}, status_code=400)
    answer = call_groq(query)
    return JSONResponse({"answer": answer})
