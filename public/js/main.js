document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    // Sticky Navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const navOverlay = document.getElementById('nav-overlay');
    let isMenuOpen = false;

    const toggleMenu = () => {
        isMenuOpen = !isMenuOpen;
        navLinks.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
        
        // Toggle icon
        const icon = mobileMenuBtn.querySelector('i');
        if (isMenuOpen) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMenu();
        });
    });

    // Simple Intersection Observer for scroll animations (fade in up)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Brochure Modal Logic
    const brochureModal = document.getElementById('brochureModal');
    const openBrochureBtn = document.getElementById('openBrochureModal');
    const closeBrochureBtn = document.getElementById('closeBrochureModal');

    if (openBrochureBtn && brochureModal) {
        openBrochureBtn.addEventListener('click', (e) => {
            e.preventDefault();
            brochureModal.style.display = 'flex';
        });

        closeBrochureBtn.addEventListener('click', () => {
            brochureModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === brochureModal) {
                brochureModal.style.display = 'none';
            }
        });
    }
});
