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

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMenu();
        });
    });

    // ============================================
    // HERO SLIDESHOW
    // ============================================
    const slideshow = document.getElementById('heroSlideshow');
    if (slideshow) {
        const slides = slideshow.querySelectorAll('.slide');
        const indicators = slideshow.querySelectorAll('.indicator');
        let currentSlide = 0;
        const INTERVAL = 5000;

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            indicators[currentSlide].classList.remove('active');
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
        }

        let timer = setInterval(() => {
            goToSlide((currentSlide + 1) % slides.length);
        }, INTERVAL);

        indicators.forEach(ind => {
            ind.addEventListener('click', () => {
                clearInterval(timer);
                goToSlide(parseInt(ind.dataset.slide));
                timer = setInterval(() => {
                    goToSlide((currentSlide + 1) % slides.length);
                }, INTERVAL);
            });
        });
    }

    // ============================================
    // STAGGERED REVEAL ANIMATION SYSTEM
    // ============================================
    
    // Elements that reveal on scroll
    const revealClasses = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale', '.hero-reveal'];
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    revealClasses.forEach(cls => {
        document.querySelectorAll(cls).forEach(el => {
            revealObserver.observe(el);
        });
    });

    // Cards get staggered reveal
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Find all sibling cards in the same grid
                const parent = entry.target.closest('.grid');
                if (parent) {
                    const cards = parent.querySelectorAll('.card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, index * 120); // 120ms stagger between cards
                    });
                } else {
                    entry.target.classList.add('visible');
                }
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Observe only the first card in each grid to trigger stagger
    document.querySelectorAll('.grid').forEach(grid => {
        const firstCard = grid.querySelector('.card');
        if (firstCard) {
            cardObserver.observe(firstCard);
        }
    });

    // Legacy support: animate-on-scroll
    const legacyObserver = new IntersectionObserver((entries) => {
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
        el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        legacyObserver.observe(el);
    });

    // Hero: trigger immediately with stagger
    const heroElements = document.querySelectorAll('.hero-reveal');
    heroElements.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, 300 + (i * 200)); // Start after 300ms, 200ms between each
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
