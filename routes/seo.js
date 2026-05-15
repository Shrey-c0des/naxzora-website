const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const BASE_URL = 'https://naxzora-website.onrender.com';

// Escape special XML characters
function escXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// robots.txt
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin

Sitemap: ${BASE_URL}/sitemap.xml

# NAXZORA - Premium Bathroom Fittings & Sanitary Hardware
# Website: ${BASE_URL}
`);
});

// sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
    try {
        const products = await db.getProducts();
        const categories = await db.getCategories();
        const today = new Date().toISOString().split('T')[0];
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
        xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
        
        // Homepage
        xml += `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${BASE_URL}/images/logo.png</image:loc>
      <image:title>NAXZORA - Premium Bathroom Fittings Logo</image:title>
    </image:image>
  </url>\n`;
        
        // About page
        xml += `  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${BASE_URL}/images/product_showcase.png</image:loc>
      <image:title>NAXZORA Premium Product Showcase</image:title>
    </image:image>
  </url>\n`;
        
        // Products listing page
        xml += `  <url>
    <loc>${BASE_URL}/products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
        
        // Contact page
        xml += `  <url>
    <loc>${BASE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        
        // Category pages
        categories.forEach(cat => {
            xml += `  <url>
    <loc>${BASE_URL}/products?category=${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
            if (cat.image_url) {
                xml += `
    <image:image>
      <image:loc>${BASE_URL}${cat.image_url}</image:loc>
      <image:title>${escXml(cat.name)} - NAXZORA</image:title>
      <image:caption>${escXml(cat.description || cat.name)}</image:caption>
    </image:image>`;
            }
            xml += `\n  </url>\n`;
        });
        
        // Product pages
        products.forEach(prod => {
            xml += `  <url>
    <loc>${BASE_URL}/products/${prod.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>`;
            if (prod.image_url) {
                xml += `
    <image:image>
      <image:loc>${BASE_URL}${prod.image_url}</image:loc>
      <image:title>${escXml(prod.name)} - NAXZORA</image:title>
      <image:caption>${escXml(prod.name)} - Premium ${escXml(prod.category_name || 'bathroom fitting')} by NAXZORA</image:caption>
    </image:image>`;
            }
            // Add gallery images
            const gallery = Array.isArray(prod.gallery) ? prod.gallery : [];
            gallery.forEach((imgUrl, idx) => {
                if (imgUrl && imgUrl !== prod.image_url) {
                    xml += `
    <image:image>
      <image:loc>${BASE_URL}${imgUrl}</image:loc>
      <image:title>${escXml(prod.name)} - Image ${idx + 2}</image:title>
    </image:image>`;
                }
            });
            xml += `\n  </url>\n`;
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
