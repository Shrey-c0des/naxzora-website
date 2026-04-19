const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// robots.txt
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nAllow: /\nSitemap: https://naxzora-website.onrender.com/sitemap.xml');
});

// sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
    try {
        const products = await db.getProducts();
        const categories = await db.getCategories();
        const baseUrl = 'https://naxzora-website.onrender.com';
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        
        // Static pages
        const staticPages = ['', '/about', '/products', '/contact'];
        staticPages.forEach(page => {
            xml += `<url><loc>${baseUrl}${page}</loc><priority>0.8</priority></url>`;
        });
        
        // Product pages
        products.forEach(prod => {
            xml += `<url><loc>${baseUrl}/products/${prod.slug}</loc><priority>0.6</priority></url>`;
        });
        
        // Category pages
        categories.forEach(cat => {
            xml += `<url><loc>${baseUrl}/products?category=${cat.slug}</loc><priority>0.7</priority></url>`;
        });
        
        xml += '</urlset>';
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;
