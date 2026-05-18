module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userInput, context } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API key not configured in Vercel Environment Variables" });
        }

        const systemPrompt = `ROLE: Senior Fiscal Analyst. TASK: Analyze Kenya Finance Bill 2025/2026. Explain things simply.`;
        
        // Use the dynamically mapped latest flash model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nCONTEXT: ${context}\n\nUSER: ${userInput}` }] }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ response: data.candidates[0].content.parts[0].text });
        } else {
            throw new Error(data.error ? data.error.message : `API returned ${response.status}`);
        }
    } catch (error) {
        console.error('Serverless Function Error:', error);
        res.status(500).json({ error: error.message });
    }
};
