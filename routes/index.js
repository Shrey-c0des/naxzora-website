const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Home page
router.get('/', async (req, res) => {
    try {
        const categories = await db.getCategories();
        const featuredProducts = await db.getFeaturedProducts();
        res.render('index', {
            title: 'NAXZORA - Premium Bathroom Fittings & Sanitary Hardware',
            currentPage: 'home',
            categories,
            featuredProducts,
        });
    } catch (err) {
        console.error('Home page error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
