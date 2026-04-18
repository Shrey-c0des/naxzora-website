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

// Set up Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
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
        res.render('admin/dashboard', { categories, products });
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
        const slug = slugify(name);
        const imageUrl = req.file ? `/images/uploads/${req.file.filename}` : '';
        
        await db.addCategory(name, slug, description, imageUrl);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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
        // Parse features (assuming newline separated)
        const features = req.body.features ? req.body.features.split('\n').map(f => f.trim()).filter(f => f) : [];
        const slug = slugify(name);
        
        const imageUrls = req.files ? req.files.map(f => `/images/uploads/${f.filename}`) : [];
        const mainImage = imageUrls.length > 0 ? imageUrls[0] : '';
        const gallery = imageUrls.length > 1 ? imageUrls.slice(1) : [];
        
        await db.addProduct(
            category_id, 
            name, 
            slug, 
            description, 
            mainImage, 
            gallery, 
            features, 
            is_featured === 'on'
        );
        
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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

module.exports = router;
