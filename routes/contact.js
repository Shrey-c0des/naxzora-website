const express = require('express');
const router = express.Router();

const db = require('../db/connection');

const BASE_URL = 'https://naxzora.com';

function getContactSeoData(success = false) {
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": `${BASE_URL}/#localbusiness`,
            "name": "NAXZORA",
            "image": `${BASE_URL}/images/logo.png`,
            "url": BASE_URL,
            "telephone": "+91-79902-13618",
            "email": "naxzorabathimpex@gmail.com",
            "description": "Premium bathroom fittings, faucets, showers, pipes, valves, and sanitary hardware manufacturer and supplier in Rajkot, Gujarat.",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Survey No. 42, Plot No. 6, B/h Hero Showroom, Gondal Road, Vavdi",
                "addressLocality": "Rajkot",
                "addressRegion": "Gujarat",
                "postalCode": "360004",
                "addressCountry": "IN"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 22.27,
                "longitude": 70.75
            },
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    "opens": "09:00",
                    "closes": "18:00"
                }
            ],
            "priceRange": "$$",
            "areaServed": {
                "@type": "Country",
                "name": "India"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "Contact Us", "item": `${BASE_URL}/contact` }
            ]
        }
    ];

    return {
        title: 'Contact NAXZORA - Get in Touch for Premium Bathroom Fittings | Rajkot, Gujarat',
        currentPage: 'contact',
        success,
        metaDescription: 'Contact NAXZORA for premium bathroom fittings, bulk orders, and dealer enquiries. Visit our showroom at Gondal Road, Vavdi, Rajkot, Gujarat 360004 or call +91 79902 13618.',
        canonicalUrl: `${BASE_URL}/contact`,
        ogTitle: 'Contact NAXZORA | Premium Bathroom Fittings',
        ogDescription: 'Have a question about our products or want to place a bulk order? Contact NAXZORA — premium bathroom fittings manufacturer in Rajkot, Gujarat, India.',
        ogImage: `${BASE_URL}/images/logo.png`,
        ogType: 'website',
        keywords: 'contact NAXZORA, NAXZORA Rajkot, bathroom fittings dealer Rajkot, bathroom fittings enquiry, NAXZORA phone number, NAXZORA address, bathroom hardware Gujarat, bulk order bathroom fittings',
        jsonLd,
    };
}

// Contact page
router.get('/', (req, res) => {
    res.render('contact', getContactSeoData(false));
});

// Handle contact form submission
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, subject } = req.body;
        
        // Basic backend validation
        if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
            return res.status(400).send('Name, Email, and Message are required.');
        }

        await db.addInquiry(name.trim(), email.trim(), phone || '', subject || 'General Inquiry', message.trim());
        
        res.render('contact', getContactSeoData(true));
    } catch (err) {
        console.error('Error saving inquiry:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
