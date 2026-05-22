// ==========================================
// AI CONFIGURATION
// ==========================================

var AI_CONFIG = {
    isLive: true,

    async call(userInput, context) {
        if (!this.isLive) throw new Error("AI not configured.");

        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userInput })
            });

            const data = await response.json();

            if (response.ok) {
                let text = data.answer;
                text = text.replace(/#{1,6}\s*/g, '');
                text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                text = text.replace(/\*/g, '');
                text = text.replace(/ {2,}/g, ' ');
                return text.trim();
            } else {
                throw new Error(data.error || `Server returned ${response.status}`);
            }
        } catch (err) {
            console.error("API Error: ", err);
            throw new Error(`Connection Failed: ${err.message}`);
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
