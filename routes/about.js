const express = require('express');
const router = express.Router();

const BASE_URL = 'https://naxzora.com';

// About page
router.get('/', (req, res) => {
    // JSON-LD: Organization + BreadcrumbList
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${BASE_URL}/#organization`,
            "name": "NAXZORA",
            "url": BASE_URL,
            "logo": `${BASE_URL}/images/logo.png`,
            "description": "NAXZORA is dedicated to revolutionizing bathroom spaces through cutting-edge technologies and thoughtful design solutions. We offer precision-engineered faucets, showers, pipes, valves, and bathroom accessories from Rajkot, Gujarat, India.",
            "foundingLocation": {
                "@type": "Place",
                "name": "Rajkot, Gujarat, India"
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Survey No. 42, Plot No. 6, B/h Hero Showroom, Gondal Road, Vavdi",
                "addressLocality": "Rajkot",
                "addressRegion": "Gujarat",
                "postalCode": "360004",
                "addressCountry": "IN"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-79902-13618",
                "contactType": "customer service",
                "email": "naxzorabathimpex@gmail.com",
                "availableLanguage": ["English", "Hindi", "Gujarati"]
            },
            "knowsAbout": [
                "Bathroom Fittings", "Faucets", "Sanitary Hardware",
                "Showers", "Pipes", "Valves", "Bathroom Accessories"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "About Us", "item": `${BASE_URL}/about` }
            ]
        }
    ];

    res.render('about', {
        title: 'About NAXZORA - Our Story, Vision & Premium Bathroom Solutions | Rajkot, India',
        currentPage: 'about',
        metaDescription: 'Learn about NAXZORA — a premium bathroom fittings and sanitary hardware manufacturer from Rajkot, Gujarat. We deliver innovative, sustainable, and luxurious bathroom solutions built with precision engineering.',
        canonicalUrl: `${BASE_URL}/about`,
        ogTitle: 'About NAXZORA | Our Story & Vision',
        ogDescription: 'NAXZORA is dedicated to revolutionizing bathroom spaces with cutting-edge technologies and thoughtful design. Discover our story of comfort, convenience, and sustainability.',
        ogImage: `${BASE_URL}/images/product_showcase.png`,
        ogType: 'website',
        keywords: 'about NAXZORA, NAXZORA company, bathroom fittings manufacturer India, sanitary hardware Rajkot, premium bathroom brand, NAXZORA story, bathroom solutions Gujarat',
        jsonLd,
    });
});

module.exports = router;
