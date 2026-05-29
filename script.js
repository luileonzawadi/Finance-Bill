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
    const navLinks = document.querySelector('.nav-links');
    const mobileMenu = document.getElementById('mobile-menu');
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

    // Language modal: shown when chatbot is first opened if no language has been chosen
    function showLangModal(onSelect) {
        // Remove any existing modal
        const existing = document.getElementById('lang-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'lang-modal';
        modal.innerHTML = `
            <div class="lang-modal-overlay"></div>
            <div class="lang-modal-content">
                <div class="lang-modal-icon">🌍</div>
                <h3>Choose Your Language</h3>
                <p>Chagua lugha yako / Select your language</p>
                <div class="lang-btn-group">
                    <button id="lang-en" class="lang-btn">
                        <span class="lang-flag">🇬🇧</span>
                        <span>English</span>
                    </button>
                    <button id="lang-sw" class="lang-btn">
                        <span class="lang-flag">🇰🇪</span>
                        <span>Kiswahili</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // Animate in
        requestAnimationFrame(() => modal.classList.add('lang-modal-visible'));

        document.getElementById('lang-en').addEventListener('click', () => {
            sessionStorage.setItem('finance_chat_lang', 'en');
            modal.classList.remove('lang-modal-visible');
            setTimeout(() => modal.remove(), 300);
            if (onSelect) onSelect('en');
        });
        document.getElementById('lang-sw').addEventListener('click', () => {
            sessionStorage.setItem('finance_chat_lang', 'sw');
            modal.classList.remove('lang-modal-visible');
            setTimeout(() => modal.remove(), 300);
            if (onSelect) onSelect('sw');
        });
    }

    if (aiTrigger) {
        aiTrigger.addEventListener('click', () => {
            const isActive = aiAdvisor.classList.toggle('active');
            if (isActive) {
                // Lock page scroll
                document.body.style.overflow = 'hidden';

                // Show language modal if not yet selected
                if (!sessionStorage.getItem('finance_chat_lang')) {
                    setTimeout(() => showLangModal((lang) => {
                        if (aiInput) aiInput.focus();
                    }), 300);
                } else {
                    if (aiInput) aiInput.focus();
                }

                if (aiChatBody) {
                    setTimeout(() => {
                        aiChatBody.scrollTop = aiChatBody.scrollHeight;
                    }, 150);
                }
            } else {
                // Restore page scroll
                document.body.style.overflow = '';
            }
        });
    }

    if (aiClose) {
        aiClose.addEventListener('click', (e) => {
            e.stopPropagation();
            aiAdvisor.classList.remove('active');
            // Restore page scroll
            document.body.style.overflow = '';
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

    // Set AI status label dynamically
    const connectionStatusEl = document.getElementById('ai-connection-status');
    const config = window.AI_CONFIG;
    if (connectionStatusEl) {
        if (config && config.isLive) {
            connectionStatusEl.textContent = 'Live Intelligence Active';
        } else {
            connectionStatusEl.textContent = 'Local AI Engine Active';
        }
    }

    // Helper to dynamically parse the official Finance Bill context into search-ready sections
    function parseKnowledgeBase(context) {
        if (!context) return [];
        const lines = context.split('\n');
        const sections = [];
        let currentSection = null;
        let currentPart = "";
        let currentSectionHeader = "";

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('===')) continue;

            if (trimmed.startsWith('PART ')) {
                currentPart = trimmed;
                continue;
            }
            if (trimmed.startsWith('SECTION ')) {
                currentSectionHeader = trimmed;
                continue;
            }

            const isNewPoint = /^\d+\.\s+/.test(trimmed);
            const isSummaryHeader = trimmed.startsWith('THINGS THAT WILL ') || 
                                    trimmed.startsWith('NEW TAXES ON ') || 
                                    trimmed.startsWith('BUSINESSES:') || 
                                    trimmed.startsWith('AI ADVISOR ') ||
                                    trimmed.startsWith('SUMMARY:');

            if (isNewPoint || isSummaryHeader) {
                if (currentSection) sections.push(currentSection);
                
                let title = trimmed;
                if (isNewPoint) {
                    title = trimmed.replace(/^\d+\.\s+/, '');
                }
                
                currentSection = {
                    title: title,
                    header: trimmed,
                    part: currentPart,
                    sectionHeader: currentSectionHeader,
                    content: [trimmed],
                    type: isNewPoint ? 'point' : 'summary'
                };
            } else {
                if (currentSection) {
                    currentSection.content.push(line);
                } else {
                    currentSection = {
                        title: "General Information",
                        header: "General Information",
                        part: currentPart,
                        sectionHeader: currentSectionHeader,
                        content: [line],
                        type: 'general'
                    };
                }
            }
        }
        if (currentSection) sections.push(currentSection);

        return sections.map(sec => {
            const rawContent = sec.content.join('\n');
            const cleanText = rawContent.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/[-\s]+/g, ' ');
            const words = cleanText.split(' ').filter(w => w.length > 2);
            
            const stopWords = new Set([
                'the', 'and', 'for', 'now', 'new', 'not', 'will', 'are', 'that', 'this', 'with', 'from', 'under', 'into',
                'na', 'ya', 'kwa', 'kila', 'kama', 'kuhusu', 'hivi', 'huyu', 'hilo', 'hiyo', 'ambayo', 'sana', 'zaidi',
                'has', 'been', 'with', 'made', 'paid', 'fees', 'rate', 'rates', 'tax', 'taxes', 'levy', 'levies',
                'kodi', 'ushuru', 'mswada', 'fedha'
            ]);
            const keywords = [...new Set(words.filter(w => !stopWords.has(w)))];

            return {
                title: sec.title,
                header: sec.header,
                part: sec.part,
                sectionHeader: sec.sectionHeader,
                rawContent: rawContent,
                keywords: keywords
            };
        });
    }

    const parsedSections = parseKnowledgeBase(FINANCE_BILL_CONTEXT);

    const SYNONYM_MAP = {
        'mkate': ['bread', 'loaf', 'bakers', 'bakery'],
        'boflo': ['bread', 'loaf'],
        'gari': ['vehicle', 'car', 'motor'],
        'magari': ['vehicle', 'car', 'motor'],
        'nyumba': ['housing', 'house', 'construction', 'loan'],
        'simu': ['phone', 'cellular', 'smartphone', 'electronics'],
        'betri': ['battery', 'lithium', 'electronics'],
        'chuma': ['scrap', 'metal', 'copper'],
        'mshahara': ['salary', 'employee', 'benefits', 'income', 'paye'],
        'marupurupu': ['benefit', 'threshold', 'perks', 'non-cash'],
        'kodi': ['tax', 'levy', 'duty', 'wht', 'vat', 'withholding'],
        'ushuru': ['tax', 'levy', 'duty', 'wht', 'vat', 'withholding'],
        'mazingira': ['eco', 'environmental', 'plastic', 'packaging'],
        'deni': ['debt', 'borrow', 'repay', 'loans'],
        'madeni': ['debt', 'borrow', 'repay', 'loans'],
        'mafuta': ['fuel', 'pump', 'road maintenance', 'levy'],
        'biashara': ['business', 'merchant', 'etims', 'traders'],
        'faida': ['winnings', 'gambling', 'betting'],
        'michezo': ['gambling', 'betting'],
        'yutuba': ['youtube', 'creator', 'tiktok', 'digital content'],
        'yutub': ['youtube', 'creator', 'tiktok', 'digital content'],
        'wavuti': ['digital', 'online', 'software', 'platform'],
        'penalti': ['penalties', 'non-compliance', 'fine'],
        'adhabu': ['penalties', 'non-compliance', 'fine'],
        'maisha': ['impact', 'cost of living', 'mwananchi'],
        'hustler': ['small business', 'informal', 'etims', 'mwananchi'],
        'wananchi': ['ordinary', 'kenyan', 'citizen', 'mwananchi'],
        'boda': ['motorcycle', 'electric', 'vat', 'transportation'],
        'solar': ['panels', 'energy', 'vat'],
        'fuel': ['road maintenance', 'pump', 'petrol', 'diesel'],
        'creators': ['monetization', 'content', 'youtube', 'tiktok', 'instagram'],
        'influencer': ['monetization', 'content', 'youtube', 'tiktok', 'instagram'],
        'etims': ['etims', 'invoice', 'reporting', 'compliance'],
        'wht': ['withholding'],
        'vat': ['value added', 'zero-rated', 'exempt'],
        'dst': ['digital services', 'streaming', 'marketplace']
    };

    function getLocalResponse(queryText, userLang, isSwahiliQuery) {
        const cleanQuery = queryText.toLowerCase().replace(/[^\w\s-]/g, ' ');
        const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);
        
        if (queryWords.length === 0) {
            return userLang === 'sw' 
                ? "Habari! Mimi ni AI Advisor wako. Tafadhali uliza swali kuhusu Mswada wa Fedha wa Kenya (kama vile ushuru wa gari, mkate, au eco levy)."
                : "Hello! I am your local AI Advisor. Please type a question about the Kenya Finance Bill (e.g., motor vehicle tax, bread VAT, eco levy).";
        }

        // Expand query words with synonyms
        let expandedQueryWords = [...queryWords];
        queryWords.forEach(word => {
            if (SYNONYM_MAP[word]) {
                expandedQueryWords = expandedQueryWords.concat(SYNONYM_MAP[word]);
            }
        });
        expandedQueryWords = [...new Set(expandedQueryWords)];

        // Rank sections
        let bestSection = null;
        let highestScore = 0;

        parsedSections.forEach(section => {
            let score = 0;

            // 1. Keyword match score
            section.keywords.forEach(kw => {
                if (expandedQueryWords.includes(kw)) {
                    score += 1.5;
                }
            });

            // 2. Title match bonus
            const titleLower = section.title.toLowerCase();
            expandedQueryWords.forEach(qw => {
                if (titleLower.includes(qw)) {
                    score += 4.0;
                }
            });

            // 3. Exact phrase match bonus
            const phrases = ["motor vehicle", "eco levy", "withholding tax", "digital services", "scrap metal", "road maintenance", "non resident", "housing loan", "gratuity exemption"];
            phrases.forEach(phrase => {
                if (cleanQuery.includes(phrase) && section.rawContent.toLowerCase().includes(phrase)) {
                    score += 10.0;
                }
            });

            if (score > highestScore) {
                highestScore = score;
                bestSection = section;
            }
        });

        // Threshold check
        if (highestScore < 2.0 || !bestSection) {
            if (userLang === 'sw' || isSwahiliQuery) {
                return "Habari! Siwezi kupata maelezo kamili kuhusu swali hilo kwenye Mswada wa Fedha wa 2026. <br><br>Tafadhali jaribu kuuliza kuhusu: <strong>kodi ya mkate (VAT)</strong>, <strong>kodi ya magari (motor vehicle tax)</strong>, <strong>kodi ya mazingira (eco levy)</strong>, <strong>mifumo ya eTIMS</strong>, au <strong>ushuru wa waundaji wa maudhui (content creators WHT)</strong>.";
            } else {
                return "Hello! I couldn't find specific details for that query in the official 2026 Finance Bill knowledge base. <br><br>Try asking about trending topics like: <strong>bread VAT</strong>, <strong>motor vehicle tax</strong>, <strong>eco levy on electronics</strong>, <strong>eTIMS compliance</strong>, or <strong>withholding tax on digital content</strong>.";
            }
        }

        // Format the content
        let formattedContent = bestSection.rawContent;
        if (window.AI_CONFIG && typeof window.AI_CONFIG.formatMarkdown === 'function') {
            formattedContent = window.AI_CONFIG.formatMarkdown(bestSection.rawContent);
        } else {
            formattedContent = bestSection.rawContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
                .replace(/-\s+(.*?)(?=<br>|$)/g, '<li style="margin-left: 1rem; margin-bottom: 0.25rem;">$1</li>');
        }

        // Return themed response
        if (userLang === 'sw' || isSwahiliQuery) {
            return `Habari! Hapa kuna maelezo rasmi kuhusu <strong>${bestSection.title}</strong> kutoka kwenye Mswada wa Fedha wa 2026:<br><br>
            <div style="background: rgba(0, 0, 0, 0.02); padding: 1rem; border-left: 4px solid var(--red); border-radius: 4px; margin-bottom: 0.5rem;">
                ${formattedContent}
            </div><br>
            Je, kuna jambo lingine ungependa kufahamu kuhusu ushuru huu?`;
        } else {
            return `Hello! Here is the official information regarding <strong>${bestSection.title}</strong> from the Finance Bill 2026:<br><br>
            <div style="background: rgba(0, 0, 0, 0.02); padding: 1rem; border-left: 4px solid var(--red); border-radius: 4px; margin-bottom: 0.5rem;">
                ${formattedContent}
            </div><br>
            Let me know if you need more details or have another question!`;
        }
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
                sw_reply: "Habari! Kuhusu chuma chakavu: Mswada unaleta Kodi ya Zuio (Withholding Tax) kwenye uuzaji wa chuma chakavu ili kuleta sekta hii isiyo rasmi kwenye mfumo vya kodi."
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

        const glossary = {
            "finance bill": "The Finance Bill outlines tax proposals, levies, and fiscal measures for the fiscal year.",
            "vat": "Value Added Tax, a consumption tax applied to goods and services, currently 16% in Kenya.",
            "eco levy": "Environmental levy on plastic packaging and electronic waste to fund waste management.",
            "motor vehicle tax": "Annual tax on vehicle valuation, used to fund road maintenance.",
            "housing levy": "Deduction from salaries to fund affordable housing projects.",
            "kra": "Kenya Revenue Authority, the tax collection agency.",
            "paye": "Pay As You Earn, employee income tax withholding.",
            "withholding tax": "Tax deducted at source on certain payments like scrap metal.",
            "digital services tax": "Tax on digital platform revenues.",
            "bread vat": "Zero-rated VAT on basic bread to keep prices low."
        };

        // Language is always set before simulateResponse is called (modal fires on chatbot open)
        processResponse();

        function processResponse() {
            let userLang = sessionStorage.getItem('finance_chat_lang') || 'en';
            let response = "";
            const lowerText = text.toLowerCase();

            // 1. Check Glossary
            for (const term in glossary) {
                if (lowerText.includes(term)) {
                    const def = glossary[term];
                    response = userLang === 'sw' ? `Habari! ${def}` : `Hello! ${def}`;
                    break;
                }
            }

            if (!response) {
                const swahiliIndicators = ["habari", "mambo", "vipi", "kodi", "gari", "mkate", "wananchi", "athari", "ushuru", "nyumba", "deni", "nini", "kwa", "na", "ya", "ni", "sana", "karibu", "habari yako", "boda", "chuma", "mshahara", "adhabu", "marupurupu"];
                const isSwahiliQuery = swahiliIndicators.some(indicator => lowerText.includes(indicator));

                // 2. Score Curated Responses
                let bestCurated = null;
                let highestCuratedScore = 0;
                let matchedInSwahili = false;

                botResponses.forEach(item => {
                    let score = 0;
                    item.keys.forEach(k => {
                        if (lowerText.includes(k)) score += 3;
                    });
                    item.sw_keys.forEach(k => {
                        if (lowerText.includes(k)) {
                            score += 3;
                            matchedInSwahili = true;
                        }
                    });

                    if (score > highestCuratedScore) {
                        highestCuratedScore = score;
                        bestCurated = item;
                    }
                });

                // 3. Get Dynamic Local Response
                const dynamicResponse = getLocalResponse(text, userLang, isSwahiliQuery);

                if (highestCuratedScore >= 3 && bestCurated) {
                    const specificDetailsKeywords = ["rate", "percentage", "amount", "fine", "penalty", "penalties", "shilingi", "ksh", "timeline", "days", "years", "exemption", "non-resident", "etims", "gratuity", "shipping", "laptops", "diapers", "plastic"];
                    const wantsSpecificDetails = specificDetailsKeywords.some(kw => lowerText.includes(kw));

                    if (wantsSpecificDetails && highestCuratedScore < 6) {
                        response = dynamicResponse;
                    } else {
                        response = (userLang === 'sw' || matchedInSwahili) ? bestCurated.sw_reply : bestCurated.reply;
                    }
                } else {
                    response = dynamicResponse;
                }
            }

            // Save response to history
            chatHistory.push({ role: 'assistant', content: response });
            saveHistory();

            addMessage(response, 'bot');
        }
    };

    // Helper for rendering quick suggestion chips in the chat
    const initSuggestionChips = () => {
        if (!aiChatBody) return;
        if (chatHistory && chatHistory.length > 0) return; // Don't show if conversation exists
        
        // Remove existing container if any
        const existingContainer = aiChatBody.querySelector('.ai-chips-container');
        if (existingContainer) existingContainer.remove();
        
        const container = document.createElement('div');
        container.className = 'ai-chips-container';
        container.innerHTML = `
            <button class="ai-chip" data-query="Does bread have VAT?">🍞 Bread VAT</button>
            <button class="ai-chip" data-query="How much is the Motor Vehicle Tax?">🚗 Motor Vehicle Tax</button>
            <button class="ai-chip" data-query="What is the Eco Levy on laptops?">📱 Eco Levy</button>
            <button class="ai-chip" data-query="Are content creators taxed?">💼 Creators WHT</button>
            <button class="ai-chip" data-query="What is eTIMS?">📊 eTIMS System</button>
        `;
        
        aiChatBody.appendChild(container);
        
        container.querySelectorAll('.ai-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                if (aiInput) {
                    aiInput.value = chip.dataset.query;
                    handleAISend();
                }
            });
        });
        
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    };

    // Render stored chat history or suggestion chips
    if (aiChatBody) {
        if (chatHistory && chatHistory.length > 0) {
            aiChatBody.innerHTML = ''; // Clear default greeting to avoid repetition
            chatHistory.forEach(msg => {
                const roleType = (msg.role === 'assistant' || msg.role === 'bot') ? 'bot' : 'user';
                addMessage(msg.content, roleType);
            });
        } else {
            // Append suggestion chips under the initial greeting
            setTimeout(initSuggestionChips, 150);
        }
    }

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
                // Silent fallback to local AI search engine immediately
                console.warn("API call failed, falling back to local engine:", error);
                setTimeout(() => {
                    typing.remove();
                    simulateResponse(rawText);
                }, 600);
            }
        } else {
            setTimeout(() => {
                typing.remove();
                simulateResponse(rawText);
            }, 600);
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

    // Dynamic CSS for animations, suggestion chips, and language modal
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
        .ai-chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            margin: 0.75rem 0;
            padding: 0 0.5rem;
        }
        .ai-chip {
            background: rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.08);
            padding: 0.35rem 0.75rem;
            border-radius: 50px;
            font-size: 0.75rem;
            cursor: pointer;
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .ai-chip:hover {
            background: #C60000 !important;
            color: white !important;
            border-color: #C60000 !important;
            transform: translateY(-1px);
        }

        /* ── Language Selection Modal ── */
        #lang-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        #lang-modal.lang-modal-visible {
            opacity: 1;
            pointer-events: all;
        }
        .lang-modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
        }
        .lang-modal-content {
            position: relative;
            z-index: 1;
            background: #ffffff;
            border-radius: 20px;
            padding: 2.5rem 2rem;
            text-align: center;
            max-width: 340px;
            width: 90%;
            box-shadow: 0 30px 80px rgba(0,0,0,0.25);
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }
        #lang-modal.lang-modal-visible .lang-modal-content {
            transform: translateY(0);
        }
        .lang-modal-icon {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
        }
        .lang-modal-content h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.3rem;
            font-weight: 800;
            color: #0F172A;
            margin-bottom: 0.4rem;
        }
        .lang-modal-content p {
            font-size: 0.88rem;
            color: #64748b;
            margin-bottom: 1.5rem;
        }
        .lang-btn-group {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
        }
        .lang-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
            padding: 0.85rem 1.4rem;
            border-radius: 14px;
            border: 2px solid #e2e8f0;
            background: #f8fafc;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            font-weight: 700;
            color: #0F172A;
            transition: all 0.2s ease;
            min-width: 110px;
        }
        .lang-btn:hover {
            background: #C60000;
            color: white;
            border-color: #C60000;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(198,0,0,0.25);
        }
        .lang-flag {
            font-size: 1.8rem;
        }
    `;
    document.head.appendChild(style);
// Countdown Timer
function startCountdown() {
  const deadline = new Date('2026-05-25T17:00:00+03:00').getTime();
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const statusEl = document.getElementById('countdown-status');
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
  const update = () => {
    const now = new Date().getTime();
    const diff = deadline - now;
    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      if (statusEl) statusEl.textContent = 'Submission Closed';
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
  };
  update();
  const timer = setInterval(update, 1000);
}
startCountdown();
});
