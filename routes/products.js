const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Products listing page
router.get('/', async (req, res) => {
    try {
        const categorySlug = req.query.category || null;
        const categories = await db.getCategories();
        const products = await db.getProducts(categorySlug);
        const activeCategory = categorySlug
            ? categories.find(c => c.slug === categorySlug)
            : null;

        res.render('products', {
            title: activeCategory
                ? `${activeCategory.name} - NAXZORA Products`
                : 'All Products - NAXZORA',
            currentPage: 'products',
            categories,
            products,
            activeCategory,
            activeCategorySlug: categorySlug,
        });
    } catch (err) {
        console.error('Products page error:', err);
        res.status(500).send('Server error');
    }
});

// Product detail page
router.get('/:slug', async (req, res) => {
    try {
        const product = await db.getProductBySlug(req.params.slug);
        if (!product) {
            return res.status(404).render('404', {
                title: 'Product Not Found - NAXZORA',
                currentPage: 'products',
            });
        }
        const relatedProducts = await db.getRelatedProducts(product.category_id, product.id);
        res.render('product-detail', {
            title: `${product.name} - NAXZORA`,
            currentPage: 'products',
            product,
            relatedProducts,
        });
    } catch (err) {
        console.error('Product detail error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
