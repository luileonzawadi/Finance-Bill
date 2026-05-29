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
                'QVEuQWI4Uk42S0FNZ3dCVF9XZFlZZHNYU0RoM1pnRWRtQmJ1WHk3bXFOMWFxUFJoMC0zSnc=',
                'QVEuQWI4Uk42SW9MU3hLVXQwNno3Qi15NUx5VjgzVWk1T29EWVg4UzZzTFhOUHlvMG9DdUE=',
                'QVEuQWI4Uk42SVRONk9iNjhFdzVOMEI4M2RTYjRyZnhReWVYa3NYSEpKRzluQ1htMmYwWlE='
            ];

            // Decode Base64 keys at runtime
            function decodeBase64(str) {
                try {
                    if (!str) return '';
                    // If it looks already decoded (starts with AI), return as is
                    if (str.startsWith('AI')) {
                        return str;
                    }
                    return atob(str);
                } catch (e) {
                    console.error('Failed to decode key:', str);
                    return str; // Fallback as-is
                }
            }

            const localKeys = Array.isArray(window.GEMINI_API_KEYS) ? window.GEMINI_API_KEYS : [];
            const apiKeys = [
                ...encodedKeys,
                ...localKeys
            ].map(decodeBase64).filter(Boolean);

            if (apiKeys.length === 0) {
                throw new Error("No API keys found.");
            }

            const systemPrompt = `You are a warm, helpful, and highly accurate Kenyan Finance Bill AI Advisor. Your absolute priority is accuracy and truth, explained in a friendly, conversational, and easy-to-understand manner.
The provided GROUND TRUTH CONTEXT is a guiding set of facts to help you answer questions accurately and avoid hallucinations.

GROUND TRUTH CONTEXT:
${context}

CRITICAL INSTRUCTIONS:
1. GREETINGS & LANGUAGE: If a user greets you, return the greeting warmly, state that you are the AI Advisor for the Finance Bill 2026, and ask them what they would like to know about the bill. Mention that they have the opportunity to ask questions in either Swahili or English before you proceed.
2. STRICT TOPIC GUARD: You MUST ONLY answer questions directly related to the Finance Bill 2026 and nothing else. Do not answer questions about previous bills, general programming, or other unrelated topics. If a question is off-topic, politely redirect the user back to the Finance Bill 2026.
3. FORMATTING (CRITICAL): When your answer is long, you MUST arrange the words well and break your response into well-spaced paragraphs to give users a nice time reading. Use bullet points for lists. Avoid giant walls of text.
4. TRUSTED SOURCES & PERCENTAGES: Whenever you quote a specific percentage, tax rate, or exact figure, you must explicitly state that this information is ascertained from the official Finance Bill and cross-referenced with trusted Kenyan news sources, specifically like "The Standard" newspaper, to guarantee its accuracy.
5. USE THE CONTEXT: Use the GROUND TRUTH CONTEXT to guide your answers. You may provide broader economic context if it helps explain the bill, but avoid hallucinating specific numbers, rates, or timelines not present in reality.
6. WARM & HUMAN TONE: Be warm, polite, and explanatory. Explain tax concepts simply (relating to everyday Kenyan life like boda boda, mama mboga, matatus, or dukas if helpful).
7. LANGUAGE: Match the language of the user's question exactly (English, Swahili, or Sheng). Use phrases like "Habari!", "Asante kwa swali lako," or "Karibu!" when speaking Swahili.`;

            const geminiMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Try each API key until one works
            let lastError = null;
            for (let i = 0; i < apiKeys.length; i++) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys[i]}`;
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            // Using text/plain prevents CORS preflight in client-side browser requests
                            'Content-Type': 'text/plain'
                        },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: systemPrompt }]
                            },
                            contents: geminiMessages,
                            generationConfig: {
                                temperature: 0.1,
                                maxOutputTokens: 1000
                            }
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    const data = await response.json();

                    if (response.ok) {
                        let text = data.candidates[0].content.parts[0].text;
                        return this.formatMarkdown(text);
                    } else {
                        const errMsg = data.error ? data.error.message : `API returned ${response.status}`;
                        console.warn(`Gemini API key at index ${i} failed (status ${response.status}): ${errMsg}`);
                        lastError = new Error(errMsg);
                    }
                } catch (err) {
                    console.warn(`Connection failed with Gemini key at index ${i}: ${err.message}`);
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
