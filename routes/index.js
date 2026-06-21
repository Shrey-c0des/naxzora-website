const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const BASE_URL = 'https://naxzora.com';

// Home page
router.get('/', async (req, res) => {
    try {
        const categories = await db.getCategories();
        const featuredProducts = await db.getFeaturedProducts();

        // JSON-LD: WebSite + Organization
        const jsonLd = [
            {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${BASE_URL}/#website`,
                "name": "NAXZORA",
                "url": BASE_URL,
                "description": "Premium bathroom fittings, faucets, sanitary hardware and accessories manufacturer in India.",
                "publisher": { "@id": `${BASE_URL}/#organization` }
            },
            {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": `${BASE_URL}/#organization`,
                "name": "NAXZORA",
                "url": BASE_URL,
                "logo": `${BASE_URL}/images/logo.png`,
                "description": "NAXZORA is a premium bathroom fittings and sanitary hardware manufacturer based in Rajkot, Gujarat, India. We offer precision-engineered faucets, showers, pipes, valves, and bathroom accessories.",
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
                }
            }
        ];

        res.render('index', {
            title: 'NAXZORA - Premium Bathroom Fittings & Sanitary Hardware | Rajkot, India',
            currentPage: 'home',
            categories,
            featuredProducts,
            metaDescription: 'NAXZORA offers precision-engineered, luxury bathroom fittings, faucets, showers, pipes, valves and sanitary hardware. Explore our premium collections designed for modern Indian homes.',
            canonicalUrl: BASE_URL + '/',
            ogTitle: 'NAXZORA | Premium Bathroom Fittings & Sanitary Hardware',
            ogDescription: 'Precision Engineering for Modern Living. Explore our luxury collection of bathroom fittings, faucets, showers, and sanitary hardware from Rajkot, India.',
            ogImage: `${BASE_URL}/images/logo.png`,
            ogType: 'website',
            keywords: 'NAXZORA, bathroom fittings, premium faucets, sanitary hardware, luxury bathroom accessories, showers, pipes, valves, bathroom fittings Rajkot, bathroom fittings India, modern bathroom design',
            jsonLd,
        });
    } catch (err) {
        console.error('Home page error:', err);
        res.status(500).send('Server error');
    }
});

// Serve uploaded images from database
router.get('/uploads/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid image ID');
        }
        
        const img = await db.getImage(id);
        if (!img) {
            return res.status(404).send('Image not found');
        }
        
        res.setHeader('Content-Type', img.mime_type);
        // Cache images in client browser for 30 days
        res.setHeader('Cache-Control', 'public, max-age=2592000');
        res.send(img.data);
    } catch (err) {
        console.error('Error serving image from database:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
