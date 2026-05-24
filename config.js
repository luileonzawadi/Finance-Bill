// ==========================================
// AI CONFIGURATION
// ==========================================

var AI_CONFIG = {
    isLive: true,

    async call(messages, context) {
        if (!this.isLive) throw new Error("AI not configured.");

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages, context: context })
            });

            let data;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error(`Server returned non-JSON response (${response.status}):`, text.substring(0, 200));
                throw new Error('Unable to reach the AI service. Please try again.');
            }

            if (response.ok) {
                let text = data.response;
                
                // Format Markdown to clean HTML structures safely
                function formatMarkdown(str) {
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
                }

                return formatMarkdown(text);
            } else {
                console.error('API error response:', data.error || response.status);
                throw new Error(data.error || 'Unable to reach the AI service. Please try again.');
            }
        } catch (err) {
            console.error("API Error: ", err);
            throw err;
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
