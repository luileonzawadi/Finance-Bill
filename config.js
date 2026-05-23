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
                text = text.replace(/#{1,6}\s*/g, '');
                text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                text = text.replace(/\*/g, '');
                text = text.replace(/ {2,}/g, ' ');
                return text.trim();
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
