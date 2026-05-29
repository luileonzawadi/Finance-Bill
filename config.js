// ==========================================
// AI CONFIGURATION & UTILITIES
// ==========================================

var AI_CONFIG = {
    isLive: true,

    // Cleanly formats Markdown syntax (bold, italic, headers, and lists) into safe HTML
    formatMarkdown(str) {
        if (!str) return '';
        
        // Escape basic HTML tags to prevent arbitrary injection, but allow our markup
        let html = str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Bold: **text** -> <strong>text</strong>
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic: *text* or _text_ -> <em>text</em>
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Process line-by-line for bulleted/numbered lists
        let lines = html.split('\n');
        let inList = false;
        let listType = null; // 'ul' or 'ol'
        let processed = [];
        
        for (let line of lines) {
            let bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)$/);
            let numberMatch = line.match(/^(\s*)(\d+\.)\s+(.*)$/);
            
            if (bulletMatch) {
                let content = bulletMatch[3];
                if (!inList || listType !== 'ul') {
                    if (inList) {
                        processed.push(listType === 'ol' ? '</ol>' : '</ul>');
                    }
                    processed.push('<ul style="margin-left: 1.2rem; margin-top: 0.4rem; margin-bottom: 0.4rem; list-style-type: disc; display: block;">');
                    inList = true;
                    listType = 'ul';
                }
                processed.push(`<li style="margin-bottom: 0.25rem; line-height: 1.5;">${content}</li>`);
            } else if (numberMatch) {
                let content = numberMatch[3];
                if (!inList || listType !== 'ol') {
                    if (inList) {
                        processed.push(listType === 'ol' ? '</ol>' : '</ul>');
                    }
                    processed.push('<ol style="margin-left: 1.2rem; margin-top: 0.4rem; margin-bottom: 0.4rem; display: block;">');
                    inList = true;
                    listType = 'ol';
                }
                processed.push(`<li style="margin-bottom: 0.25rem; line-height: 1.5;">${content}</li>`);
            } else {
                if (inList) {
                    processed.push(listType === 'ol' ? '</ol>' : '</ul>');
                    inList = false;
                    listType = null;
                }
                processed.push(line);
            }
        }
        if (inList) {
            processed.push(listType === 'ol' ? '</ol>' : '</ul>');
        }
        
        html = processed.join('\n');
        
        // Headers: ### Header -> <h4>Header</h4>
        html = html.replace(/^#{1,6}\s+(.*)$/gm, '<h4 style="margin-top: 0.75rem; margin-bottom: 0.4rem; color: var(--text-heading); font-weight: 700; font-size: 0.95rem; line-height: 1.3;">$1</h4>');
        
        // Double newlines -> paragraph spacers
        html = html.replace(/\n{2,}/g, '<div style="margin-bottom: 0.6rem;"></div>');
        
        // Single newlines -> <br>
        html = html.replace(/\n/g, '<br>');
        
        return html.trim();
    },

    async call(messages, context) {
        if (!this.isLive) throw new Error("AI not configured.");

        try {
            // Encoded API keys (Base64 - decode at runtime)
            const encodedKeys = [
                // Add any Base64-encoded Groq keys here if needed
            ];

            // Decode Base64 keys at runtime
            function decodeBase64(str) {
                try {
                    if (!str) return '';
                    // If it is already decoded (starts with gsk_), return as is
                    if (str.startsWith('gsk_')) {
                        return str;
                    }
                    return atob(str);
                } catch (e) {
                    console.error('Failed to decode key:', str);
                    return str; // Fallback as-is
                }
            }

            const localKeys = Array.isArray(window.GROQ_API_KEYS) ? window.GROQ_API_KEYS : [];
            const apiKeys = [
                ...encodedKeys,
                ...localKeys
            ].map(decodeBase64).filter(Boolean);

            if (apiKeys.length === 0) {
                throw new Error("No API keys found.");
            }

            const systemPrompt = `You are a warm, helpful, and highly accurate Kenyan Finance Bill AI Advisor. Your absolute priority is accuracy and truth, explained in a friendly, conversational, and easy-to-understand manner.
Your knowledge base is strictly limited to the provided GROUND TRUTH CONTEXT.

GROUND TRUTH CONTEXT:
${context}

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
   - If they write in Sheng, respond in warm, natural Sheng to make them feel comfortable, while keeping tax terms clear.`;

            const completionMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];

            const url = 'https://api.groq.com/openai/v1/chat/completions';

            // Try each API key until one works
            let lastError = null;
            for (let i = 0; i < apiKeys.length; i++) {
                try {
                    // Set a timeout of 8 seconds per key to handle hangs/delays silently
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKeys[i]}`
                        },
                        body: JSON.stringify({
                            model: 'llama-3.3-70b-versatile',
                            messages: completionMessages,
                            temperature: 0.1,
                            max_tokens: 1000
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    const data = await response.json();

                    if (response.ok) {
                        let text = data.choices[0].message.content;
                        return this.formatMarkdown(text);
                    } else {
                        const errMsg = data.error ? data.error.message : `API returned ${response.status}`;
                        console.warn(`Groq API key at index ${i} failed (status ${response.status}): ${errMsg}`);
                        lastError = new Error(errMsg);
                    }
                } catch (err) {
                    console.warn(`Connection failed with Groq key at index ${i}: ${err.message}`);
                    lastError = err;
                }
            }

            throw lastError || new Error("All API keys failed.");
        } catch (error) {
            console.error('AI Config Error:', error.message);
            throw error;
        }
    }
};

// ==========================================
// EMAILJS CONFIGURATION (PUBLIC)
// ==========================================
var EMAILJS_CONFIG = {
    SERVICE_ID: "service_81ihbzm",
    TEMPLATE_ID: "YOUR_TEMPLATE_ID",
    PUBLIC_KEY: "YOUR_PUBLIC_KEY"
};
