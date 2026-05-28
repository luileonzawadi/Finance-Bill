import os
import re
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
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

LANDING_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kenya Finance Bill 2026 — Q&amp;A Assistant</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50">

  <!-- Header -->
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
      <span class="text-3xl">🇰🇪</span>
      <div>
        <h1 class="text-xl font-bold text-gray-900 leading-tight">Finance Bill 2026 Q&amp;A</h1>
        <p class="text-sm text-gray-500">Kenya's official Finance Bill explained simply</p>
      </div>
    </div>
  </header>

  <!-- Hero -->
  <main class="max-w-4xl mx-auto px-6 py-14">
    <div class="text-center mb-12">
      <span class="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
        AI-Powered Assistant
      </span>
      <h2 class="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
        Understand Kenya's<br/>Finance Bill 2026
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Get plain-language answers about new taxes, levies, and changes that affect
        everyday Kenyans — from motor vehicle tax to digital content creators.
      </p>
    </div>

    <!-- What's covered -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="text-2xl mb-2">🚗</div>
        <h3 class="font-semibold text-gray-800 mb-1">Motor Vehicle Tax</h3>
        <p class="text-sm text-gray-500">2.5% annual levy on vehicle value, collected via insurance. Min Ksh 5,000 · Max Ksh 100,000.</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="text-2xl mb-2">📱</div>
        <h3 class="font-semibold text-gray-800 mb-1">Digital &amp; Tech Levies</h3>
        <p class="text-sm text-gray-500">Eco levy on devices, 25% excise on imported phones, and WHT for digital content creators.</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="text-2xl mb-2">⛽</div>
        <h3 class="font-semibold text-gray-800 mb-1">Fuel &amp; Road Levy</h3>
        <p class="text-sm text-gray-500">Road Maintenance Levy cut from Ksh 3 to Ksh 1.50 per litre — fuel prices drop slightly.</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="text-2xl mb-2">🍞</div>
        <h3 class="font-semibold text-gray-800 mb-1">Bread &amp; VAT</h3>
        <p class="text-sm text-gray-500">Bread remains zero-rated. No price increase. Bakers continue to recover input VAT.</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="text-2xl mb-2">🏠</div>
        <h3 class="font-semibold text-gray-800 mb-1">Employee Benefits</h3>
        <p class="text-sm text-gray-500">Tax-free non-cash benefits raised from Ksh 2,000 to Ksh 10,000/month. Housing loan deduction up to Ksh 360,000/year.</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="text-2xl mb-2">🎰</div>
        <h3 class="font-semibold text-gray-800 mb-1">Gambling &amp; Crypto</h3>
        <p class="text-sm text-gray-500">20% WHT on net gambling winnings. Virtual asset providers must file KRA information returns.</p>
      </div>
    </div>

    <!-- Try it -->
    <div class="bg-white rounded-3xl border border-gray-200 shadow-md p-8 mb-10">
      <h3 class="text-xl font-bold text-gray-900 mb-2">Try the API</h3>
      <p class="text-gray-500 text-sm mb-6">
        Send a <code class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-xs">POST</code> request to
        <code class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-xs">/api/ask</code> with a JSON body:
      </p>

      <!-- Interactive form -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2" for="queryInput">Ask a question</label>
        <div class="flex gap-3">
          <input
            id="queryInput"
            type="text"
            placeholder="e.g. How much motor vehicle tax will I pay for a Ksh 1M car?"
            class="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
          <button
            onclick="askQuestion()"
            class="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Ask
          </button>
        </div>
        <div id="answerBox" class="hidden mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap"></div>
        <div id="errorBox" class="hidden mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"></div>
        <div id="loadingBox" class="hidden mt-4 text-sm text-gray-500 animate-pulse">Thinking...</div>
      </div>

      <!-- cURL example -->
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Or via cURL</p>
      <pre class="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">curl -X POST https://&lt;your-domain&gt;/api/ask \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What is the motor vehicle tax rate?"}'</pre>

      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-5 mb-2">Response format</p>
      <pre class="bg-gray-900 text-blue-300 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">{"answer": "The motor vehicle tax is 2.5% of the vehicle value per year..."}</pre>
    </div>

    <!-- Footer note -->
    <p class="text-center text-xs text-gray-400">
      Powered by Groq · LLaMA 3.3 70B · Data sourced from Kenya Gazette Supplement No. 113, 5th May 2026 ·
      <a href="/health" class="underline hover:text-gray-600">Service status</a>
    </p>
  </main>

  <script>
    async function askQuestion() {
      const input = document.getElementById('queryInput');
      const answerBox = document.getElementById('answerBox');
      const errorBox = document.getElementById('errorBox');
      const loadingBox = document.getElementById('loadingBox');
      const query = input.value.trim();

      if (!query) return;

      answerBox.classList.add('hidden');
      errorBox.classList.add('hidden');
      loadingBox.classList.remove('hidden');

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        loadingBox.classList.add('hidden');
        if (data.answer) {
          answerBox.textContent = data.answer;
          answerBox.classList.remove('hidden');
        } else {
          errorBox.textContent = data.error || 'Unexpected response from server.';
          errorBox.classList.remove('hidden');
        }
      } catch (err) {
        loadingBox.classList.add('hidden');
        errorBox.textContent = 'Failed to reach the API. Please try again.';
        errorBox.classList.remove('hidden');
      }
    }

    document.getElementById('queryInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') askQuestion();
    });
  </script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def landing():
    return HTMLResponse(content=LANDING_HTML)


@app.get("/health")
async def health():
    keys = get_groq_keys()
    return {"status": "ok", "groq_configured": len(keys) > 0, "key_count": len(keys)}


@app.post("/api/ask")
async def ask(request: Request):
    payload = await request.json()
    query = payload.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Missing query field"}, status_code=400)
    answer = call_groq(query)
    return JSONResponse({"answer": answer})
