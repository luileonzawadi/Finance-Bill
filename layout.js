// layout.js — Injects shared navbar and footer from the /layout folder
(function () {
    function loadLayout(placeholderId, url) {
        const el = document.getElementById(placeholderId);
        if (!el) return;
        fetch(url)
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load ' + url);
                return res.text();
            })
            .then(function (html) {
                el.outerHTML = html;
                // Re-run any scripts that depend on navbar after it's injected
                if (placeholderId === 'navbar-placeholder') {
                    // Prefer global initNavbar if provided by script.js (idempotent)
                    if (typeof window.initNavbar === 'function') {
                        try { window.initNavbar(); } catch (e) { console.error(e); }
                    } else {
                        initNavbar();
                    }
                }
            })
            .catch(function (err) {
                console.error(err);
            });
    }

    function initNavbar() {
        // Mobile menu toggle — mirrors logic in script.js and ensures injected navbar works
        var menuToggle = document.getElementById('mobile-menu');
        var navLinks = document.querySelector('.nav-links');
        var menuIcon = document.getElementById('menu-icon');
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', function () {
                var isActive = navLinks.classList.toggle('active');
                if (menuIcon) {
                    menuIcon.classList.toggle('fa-bars');
                    menuIcon.classList.toggle('fa-times');
                }
                document.body.style.overflow = isActive ? 'hidden' : 'auto';
            });

            navLinks.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    if (navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        if (menuIcon) {
                            menuIcon.classList.replace('fa-times', 'fa-bars');
                        }
                        document.body.style.overflow = 'auto';
                    }
                });
            });
        }

        // Mark active nav link based on current page
        var currentPage = window.location.pathname.split('/').pop() || 'index.html';
        var links = document.querySelectorAll('.nav-links a');
        links.forEach(function (link) {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    function getBasePath() {
        var path = window.location.pathname;
        if (path.endsWith('/')) return path;
        return path.substring(0, path.lastIndexOf('/') + 1);
    }

    // Resolve the layout path relative to current page location
    const base = getBasePath();

    document.addEventListener('DOMContentLoaded', function () {
        loadLayout('navbar-placeholder', base + 'layout/navbar.html');
        loadLayout('footer-placeholder', base + 'layout/footer.html');
    });
})();
