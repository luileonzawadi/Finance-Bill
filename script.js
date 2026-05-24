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
            const isActive = aiAdvisor.classList.toggle('active');
            if (isActive) {
                if (aiInput) aiInput.focus();
                if (aiChatBody) {
                    setTimeout(() => {
                        aiChatBody.scrollTop = aiChatBody.scrollHeight;
                    }, 150);
                }
            }
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
            {
                keys: ["bread", "vat", "food", "loaf"],
                sw_keys: ["mkate", "boflo", "chakula"],
                reply: "Hello! Regarding bread: The Finance Bill proposals keep ordinary bread zero-rated, meaning it will not attract the 16% VAT. This protects bread prices from rising, allowing bakers to recover their inputs. Let me know if you need more details!",
                sw_reply: "Habari! Kuhusu mkate: Mapendekezo ya sasa yanaweka mkate wa kawaida chini ya 'zero-rated', kumaanisha hautatozwa kodi ya VAT ya 16%. Hii inalinda bei ya mkate isipande, na kuwawezesha waokaji kurejesha gharama zao za kodi ya pembejeo. Je, una swali lingine?"
            },
            {
                keys: ["motor", "vehicle", "car", "car tax", "automobile"],
                sw_keys: ["gari", "motokaa", "usafiri", "bima"],
                reply: "Hello! Regarding vehicles: A new Motor Vehicle Tax is proposed at 2.5% of the vehicle's valuation annually (minimum Ksh 5,000 and capped at Ksh 100,000). This will be collected by insurance firms during your policy renewal.",
                sw_reply: "Habari! Kuhusu magari: Kuna pendekezo la Kodi mpya ya Gari (Motor Vehicle Tax) ya 2.5% ya thamani ya gari kila mwaka (kiwango cha chini ni Ksh 5,000 na cha juu kikikomo cha Ksh 100,000). Hii itakusanywa na kampuni za bima unapofanya usajili mpya au kuongeza bima yako."
            },
            {
                keys: ["housing", "levy", "house", "affordable"],
                sw_keys: ["nyumba", "kodi ya nyumba", "ujenzi"],
                reply: "Hello! Regarding the housing levy: It maintains a 1.5% deduction from gross salaries, matched by another 1.5% from employers, to fund affordable housing projects. It applies to all formal employees.",
                sw_reply: "Habari! Kuhusu kodi ya nyumba (housing levy): Mswada unaendeleza makato ya 1.5% kutoka kwa mshahara wa mfanyakazi, na kiasi kama hicho cha 1.5% kikilipwa na mwajiri, ili kufadhili ujenzi wa nyumba za gharama nafuu."
            },
            {
                keys: ["eco", "plastic", "electronic", "waste", "battery", "phone", "computer"],
                sw_keys: ["mazingira", "plastiki", "simu", "taka", "betri"],
                reply: "Hello! Regarding the Eco Levy: It targets plastic packaging (Ksh 98/kg) and electronic/plastic waste, including smartphones (Ksh 228/unit) and lithium-ion batteries (Ksh 350/unit) to support environmental conservation.",
                sw_reply: "Habari! Kuhusu Kodi ya Mazingira (Eco Levy): Inalenga vifungashio vya plastiki (Ksh 98 kwa kilo) na taka za kielektroniki, pamoja na simu (Ksh 228 kwa kila moja) na betri za lithium-ion (Ksh 350 kwa kila moja) ili kuhifadhi mazingira."
            },
            {
                keys: ["threshold", "benefit", "non-taxable", "employee"],
                sw_keys: ["manufaa", "marupurupu", "mshahara"],
                reply: "Hello! Regarding employee benefits: The non-taxable benefit threshold (like per diems or travel allowance) is proposed to increase from Ksh 2,000 to Ksh 10,000 per month, providing tax relief for employees.",
                sw_reply: "Habari! Kuhusu marupurupu ya wafanyakazi: Kiwango cha marupurupu yasiyotozwa kodi (kama vile per diem au usafiri) inapendekezwa kuongezeka kutoka Ksh 2,000 hadi Ksh 10,000 kwa mwezi, jambo linaloleta afueni kwa wafanyakazi."
            },
            {
                keys: ["scrap", "junk", "metal"],
                sw_keys: ["chuma", "chakavu", "recycling"],
                reply: "Hello! Regarding scrap metal: The bill introduces a Withholding Tax on the sale of scrap metal to formalize the sector, ensuring traders and recyclers are taxed at the point of sale.",
                sw_reply: "Habari! Kuhusu chuma chakavu: Mswada unaleta Kodi ya Zuio (Withholding Tax) kwenye uuzaji wa chuma chakavu ili kuleta sekta hii isiyo rasmi kwenye mfumo wa kodi."
            },
            {
                keys: ["software", "royalt", "digital", "online", "internet", "resident", "non-resident"],
                sw_keys: ["mifumo", "visa", "mastercard", "mtandao", "kidijitali"],
                reply: "Hello! Regarding digital systems: The bill expands 'royalties' to cover software licenses, cloud platforms, and payment systems (like Visa/Mastercard processing), subjecting them to Withholding Tax.",
                sw_reply: "Habari! Kuhusu mifumo ya kidijitali: Mswada unapanua ufafanuzi wa 'royalties' ili kujumuisha leseni za programu (software), mifumo ya cloud, na mitandao ya malipo (kama Visa/Mastercard), ambayo sasa itatozwa Kodi ya Zuio."
            },
            {
                keys: ["kra", "revenue", "authority", "compliance", "enforcement"],
                sw_keys: ["ushuru", "kodi", "kra", "akaunti", "mpesa"],
                reply: "Hello! Regarding KRA: The Finance Bill 2026 strengthens compliance through automated eTIMS monitoring, bank/mobile money ledger integration, and faster tax dispute timelines to improve revenue collection.",
                sw_reply: "Habari! Kuhusu KRA: Mswada wa Fedha wa 2026 unaimarisha ukusanyaji kodi kwa kutumia mifumo ya kiotomatiki ya eTIMS, ufuatiliaji wa akaunti za benki na M-Pesa, na kuharakisha utatuzi wa migogoro ya kodi."
            },
            {
                keys: ["debt", "loan", "borrow", "repay"],
                sw_keys: ["deni", "mikopo", "madeni", "kuhifadhi"],
                reply: "Hello! Regarding debt: Around 75% of Kenya's collected revenue goes toward debt repayment. The government is using tax reforms for fiscal consolidation to reduce borrowing.",
                sw_reply: "Habari! Kuhusu madeni: Takriban 75% ya ushuru unaokusanywa nchini Kenya huenda kulipa madeni ya kitaifa. Serikali inatumia mageuzi haya ya kodi ili kupunguza mikopo mipya."
            },
            {
                keys: ["2025", "2026", "difference", "compare", "change", "vs"],
                sw_keys: ["tofauti", "linganisha", "badilisha"],
                reply: "Hello! Comparing 2025 and 2026: Finance Bill 2025 introduced major new taxes (VAT on bread, Eco Levy, vehicle tax). Finance Bill 2026 focuses heavily on aggressive enforcement and digital compliance of those taxes.",
                sw_reply: "Habari! Kulinganisha 2025 na 2026: Mswada wa Fedha wa 2025 ulianzisha kodi mpya (VAT ya mkate, Eco Levy, kodi ya magari). Mswada wa 2026 unalenga zaidi usimamizi mkali na ufuatiliaji wa kidijitali wa kodi hizo."
            },
            {
                keys: ["impact", "affect", "effect", "mwananchi", "citizen", "people"],
                sw_keys: ["athari", "maisha", "hustler", "wananchi", "mwananchi"],
                reply: "Hello! Regarding the impact: Key effects on wananchi include a higher cost of living (VAT/eco levies), stricter tax monitoring for small businesses, and a new annual motor vehicle tax.",
                sw_reply: "Habari! Kuhusu athari kwa wananchi: Mambo makuu ni kupanda kwa gharama ya maisha (kodi ya eco), ufuatiliaji mkali wa kodi kwa biashara ndogo ndogo, na kodi mpya ya kila mwaka ya magari."
            },
            {
                keys: ["income", "salary", "paye", "withhold"],
                sw_keys: ["mshahara", "paye", "ajira", "makato"],
                reply: "Hello! Regarding employment tax: PAYE brackets remain active, and withholding taxes are expanded to informal transactions (like scrap metal) and digital cards to widen the net.",
                sw_reply: "Habari! Kuhusu kodi ya ajira: Viwango vya PAYE vinaendelea kama vilivyo, na kodi za zuio (withholding tax) zimepanuliwa kujumuisha sekta zisizo rasmi (kama chuma chakavu) na mifumo ya kadi za malipo."
            }
        ];

        // Detect if user query contains Swahili terms
        const swahiliIndicators = ["habari", "mambo", "vipi", "kodi", "gari", "mkate", "wananchi", "athari", "ushuru", "nyumba", "deni", "nini", "kwa", "na", "ya", "ni", "sana", "karibu", "habari yako"];
        const isSwahiliQuery = swahiliIndicators.some(indicator => text.includes(indicator));

        let matched = null;
        let matchedInSwahili = false;

        // Try to match Swahili keywords first
        for (const item of botResponses) {
            if (item.sw_keys.some(k => text.includes(k))) {
                matched = item;
                matchedInSwahili = true;
                break;
            }
        }

        // If no Swahili match, try English
        if (!matched) {
            for (const item of botResponses) {
                if (item.keys.some(k => text.includes(k))) {
                    matched = item;
                    break;
                }
            }
        }

        let response = "";
        if (matched) {
            response = (isSwahiliQuery || matchedInSwahili) ? matched.sw_reply : matched.reply;
        } else {
            response = isSwahiliQuery 
                ? "Habari! Ninaweza kujibu maswali kuhusu Mswada wa Fedha wa Kenya 2025/2026 pekee. Jaribu kuuliza kuhusu: kodi ya mkate (VAT), kodi ya gari (motor vehicle tax), kodi ya mazingira (eco levy), ushuru wa KRA, au athari kwa mwananchi. Karibu!"
                : "Hello! I can answer questions about the Kenyan Finance Bill 2025/2026. Try asking about: bread VAT, motor vehicle tax, eco levy, housing levy, digital services, KRA enforcement, or the impact on citizens. Let me know how I can help!";
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
        
        // Reset textarea height and style
        aiInput.value = '';
        aiInput.style.height = 'auto';
        aiInput.style.borderRadius = '20px';

        // Add user message to conversation history
        chatHistory.push({ role: 'user', content: rawText });

        // Maintain context length (keep only the last 10 messages)
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(-10);
        }
        saveHistory();

        // Create typing indicator block with bouncing dots animation
        const typing = document.createElement('div');
        typing.className = 'ai-message bot typing-message';
        typing.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        aiChatBody.appendChild(typing);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;

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
    
    if (aiInput) {
        // Prevent default Enter key behavior (send) but allow Shift+Enter for newline
        aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAISend();
            }
        });

        // Auto-grow input textarea height dynamically
        aiInput.addEventListener('input', function () {
            this.style.height = 'auto';
            const newHeight = Math.min(this.scrollHeight, 120);
            this.style.height = newHeight + 'px';
            if (newHeight > 50) {
                this.style.borderRadius = '16px';
            } else {
                this.style.borderRadius = '20px';
            }
        });
    }

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
