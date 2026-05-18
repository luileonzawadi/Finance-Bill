// ==========================================
// AI KNOWLEDGE BASE (GROUND TRUTH)
// ==========================================
// This file contains official legislative text and data used by the AI Advisor.

const FINANCE_BILL_CONTEXT = `
OFFICIAL LEGISLATIVE DOCUMENTation: KENYA FINANCE BILLS (2025 & PROPOSED 2026)

--------------------------------------------------
1. THE FINANCE BILL, 2026 (Gazette Supplement No. 113)
--------------------------------------------------
Published: 5th May, 2026. Acts as the primary law proposal.

PROVISION A: MOTOR VEHICLE TAX (Section 12B - Income Tax Act)
- Type: New Wealth Tax on all registered motor vehicles in Kenya.
- Rate: 2.5% of the vehicle's value.
- Value Determination: Set by the KRA Commissioner based on make, model, engine capacity (cc), and year of manufacture.
- Tax Limits: Minimum tax payable is Ksh 5,000; Maximum tax payable is capped at Ksh 100,000.
- Collection Mechanism: Collected by insurance companies at the time of issuing or renewing motor vehicle insurance cover. Insurers must remit this tax to KRA within 5 working days.
- Non-Compliance Penalty: If an insurer fails to collect or remit the tax, they are liable to pay a penalty equal to 2% of the uncollected tax per month.
- Exemptions: Government-owned vehicles, ambulances, fire-fighting vehicles, and vehicles owned by aid agencies or diplomatic missions.

PROVISION B: ECO LEVY / ENVIRONMENTAL TAX (Section 2 - Excise Duty Act)
- Type: Special levy on locally manufactured or imported items that contribute to environmental degradation and electronic waste.
- Target Goods & Rates:
  * Smartphones, Tablets, and Laptops: Ksh 228 per unit.
  * Desktop Computers and Monitors: Ksh 300 per unit.
  * Lithium-ion Batteries: Ksh 350 per unit.
  * Rubber Tires: Ksh 1,000 per tire.
  * Plastics and Non-biodegradable packaging: Ksh 98 per kilogram.
  * Diapers and sanitary items containing plastics: Ksh 150 per package.
- Impact on Citizens: Increases the prices of all electronics, phones, baby diapers, and packaged home commodities in retail shops.

PROVISION C: VAT ON BREAD (Section 8 - Value Added Tax Act)
- 2025 Status: Zero-rated (0% VAT). Bread was cheap and untaxed.
- 2026 Proposal: Standard-rated (16% VAT).
- Impact on Citizens: Directly increases the retail shelf price of a standard 400g loaf of bread by roughly Ksh 10 - Ksh 15, directly raising the cost of breakfast for the common Mwananchi.

PROVISION D: DIGITAL SERVICES & CONTENT MONETIZATION (Section 3 - Income Tax Act)
- Digital Service Tax (DST): Expanded to include domestic/local tech firms and gig workers, not just foreign/non-resident firms.
- Content Creators: Imposes a Withholding Tax (WHT) of 5% for residents and 20% for non-residents on digital content monetization (YouTube earnings, TikTok sponsorships, brand influencer fees).
- Gig Economy: Strict digital tracking via eTIMS for ride-hailing drivers (Uber, Bolt), delivery agents, and online freelancers to ensure tax compliance.

PROVISION E: BENEFIT THRESHOLD (Section 5 - Income Tax Act)
- 2025 Status: Tax-free limit for non-cash employee benefits (like free meals, phone airtime, or gym membership provided by an employer) was capped at Ksh 2,000 per month.
- 2026 Proposal: Limit increased to Ksh 10,000 per month.
- Impact on Citizens: Employees can receive up to Ksh 10,000 in monthly work benefits/perks completely tax-free.

PROVISION F: SPECIFIC TECHNICAL & LEGISLATIVE AMENDMENTS (GAZETTE NO. 113)
- Merchant & Interchange Fees (Section 2): Card interchange fees and merchant service fees are now part of "management or professional fees". They are subject to Withholding Tax (WHT). Affects fintech platforms, banks, and payment networks (Visa/Mastercard).
- Royalty Net Overhaul (Section 2): All proprietary or off-the-shelf software purchases, licencing, development, training, maintenance, or support fees are categorized as "royalties". Access, usage, and participation rights in proprietary digital platforms, card networks, payment schemes, settlement clearing systems, or switching systems are also "royalties". All are subject to Withholding Tax, introducing new reporting duties for startups and IT departments.
- Non-Resident Rental Tax (Section 6B): New final tax on Kenyan rental income earned by non-residents. Foreign property owners must register under a simplified digital portal and file/pay by the 20th of the following month, unless a resident agent handles WHT under 35(3)(j).
- Winnings & Gambling (Section 2 & 10): Payouts and withdrawals are governed by the Gambling Control Act 2025. Winnings (excluding the staked amount) are subject to Withholding Tax.
- Contract Gratuity Perks (Section 3): Exemption on gratuity is allowed only for continuous service contracts of at least 3 years, with deductions capped at 31% of basic salary.
- Housing Loan Deductions (Section 15): Public/private employees repaying CBK housing construction/purchase loans can deduct interest up to Ksh 360,000 from taxable income.
- Shipping Tax Timeline (Section 9): Shipping tax under section 9 must be paid within 5 days of payment receipt or ship departure.
- Scrap Metal (Section 10): Sales of scrap metal are subject to Withholding Tax to regulate trade and trace supply chains.

--------------------------------------------------
2. THE FINANCE BILL, 2025 (Gazette Supplement No. 63)
--------------------------------------------------
Historical Comparison Data:
- Scrap Withholding Tax (WHT): WHT was removed on supply of goods to public entities (to encourage local business procurement).
- Benefit Threshold: Kept at the historical low of Ksh 2,000/month.
- Bread: Explicitly zero-rated under the VAT Act.
- Digital Tax: Focused only on non-resident, multinational digital companies.

--------------------------------------------------
AI INSTRUCTION FOR RESPONDING:
- Use the 2026 data as the default truth for current policies.
- Compare with 2025 data only when the user explicitly asks "what has changed" or "how does it compare to last year".
- Use simple terms (e.g., explain "Eco Levy" as "Ushuru wa mazingira utakaofanya simu na diaper kuwa ghali").
- Do NOT make up any tax rates or numbers. Stick strictly to this document.
`;
