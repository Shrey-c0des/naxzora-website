const path = require('path');
const fs = require('fs');

let pool = null;
let useJSON = false;
let jsonData = null;

// Try to set up MySQL connection
try {
    const mysql = require('mysql2/promise');
    require('dotenv').config();

    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naxzora',
        waitForConnections: true,
        connectionLimit: 10,
    });
} catch (err) {
    console.log('MySQL not available, using JSON fallback');
    useJSON = true;
}

// Load JSON data
function getJSONData() {
    if (!jsonData) {
        jsonData = require(path.join(__dirname, 'data.json'));
    }
    return jsonData;
}

// Save JSON data
function saveJSONData() {
    if (useJSON && jsonData) {
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(jsonData, null, 2), 'utf-8');
    }
}

// Database query functions with JSON fallback
const db = {
    // Test connection
    async testConnection() {
        if (useJSON) {
            console.log('📂 Using JSON data fallback');
            return true;
        }
        try {
            await pool.query('SELECT 1');
            console.log('✅ MySQL connected successfully');
            return true;
        } catch (err) {
            console.log('⚠️  MySQL connection failed, switching to JSON fallback');
            useJSON = true;
            return true;
        }
    },

    // Get all categories
    async getCategories() {
        if (useJSON) {
            return getJSONData().categories;
        }
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
        return rows;
    },

    // Get category by slug
    async getCategoryBySlug(slug) {
        if (useJSON) {
            return getJSONData().categories.find(c => c.slug === slug) || null;
        }
        const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
        return rows[0] || null;
    },

    // Get all products (with optional category filter)
    async getProducts(categorySlug = null) {
        if (useJSON) {
            const data = getJSONData();
            let products = data.products;
            if (categorySlug) {
                const category = data.categories.find(c => c.slug === categorySlug);
                if (category) {
                    products = products.filter(p => p.category_id === category.id);
                }
            }
            // Attach category info
            return products.map(p => {
                const cat = data.categories.find(c => c.id === p.category_id);
                return { ...p, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
            });
        }
        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        const params = [];
        if (categorySlug) {
            query += ' WHERE c.slug = ?';
            params.push(categorySlug);
        }
        query += ' ORDER BY p.is_featured DESC, p.id';
        const [rows] = await pool.query(query, params);
        return rows.map(r => ({
            ...r,
            features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
            gallery: typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery,
        }));
    },

    // Get featured products
    async getFeaturedProducts() {
        if (useJSON) {
            const data = getJSONData();
            return data.products
                .filter(p => p.is_featured)
                .map(p => {
                    const cat = data.categories.find(c => c.id === p.category_id);
                    return { ...p, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
                });
        }
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_featured = TRUE
            ORDER BY p.id
        `);
        return rows.map(r => ({
            ...r,
            features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
            gallery: typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery,
        }));
    },

    // Get single product by slug
    async getProductBySlug(slug) {
        if (useJSON) {
            const data = getJSONData();
            const product = data.products.find(p => p.slug === slug);
            if (!product) return null;
            const cat = data.categories.find(c => c.id === product.category_id);
            return { ...product, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
        }
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ?
        `, [slug]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            ...r,
            features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
            gallery: typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery,
        };
    },

    // Get related products (same category, excluding current)
    async getRelatedProducts(categoryId, excludeId, limit = 4) {
        if (useJSON) {
            const data = getJSONData();
            return data.products
                .filter(p => p.category_id === categoryId && p.id !== excludeId)
                .slice(0, limit)
                .map(p => {
                    const cat = data.categories.find(c => c.id === p.category_id);
                    return { ...p, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
                });
        }
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.id != ?
            LIMIT ?
        `, [categoryId, excludeId, limit]);
        return rows.map(r => ({
            ...r,
            features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
            gallery: typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery,
        }));
    },

    // Add new category
    async addCategory(name, slug, description, imageUrl) {
        if (useJSON) {
            const data = getJSONData();
            const id = data.categories.length > 0 ? Math.max(...data.categories.map(c => c.id)) + 1 : 1;
            const newCat = { id, name, slug, description, image_url: imageUrl };
            data.categories.push(newCat);
            saveJSONData();
            return id;
        }
        
        const [result] = await pool.query(
            'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
            [name, slug, description, imageUrl]
        );
        return result.insertId;
    },

    // Add new product
    async addProduct(categoryId, name, slug, description, price, imageUrl, galleryUrls, features, isFeatured = false) {
        if (useJSON) {
            const data = getJSONData();
            const id = data.products.length > 0 ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
            const newProd = {
                id, category_id: parseInt(categoryId), name, slug, description, price,
                image_url: imageUrl, gallery: galleryUrls, features, is_featured: isFeatured
            };
            data.products.push(newProd);
            saveJSONData();
            return id;
        }

        const [result] = await pool.query(
            'INSERT INTO products (category_id, name, slug, description, price, image_url, gallery, features, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [categoryId, name, slug, description, price, imageUrl, JSON.stringify(galleryUrls), JSON.stringify(features), isFeatured]
        );
        return result.insertId;
    },

    // Delete category
    async deleteCategory(id) {
        if (useJSON) {
            const data = getJSONData();
            // Optional: also delete products in this category? 
            // For now just delete category
            data.categories = data.categories.filter(c => c.id !== parseInt(id));
            saveJSONData();
            return true;
        }

        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        return true;
    },

    // Delete product
    async deleteProduct(id) {
        if (useJSON) {
            const data = getJSONData();
            data.products = data.products.filter(p => p.id !== parseInt(id));
            saveJSONData();
            return true;
        }

        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        return true;
    }
};

module.exports = db;
