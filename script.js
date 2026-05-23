document.addEventListener('DOMContentLoaded', () => {
    // Scroll Progress Tracking
    const scrollProgress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (scrollProgress) scrollProgress.style.width = scrolled + "%";
    });

    // Mobile Menu Toggle - exposed initializer so injected navbars can be bound after load
    window.initNavbar = function initNavbar() {
        const mobileMenuEl = document.getElementById('mobile-menu');
        const navLinksEl = document.querySelector('.nav-links');

        if (!mobileMenuEl || !navLinksEl) return;

        // Prevent double-initialization
        if (mobileMenuEl.dataset.navInit === '1') return;
        mobileMenuEl.dataset.navInit = '1';

        mobileMenuEl.addEventListener('click', () => {
            const isActive = navLinksEl.classList.toggle('active');
            mobileMenuEl.classList.toggle('active');
            document.body.style.overflow = isActive ? 'hidden' : 'auto';
            const menuIcon = document.getElementById('menu-icon');
            if (menuIcon) {
                menuIcon.classList.toggle('fa-bars', !isActive);
                menuIcon.classList.toggle('fa-times', isActive);
            }
        });

        // Close menu when a nav link is clicked
        navLinksEl.querySelectorAll('a').forEach(function (link) {
            if (link.dataset.navInit === '1') return;
            link.dataset.navInit = '1';
            link.addEventListener('click', function () {
                if (navLinksEl.classList.contains('active')) {
                    navLinksEl.classList.remove('active');
                    mobileMenuEl.classList.remove('active');
                    const menuIcon = document.getElementById('menu-icon');
                    if (menuIcon) {
                        menuIcon.classList.remove('fa-times');
                        menuIcon.classList.add('fa-bars');
                    }
                    document.body.style.overflow = 'auto';
                }
            });
        });
    };

    // Smooth Scroll and Close Menu on Mobile
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (mobileMenu) mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
                const menuIcon = document.getElementById('menu-icon');
                if (menuIcon) menuIcon.classList.replace('fa-times', 'fa-bars');
            }
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // Intersection Observer for Premium Reveal
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.card, .section-header, .impact-item, .hero-text, .image-wrapper, .comparison-wrapper, .metric-card').forEach(el => {
        el.classList.add('reveal-hidden');
        revealObserver.observe(el);
    });


    // AI Advisor UI Controls
    const aiAdvisor = document.getElementById('ai-advisor');
    const aiTrigger = document.querySelector('.ai-trigger');
    const aiClose = document.querySelector('.ai-close');
    const aiSend = document.getElementById('ai-send');
    const aiInput = document.getElementById('ai-input');
    const aiChatBody = document.getElementById('ai-chat-body');
    let chatHistory = [];

    // Try loading chat history from sessionStorage
    try {
        const storedHistory = sessionStorage.getItem('finance_bill_chat_history');
        if (storedHistory) {
            chatHistory = JSON.parse(storedHistory) || [];
        }
    } catch (e) {
        console.error("Failed to load chat history", e);
    }

    const saveHistory = () => {
        try {
            sessionStorage.setItem('finance_bill_chat_history', JSON.stringify(chatHistory));
        } catch (e) {
            console.error("Failed to save chat history", e);
        }
    };

    if (aiTrigger) {
        aiTrigger.addEventListener('click', () => {
            aiAdvisor.classList.toggle('active');
        });
    }

    if (aiClose) {
        aiClose.addEventListener('click', (e) => {
            e.stopPropagation();
            aiAdvisor.classList.remove('active');
        });
    }

    const addMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = `ai-message ${type}`;
        if (type === 'bot' || type === 'assistant') {
            msg.innerHTML = text;
        } else {
            msg.textContent = text;
        }
        aiChatBody.appendChild(msg);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    };

    // Render stored chat history if present
    if (chatHistory && chatHistory.length > 0 && aiChatBody) {
        aiChatBody.innerHTML = ''; // Clear default greeting to avoid repetition
        chatHistory.forEach(msg => {
            const roleType = (msg.role === 'assistant' || msg.role === 'bot') ? 'bot' : 'user';
            addMessage(msg.content, roleType);
        });
    }

    const simulateResponse = (text) => {
        const botResponses = [
            { keys: ["bread", "vat", "food", "loaf"], reply: "The Finance Bill 2025 proposes removing the zero-rated status for bread, introducing a 16% VAT. This is expected to increase retail prices by approximately Ksh 10-15 per loaf." },
            { keys: ["motor", "vehicle", "car", "car tax", "automobile"], reply: "A new Motor Vehicle Tax is proposed at 2.5% of the vehicle's value, with a minimum of Ksh 5,000 and a maximum of Ksh 100,000 per year." },
            { keys: ["housing", "levy", "house", "affordable"], reply: "The Housing Levy maintains a 1.5% deduction from gross salary to fund affordable housing initiatives across Kenya." },
            { keys: ["eco", "plastic", "electronic", "waste", "battery", "phone", "computer"], reply: "The Eco Levy targets plastic packaging and electronic waste (batteries, phones, computers) with rates ranging from Ksh 98 to Ksh 1,275 per unit." },
            { keys: ["threshold", "benefit", "non-taxable", "employee"], reply: "The 2025 Bill proposes increasing the non-taxable benefit threshold from Ksh 2,000 to Ksh 10,000 per month, providing significant relief for employees." },
            { keys: ["scrap", "junk", "metal"], reply: "The 2025 Bill introduces withholding tax on the sale of scrap, aiming to formalize the sector and improve revenue collection." },
            { keys: ["software", "royalt", "digital", "online", "internet", "resident", "non-resident"], reply: "Digital services are now taxed at 1.5% covering both resident and non-resident providers. Royalties now explicitly include software distribution." },
            { keys: ["kra", "revenue", "authority", "compliance", "enforcement"], reply: "The Finance Bill 2026 strengthens KRA enforcement through digital monitoring and automated compliance systems to widen the tax net." },
            { keys: ["debt", "loan", "borrow", "repay"], reply: "Approximately 75% of collected revenue goes toward national debt repayment. The government is pursuing fiscal consolidation to reduce reliance on external borrowing." },
            { keys: ["2025", "2026", "difference", "compare", "change", "vs"], reply: "Finance Bill 2025 introduced major reforms — new taxes, expanded levies, and new systems. Finance Bill 2026 focused on enforcement, digital monitoring, and automated compliance of those reforms." },
            { keys: ["impact", "affect", "effect", "mwananchi", "citizen", "people"], reply: "Key impacts include: higher cost of living (VAT on bread, Eco Levy), stricter rules for small businesses and online sellers, and a new annual Motor Vehicle Tax for car owners." },
            { keys: ["income", "salary", "paye", "withhold"], reply: "PAYE remains in effect. The Bill also introduces withholding tax on scrap sales and supplies to public entities under Section 10 of the Income Tax Act." },
        ];

        let response = "I can answer questions about the Finance Bill 2025/2026. Try asking about: bread VAT, motor vehicle tax, eco levy, housing levy, digital services, KRA enforcement, or the impact on citizens.";
        for (const item of botResponses) {
            if (item.keys.some(k => text.includes(k))) {
                response = item.reply;
                break;
            }
        }
        
        // Save response to history
        chatHistory.push({ role: 'assistant', content: response });
        saveHistory();

        addMessage(response, 'bot');
    };

    const handleAISend = async () => {
        const rawText = aiInput.value.trim();
        if (!rawText) return;

        addMessage(rawText, 'user');
        aiInput.value = '';

        // Add user message to conversation history
        chatHistory.push({ role: 'user', content: rawText });

        // Maintain context length (keep only the last 10 messages)
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(-10);
        }
        saveHistory();

        const typing = document.createElement('div');
        typing.className = 'ai-message bot';
        typing.textContent = 'Analyzing bill...';
        aiChatBody.appendChild(typing);

        const config = window.AI_CONFIG;

        if (config && config.isLive) {
            try {
                const aiResponse = await config.call(chatHistory, FINANCE_BILL_CONTEXT);
                typing.remove();
                
                // Add bot response to conversation history
                chatHistory.push({ role: 'assistant', content: aiResponse });
                saveHistory();
                
                addMessage(aiResponse, 'bot');
            } catch (error) {
                console.error("AI Error:", error);
                typing.remove();
                addMessage('Let me check my offline knowledge base for that...', 'bot');
                setTimeout(() => simulateResponse(rawText.toLowerCase()), 1500);
            }
        } else {
            setTimeout(() => {
                typing.remove();
                simulateResponse(rawText.toLowerCase());
            }, 1500);
        }
    };

    if (aiSend) aiSend.addEventListener('click', handleAISend);
    if (aiInput) aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAISend(); });

    // Dynamic CSS for animations
    const style = document.createElement('style');
    style.innerHTML = `
        .reveal-hidden {
            opacity: 0;
            transform: translateY(40px);
            transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .reveal-active {
            opacity: 1;
            transform: translateY(0);
        }

    `;
    document.head.appendChild(style);
});
