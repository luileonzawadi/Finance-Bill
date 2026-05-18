module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userInput, context } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API key not configured in Vercel Environment Variables. Please set GEMINI_API_KEY." });
        }

        const systemPrompt = `ROLE: Senior Tax Advisor & Mwananchi Advocate. TASK: Analyze Kenya Finance Bill 2025/2026. Explain things simply. You must understand Swahili, Sheng, and English. 
        CRITICAL RULES:
        1. LANGUAGE CONSTISTENCY: Match the language of the user's question exactly. If the user asks in English, you MUST reply ONLY in English. If the user asks in Swahili or Sheng, you MUST reply ONLY in Swahili or Sheng. Never reply in Swahili if the question was asked in English.
        2. NO INTRODUCTIONS: Do NOT introduce yourself, say hello, or state that you are the Finance Bill Advisor. Jump straight into answering the user's question directly.
        3. SIMPLICITY & BREVITY: Keep answers extremely brief, concise, and direct (under 150 words). Avoid long rambling paragraphs. Breakdown complex tax terms into simple, relatable Kenyan examples.`;
        
        // Use the dynamically mapped latest flash model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nCONTEXT: ${context}\n\nUSER: ${userInput}` }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1500
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            let text = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ response: text });
        } else {
            throw new Error(data.error ? data.error.message : `API returned ${response.status}`);
        }
    } catch (error) {
        console.error('Serverless Function Error:', error);
        res.status(500).json({ error: error.message });
    }
};
