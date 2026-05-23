module.exports = async function (req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Ensure fetch is available (Node 18+ has it built-in)
    if (typeof fetch === 'undefined') {
        console.error('FATAL: Global fetch is not available. Ensure Node.js >= 18.');
        return res.status(500).json({ error: 'Something went wrong. Please try again in a moment.' });
    }

    try {
        const { messages, context } = req.body;

        if (!messages || !context) {
            return res.status(400).json({ error: 'Missing required fields: messages and context' });
        }
        
        // Gather all available API keys
        let keys = [];
        if (process.env.GROQ_API_KEY) {
            keys.push(process.env.GROQ_API_KEY.trim());
        }
        if (process.env.GROQ_API_KEYS) {
            const additionalKeys = process.env.GROQ_API_KEYS.split(',')
                .map(k => k.trim())
                .filter(Boolean);
            keys.push(...additionalKeys);
        }

        // Deduplicate keys
        keys = [...new Set(keys)];

        if (keys.length === 0) {
            console.error('No API keys configured. Set GROQ_API_KEY or GROQ_API_KEYS in environment variables.');
            return res.status(500).json({ error: 'Something went wrong. Please try again in a moment.' });
        }

        const systemPrompt = `You are a highly accurate, objective Kenyan Finance Bill AI Advisor. Your absolute priority is accuracy and truth.
Your knowledge base is strictly limited to the provided GROUND TRUTH CONTEXT.

GROUND TRUTH CONTEXT:
${context}

CRITICAL INSTRUCTIONS:
1. STRICT TOPIC GUARD: You MUST ONLY answer questions directly related to Kenya's economy, taxes, fiscal policy, or the Finance Bills (2025 and 2026).
   If the user asks an off-topic question (anything unrelated to economy, taxes, or the Finance Bill, such as general advice, history of other topics, programming, creative writing, science, etc.), you MUST reply with this exact message:
   "I can only answer questions related to the Kenyan Finance Bill, taxes, and the economy. Please ask a question related to these topics."
2. NO HALLUCINATIONS: Do not invent, extrapolate, or assume any information, tax rates, rates, timelines, or provisions not explicitly mentioned in the GROUND TRUTH CONTEXT. If the context does not contain the answer, you must state: "I cannot find that information in the official 2025/2026 Finance Bill documents."
3. STRAIGHT TO THE POINT: Be concise, direct, and factual. Do not say "Based on the context" or "Hello, as an AI..." or give any introductions. Provide the numbers and answers immediately.
4. ACCURACY IS PARAMOUNT: Statically compare 2025 and 2026 ONLY when the user explicitly asks for comparison. Use 2026 as the default for current questions.
5. MEMORY AND CONTINUITY: You will receive the conversation history. Review past exchanges to maintain continuity, identify references (like "what about that first tax?"), and build upon previous answers without repeating introductory text.
6. LANGUAGE: Match the language of the user's question exactly (English, Swahili, or Sheng).`;

        const chatHistory = Array.isArray(messages) ? messages : [];
        const completionMessages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory
        ];

        // Use Groq's chat completions endpoint (OpenAI compatible)
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        let lastError = null;
        let successResponse = null;

        // Try keys sequentially until one succeeds
        for (let i = 0; i < keys.length; i++) {
            const currentKey = keys[i];
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: completionMessages,
                        temperature: 0.1,
                        max_tokens: 1000
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    successResponse = data.choices[0].message.content;
                    break; // Success! Exit the key loop
                } else {
                    const errMsg = data.error ? data.error.message : `API returned ${response.status}`;
                    console.warn(`API key index ${i} failed: ${errMsg}`);
                    lastError = new Error(errMsg);
                }
            } catch (err) {
                console.warn(`Connection failed with API key index ${i}: ${err.message}`);
                lastError = err;
            }
        }

        if (successResponse !== null) {
            return res.status(200).json({ response: successResponse });
        } else {
            throw lastError || new Error("All configured API keys failed to return a response.");
        }
    } catch (error) {
        console.error('Serverless Function Error:', error.message, error.stack);
        res.status(500).json({ error: 'Something went wrong. Please try again in a moment.' });
    }
};
