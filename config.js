// ==========================================
// AI CONFIGURATION (PRIVATE)
// ==========================================
// IMPORTANT: Add this file to your .gitignore to prevent pushing your key to GitHub!

var AI_CONFIG = {
    isLive: false,
    
    async call(userInput, context) {
        if (!this.isLive) throw new Error("AI not configured.");

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInput, context })
            });

            const data = await response.json();

            if (response.ok) {
                let text = data.response;
                // Strip all asterisks (*) to make it normal text
                text = text.replace(/\*/g, '');
                // Normalize word spacing
                text = text.replace(/ {2,}/g, ' ');
                return text.trim();
            } else {
                throw new Error(data.error || `Server returned ${response.status}`);
            }
        } catch (err) {
            console.error("Serverless Connection Error: ", err);
            throw new Error(`Connection Failed: ${err.message}`);
        }
    }
};

// ==========================================
// EMAILJS CONFIGURATION (PUBLIC)
// ==========================================
var EMAILJS_CONFIG = {
    SERVICE_ID: "service_81ihbzm", // Added your Service ID
    TEMPLATE_ID: "YOUR_TEMPLATE_ID", // TODO: Replace with your Template ID
    PUBLIC_KEY: "YOUR_PUBLIC_KEY"    // TODO: Replace with your Public Key
};
