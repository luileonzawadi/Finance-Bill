document.addEventListener('DOMContentLoaded', () => {
    // Scroll Progress Tracking
    const scrollProgress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (scrollProgress) scrollProgress.style.width = scrolled + "%";
    });

    // Mobile Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            
            // Toggle body scroll
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'auto';
        });
    }

    // Smooth Scroll and Close Menu on Mobile
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (mobileMenu) mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for Premium Reveal
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.card, .section-header, .impact-item, .hero-text, .image-wrapper, .comparison-wrapper, .metric-card');
    
    revealElements.forEach(el => {
        el.classList.add('reveal-hidden');
        revealObserver.observe(el);
    });

    // Hover Magnets for Cards
    const cards = document.querySelectorAll('.card, .metric-card, .comparison-table .row');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 1024) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // AI Advisor UI Controls
    const aiAdvisor = document.getElementById('ai-advisor');
    const aiTrigger = document.querySelector('.ai-trigger');
    const aiClose = document.querySelector('.ai-close');
    const aiSend = document.getElementById('ai-send');
    const aiInput = document.getElementById('ai-input');
    const aiChatBody = document.getElementById('ai-chat-body');

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

    // ==========================================
    // AI API INTEGRATION (LOGIC)
    // ==========================================
    // (Settings are pulled from config.js)

    const addMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = `ai-message ${type}`;
        msg.textContent = text;
        aiChatBody.appendChild(msg);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    };

    const handleAISend = async () => {
        const text = aiInput.value.trim().toLowerCase();
        if (!text) return;

        addMessage(aiInput.value, 'user');
        aiInput.value = '';

        // Simulate typing/processing
        const typing = document.createElement('div');
        typing.className = 'ai-message bot';
        typing.textContent = 'Analyzing bill...';
        aiChatBody.appendChild(typing);

        if (typeof AI_CONFIG !== 'undefined' && AI_CONFIG.isLive) {
            try {
                // REAL API CALL WITH GROUNDING
                const response = await fetch(AI_CONFIG.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4",
                        messages: [
                            { 
                                role: "system", 
                                content: `You are an expert on the Kenya Finance Bill 2026. 
                                Use the following official context as your Source of Truth to answer user questions. 
                                If the information is not in this context, state that you are analyzing the official documents. 
                                DO NOT HALLUCINATE.
                                
                                CONTEXT:
                                ${FINANCE_BILL_CONTEXT}` 
                            },
                            { role: "user", content: text }
                        ]
                    })
                });
                const data = await response.json();
                typing.remove();
                addMessage(data.choices[0].message.content, 'bot');
            } catch (error) {
                typing.remove();
                addMessage("I'm having trouble reaching the live intelligence engine. Reverting to local analysis...", 'bot');
                setTimeout(() => simulateResponse(text), 1000);
            }
        } else {
            // Simulated Response (Fallback)
            setTimeout(() => {
                typing.remove();
                simulateResponse(text);
            }, 1500);
        }
    };

    const simulateResponse = (text) => {
        const botResponses = {
            "bread": "The Finance Bill 2026 proposes removing the zero-rated status for bread, which would introduce a 16% VAT. This is expected to increase retail prices by approximately Ksh 10-15 per loaf.",
            "motor": "A new Motor Vehicle Tax is proposed at 2.5% of the vehicle's value. This is intended as a wealth tax to broaden the revenue base.",
            "housing": "The Housing Levy remains at 1.5% of gross salary, consistent with the 2025 Act, aimed at funding the affordable housing project.",
            "eco": "The Eco Levy will target electronic waste and plastic packaging, with rates varying from Ksh 98 to Ksh 1,275 depending on the item's environmental impact.",
            "default": "That's a great question about the 2026 Bill. While I'm analyzing the specific clause, generally this bill focuses on broadening the tax base while targeting luxury and digital services. Would you like to know about VAT or the new Eco Levy?"
        };

        let response = botResponses.default;
        for (let key in botResponses) {
            if (text.includes(key)) {
                response = botResponses[key];
                break;
            }
        }
        addMessage(response, 'bot');
    };

    if (aiSend) aiSend.addEventListener('click', handleAISend);
    if (aiInput) aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAISend(); });

    // Contact Form Submission (EmailJS)
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Sending...';
            submitBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
            
            // Collect form data
            const formData = {
                user_name: document.getElementById('user_name').value,
                user_email: document.getElementById('user_email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            // Send via EmailJS
            if (typeof EMAILJS_CONFIG !== 'undefined') {
                emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, formData)
                    .then(function() {
                        // Success
                        formStatus.textContent = "Message sent successfully! We'll get back to you soon.";
                        formStatus.className = "form-status success";
                        contactForm.reset();
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.querySelector('span').textContent = 'Send Message';
                        submitBtn.querySelector('i').className = 'fas fa-paper-plane';
                        
                        // Hide message after 5 seconds
                        setTimeout(() => {
                            formStatus.style.display = 'none';
                        }, 5000);
                    }, function(error) {
                        // Error
                        console.error('EmailJS Error:', error);
                        formStatus.textContent = "Oops! Something went wrong. Please try again or email us directly.";
                        formStatus.className = "form-status error";
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.querySelector('span').textContent = 'Send Message';
                        submitBtn.querySelector('i').className = 'fas fa-paper-plane';
                    });
            } else {
                // Fallback if EmailJS is not configured
                console.warn('EmailJS not configured');
                formStatus.textContent = "Email service not configured. Please try again later.";
                formStatus.className = "form-status error";
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = 'Send Message';
                submitBtn.querySelector('i').className = 'fas fa-paper-plane';
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
        .card, .metric-card, .comparison-table .row {
            transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});
