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
                    initNavbar();
                }
            })
            .catch(function (err) {
                console.error(err);
            });
    }

    function initNavbar() {
        // Mobile menu toggle — mirrors logic in script.js
        var menuToggle = document.getElementById('mobile-menu');
        var navLinks = document.querySelector('.nav-links');
        var menuIcon = document.getElementById('menu-icon');
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', function () {
                navLinks.classList.toggle('active');
                if (menuIcon) {
                    menuIcon.classList.toggle('fa-bars');
                    menuIcon.classList.toggle('fa-times');
                }
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

    // Resolve the layout path relative to root (works from any subdirectory depth)
    const base = '/';

    document.addEventListener('DOMContentLoaded', function () {
        loadLayout('navbar-placeholder', base + 'layout/navbar.html');
        loadLayout('footer-placeholder', base + 'layout/footer.html');
    });
})();
