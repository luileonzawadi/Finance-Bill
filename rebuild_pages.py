import re

SPIRAL = """    <div id="scroll-progress"></div>
    <div class="national-spirals">
        <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <g class="ring-clockwise" opacity="0.25">
                <circle cx="400" cy="400" r="280" stroke="var(--black)" stroke-width="1.5" stroke-dasharray="12 12" fill="none" />
                <text x="680" y="405" font-family="Outfit,sans-serif" font-weight="800" font-size="16" fill="var(--red)" text-anchor="middle">%</text>
                <text x="400" y="690" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="var(--green)" text-anchor="middle">Ksh</text>
                <text x="120" y="405" font-family="Outfit,sans-serif" font-weight="800" font-size="16" fill="var(--red)" text-anchor="middle">%</text>
                <text x="400" y="130" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="var(--green)" text-anchor="middle">Ksh</text>
                <circle cx="400" cy="400" r="320" stroke="var(--white)" stroke-width="1" stroke-dasharray="4 20" fill="none" />
            </g>
            <g class="ring-counter" opacity="0.2">
                <circle cx="400" cy="400" r="180" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="8 8" fill="none" />
                <circle cx="400" cy="400" r="220" stroke="var(--green)" stroke-width="1" stroke-dasharray="2 12" fill="none" />
            </g>
        </svg>
    </div>"""

HEADER = """    <header id="navbar">
    <nav class="container">
        <div class="logo">
            <div class="logo-text">FINANCE BILL <span>2026</span></div>
        </div>
        <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="analysis.html">Analysis</a></li>
            <li><a href="comparison.html">Comparison</a></li>
            <li><a href="impact.html">Key Impacts</a></li>
            <li class="mobile-cta"><a href="https://www.parliament.go.ke/sites/default/files/2026-05/THE%20FINANCE%20BILL%2C2026%20%281%29_1.pdf" target="_blank">Download PDF</a></li>
        </ul>
        <button class="cta-btn" onclick="window.open('https://www.parliament.go.ke/sites/default/files/2026-05/THE%20FINANCE%20BILL%2C2026%20%281%29_1.pdf','_blank')">Download PDF</button>
        <div class="menu-toggle" id="mobile-menu">
            <i class="fas fa-bars" id="menu-icon"></i>
        </div>
    </nav>
</header>"""

CHATBOT = """    <div id="ai-advisor" class="ai-bubble">
        <div class="ai-trigger">
            <i class="fas fa-robot"></i>
            <span>Ask AI Advisor</span>
        </div>
        <div class="ai-window">
            <div class="ai-header">
                <div class="ai-status">
                    <div class="pulse"></div>
                    <div class="status-text">
                        <strong>AI Tax Advisor</strong>
                        <span id="ai-connection-status" style="display:block;font-size:0.7rem;opacity:0.7;">Live Intelligence Active</span>
                    </div>
                </div>
                <button class="ai-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="ai-body" id="ai-chat-body">
                <div class="ai-message bot">Hello! I am your Senior Tax Advisor. Ask me anything about the Finance Bill 2026.</div>
            </div>
            <div class="ai-footer">
                <textarea id="ai-input" placeholder="Type your question..." rows="1"></textarea>
                <button id="ai-send"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>"""

FOOTER = """    <footer>
    <div class="container">
        <div class="footer-grid">
            <div class="footer-about">
                <div class="logo">
                    <div class="logo-text">FINANCE BILL <span>2026</span></div>
                </div>
                <p>Independent review and analysis of Kenya's tax policies.</p>
            </div>
            <div class="footer-social">
                <h4>Contributors</h4>
                <div class="footer-contributors-grid">
                    <div class="footer-contributor">
                        <img src="images/folder/ispeak tech chapter.png" alt="iSpeak Tech Chapter">
                        <span>iSpeak Tech Chapter</span>
                        <small>Tech Advocacy &amp; Education</small>
                    </div>
                    <div class="footer-contributor">
                        <img src="images/folder/teklora solutions.png" alt="Teklora Solutions">
                        <span>Teklora Solutions</span>
                        <small>Software &amp; Digital Solutions</small>
                    </div>
                    <div class="footer-contributor">
                        <img src="images/folder/TT ARTS.png" alt="TT Arts">
                        <span>TT Arts</span>
                        <small>Creative &amp; Design Studio</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>"""

SCRIPTS = """    <script src="secrets.js"></script>
    <script src="config.js"></script>
    <script src="knowledge_base.js"></script>
    <script src="layout.js"></script>
    <script src="script.js"></script>
    <script>
        var menuBtn = document.getElementById('mobile-menu');
        var menuIcon = document.getElementById('menu-icon');
        var navMenu = document.querySelector('.nav-links');
        if (menuBtn && navMenu) {
            menuBtn.addEventListener('click', function() {
                navMenu.classList.toggle('active');
                if (navMenu.classList.contains('active')) { menuIcon.className = 'fas fa-times'; }
                else { menuIcon.className = 'fas fa-bars'; }
            });
        }
    </script>"""

INLINE_CSS = """    <style>
        #navbar { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; background: rgba(255,255,255,0.75); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.4); padding: 1.2rem 0; }
        #navbar nav { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; }
        .logo-text { font-size: 1.4rem; font-weight: 800; letter-spacing: -1px; color: #0F172A; }
        .logo-text span { color: #C60000; }
        .nav-links { display: flex; list-style: none; gap: 2.5rem; margin: 0; padding: 0; }
        .nav-links a { text-decoration: none; color: #475569; font-weight: 600; font-size: 0.95rem; }
        .cta-btn { padding: 0.6rem 1.4rem; border: none; border-radius: 50px; background: #C60000; color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .menu-toggle { display: none; }
        @media (max-width: 768px) {
            .nav-links { display: none; }
            .nav-links.active { display: flex !important; flex-direction: column; position: fixed !important; top: 70px !important; left: 10px !important; right: 10px !important; background: rgba(255,255,255,0.96) !important; backdrop-filter: blur(10px) !important; padding: 0.75rem 1rem !important; gap: 0.25rem !important; border-radius: 12px !important; box-shadow: 0 18px 40px rgba(0,0,0,0.12) !important; z-index: 99999 !important; list-style: none; margin: 0; }
            .nav-links.active li { padding: 0.5rem 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
            .nav-links.active li:last-child { border-bottom: none; }
            .nav-links a { display: block; padding: 0.5rem 0.25rem; }
            .cta-btn { display: none; }
            .menu-toggle { display: block; font-size: 1.5rem; cursor: pointer; }
        }
    </style>"""

pages = {
    'analysis.html': 'Finance Bill 2026 Analysis | Mwananchi Guide',
    'comparison.html': 'Finance Bill 2026 Comparison | Mwananchi Guide',
    'impact.html': 'Finance Bill Impact | Kenya Path Forward'
}

for fname, title in pages.items():
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    main_match = re.search(r'<main>(.*?)</main>', content, re.DOTALL)
    if not main_match:
        print(f'No <main> tag found in {fname}')
        continue
    main_content = main_match.group(1)

    # Remove any old chatbot inside main
    main_content = re.sub(r'\s*<div id="ai-advisor".*', '', main_content, flags=re.DOTALL)

    new_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="Finance Bill 2026 Kenya analysis and review.">
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/svg+xml" href="images/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    <script src="config.js"></script>
    <script type="text/javascript">
        (function() {{ if (typeof EMAILJS_CONFIG !== 'undefined') {{ emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY); }} }})();
    </script>
{INLINE_CSS}
</head>
<body>
{SPIRAL}
{HEADER}
    <main>
{main_content}
    </main>
{CHATBOT}
{FOOTER}
{SCRIPTS}
</body>
</html>'''

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f'Done: {fname}')

print('All pages rebuilt successfully.')
