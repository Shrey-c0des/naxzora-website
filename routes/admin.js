const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/connection');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer for in-memory image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper to create slugs
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// Authentication Middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// Login Page
router.get('/login', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

// Process Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Invalid credentials' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const categories = await db.getCategories();
        const products = await db.getProducts();
        const inquiries = await db.getInquiries();
        const brochureRequests = await db.getBrochureRequests();
        
        res.render('admin/dashboard', { 
            categories, 
            products, 
            inquiries, 
            brochureRequests 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Category Form
router.get('/category/new', isAuthenticated, (req, res) => {
    res.render('admin/add-category');
});

// Process Add Category
router.post('/category/new', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).send('Category name is required.');
        }
        const slug = slugify(name.trim());
        
        let imageUrl = '';
        if (req.file) {
            imageUrl = await db.saveImage(req.file.originalname, req.file.mimetype, req.file.buffer);
        }
        
        await db.addCategory(name.trim(), slug, description || '', imageUrl);
        res.redirect('/admin');
    } catch (err) {
        console.error('Add category error:', err);
        res.status(500).send(`Error adding category: ${err.message}`);
    }
});

// Add Product Form
router.get('/product/new', isAuthenticated, async (req, res) => {
    try {
        const categories = await db.getCategories();
        res.render('admin/add-product', { categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Process Add Product (Handles multiple images)
router.post('/product/new', isAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
        const { category_id, name, description, price, is_featured } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).send('Product name is required.');
        }
        if (!category_id) {
            return res.status(400).send('Please select a category.');
        }
        // Parse features (assuming newline separated)
        const features = req.body.features ? req.body.features.split('\n').map(f => f.trim()).filter(f => f) : [];
        const slug = slugify(name.trim());
        
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const url = await db.saveImage(file.originalname, file.mimetype, file.buffer);
                imageUrls.push(url);
            }
        }
        const mainImage = imageUrls.length > 0 ? imageUrls[0] : '';
        const gallery = imageUrls.length > 1 ? imageUrls.slice(1) : [];
        
        await db.addProduct(
            category_id, 
            name.trim(), 
            slug, 
            description || '', 
            mainImage, 
            gallery, 
            features, 
            is_featured === 'on'
        );
        
        res.redirect('/admin');
    } catch (err) {
        console.error('Add product error:', err);
        res.status(500).send(`Error adding product: ${err.message}`);
    }
});

// Delete Category
router.post('/category/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await db.deleteCategory(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Product
router.post('/product/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await db.deleteProduct(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Inquiry
router.post('/inquiry/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await db.deleteInquiry(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Brochure Request
router.post('/brochure-request/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await db.deleteBrochureRequest(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
