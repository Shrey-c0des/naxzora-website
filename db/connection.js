const path = require('path');
const fs = require('fs');

let pool = null;
let useJSON = false;
let jsonData = null;

// Try to set up MySQL connection
// Supports both custom DB_* vars and Railway's auto-injected MYSQL* vars
try {
    const mysql = require('mysql2/promise');
    require('dotenv').config();

    pool = mysql.createPool({
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'naxzora',
        waitForConnections: true,
        connectionLimit: 10,
        multipleStatements: true, // Needed for auto-migration
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

// Auto-migration: check if tables exist, if not run schema + seed
async function runAutoMigration() {
    if (!pool || useJSON) return;

    try {
        // Ensure images table exists
        const [imageTables] = await pool.query("SHOW TABLES LIKE 'images'");
        if (imageTables.length === 0) {
            console.log('⚠️  Images table not found. Creating it...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    mime_type VARCHAR(100) NOT NULL,
                    data LONGBLOB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Images table created successfully.');
        }

        // Check if the 'categories' table exists
        const [tables] = await pool.query(
            "SHOW TABLES LIKE 'categories'"
        );

        if (tables.length > 0) {
            // Tables exist, check if they have data
            const [rows] = await pool.query('SELECT COUNT(*) as count FROM categories');
            if (rows[0].count > 0) {
                console.log('✅ Database tables already populated.');
                return;
            }
            console.log('⚠️  Tables exist but are empty. Seeding data...');
        } else {
            console.log('⚠️  Database tables not found. Running auto-migration...');
        }

        // Read schema.sql
        let schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

        // Remove "CREATE DATABASE" and "USE" lines (Railway manages the database)
        schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS.*;/gi, '');
        schemaSql = schemaSql.replace(/USE.*;/gi, '');

        // Execute schema (creates tables + seeds initial data)
        await pool.query(schemaSql);
        console.log('✅ Schema applied successfully via auto-migration.');

        // Also sync data.json if it has more/different data
        const dataPath = path.join(__dirname, 'data.json');
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

            // Check if JSON has data not in the DB
            const [dbCategories] = await pool.query('SELECT COUNT(*) as count FROM categories');
            const jsonCategories = data.categories ? data.categories.length : 0;

            if (jsonCategories > dbCategories[0].count) {
                console.log('⌛ Syncing additional data from data.json...');

                // Clear and re-seed
                await pool.query('SET FOREIGN_KEY_CHECKS = 0');
                await pool.query('TRUNCATE TABLE products');
                await pool.query('TRUNCATE TABLE categories');
                await pool.query('SET FOREIGN_KEY_CHECKS = 1');

                for (const cat of data.categories) {
                    await pool.execute(
                        'INSERT INTO categories (id, name, slug, description, image_url) VALUES (?, ?, ?, ?, ?)',
                        [cat.id, cat.name, cat.slug, cat.description, cat.image_url]
                    );
                }

                for (const prod of data.products) {
                    await pool.execute(
                        'INSERT INTO products (id, category_id, name, slug, description, image_url, gallery, features, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            prod.id,
                            prod.category_id,
                            prod.name,
                            prod.slug,
                            prod.description,
                            prod.image_url,
                            JSON.stringify(prod.gallery),
                            JSON.stringify(prod.features),
                            prod.is_featured ? 1 : 0
                        ]
                    );
                }
                console.log('✅ data.json synced to remote DB.');
            }
        }

        console.log('✨ Auto-migration complete!');
    } catch (err) {
        console.error('❌ Auto-migration failed:', err.message);
        console.log('⚠️  Falling back to JSON data.');
        useJSON = true;
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
            // Run auto-migration after successful connection
            await runAutoMigration();
            return true;
        } catch (err) {
            console.log('⚠️  MySQL connection failed, switching to JSON fallback');
            console.log('   Error:', err.message);
            useJSON = true;
            return true;
        }
    },

    // Save image to DB or fallback to filesystem
    async saveImage(filename, mimeType, buffer) {
        if (useJSON) {
            // Write to local public/images/uploads folder
            const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const safeFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(filename);
            fs.writeFileSync(path.join(uploadDir, safeFilename), buffer);
            return `/images/uploads/${safeFilename}`;
        }

        try {
            const [result] = await pool.query(
                'INSERT INTO images (filename, mime_type, data) VALUES (?, ?, ?)',
                [filename, mimeType, buffer]
            );
            return `/uploads/${result.insertId}`;
        } catch (err) {
            console.error('Error saving image to database:', err.message);
            // Fallback to disk if DB insert fails
            const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const safeFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(filename);
            fs.writeFileSync(path.join(uploadDir, safeFilename), buffer);
            return `/images/uploads/${safeFilename}`;
        }
    },

    // Get image from DB
    async getImage(id) {
        if (useJSON) return null;
        try {
            const [rows] = await pool.query('SELECT filename, mime_type, data FROM images WHERE id = ?', [id]);
            if (rows.length === 0) return null;
            return rows[0];
        } catch (err) {
            console.error('Error fetching image from database:', err.message);
            return null;
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
    async addProduct(categoryId, name, slug, description, imageUrl, galleryUrls, features, isFeatured = false) {
        if (useJSON) {
            const data = getJSONData();
            const id = data.products.length > 0 ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
            const newProd = {
                id, category_id: parseInt(categoryId), name, slug, description,
                image_url: imageUrl, gallery: galleryUrls, features, is_featured: isFeatured
            };
            data.products.push(newProd);
            saveJSONData();
            return id;
        }

        const [result] = await pool.query(
            'INSERT INTO products (category_id, name, slug, description, image_url, gallery, features, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [categoryId, name, slug, description, imageUrl, JSON.stringify(galleryUrls), JSON.stringify(features), isFeatured]
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
    },

    // Inquiries (Contact Form)
    async addInquiry(name, email, phone, subject, message) {
        if (useJSON) {
            const data = getJSONData();
            const id = data.inquiries.length > 0 ? Math.max(...data.inquiries.map(i => i.id)) + 1 : 1;
            const newInquiry = { id, name, email, phone, subject, message, status: 'New', created_at: new Date() };
            data.inquiries.push(newInquiry);
            saveJSONData();
            return id;
        }
        const [result] = await pool.query(
            'INSERT INTO inquiries (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, subject, message]
        );
        return result.insertId;
    },

    async getInquiries() {
        if (useJSON) {
            return getJSONData().inquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
        return rows;
    },

    // Brochure Requests
    async addBrochureRequest(name, email, mobile, city) {
        if (useJSON) {
            const data = getJSONData();
            const id = data.brochure_requests.length > 0 ? Math.max(...data.brochure_requests.map(b => b.id)) + 1 : 1;
            const newRequest = { id, name, email, mobile, city, created_at: new Date() };
            data.brochure_requests.push(newRequest);
            saveJSONData();
            return id;
        }
        const [result] = await pool.query(
            'INSERT INTO brochure_requests (name, email, mobile, city) VALUES (?, ?, ?, ?)',
            [name, email, mobile, city]
        );
        return result.insertId;
    },

    async getBrochureRequests() {
        if (useJSON) {
            return getJSONData().brochure_requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        const [rows] = await pool.query('SELECT * FROM brochure_requests ORDER BY created_at DESC');
        return rows;
    },

    async deleteInquiry(id) {
        if (useJSON) {
            const data = getJSONData();
            data.inquiries = data.inquiries.filter(i => i.id !== parseInt(id));
            saveJSONData();
            return true;
        }
        await pool.query('DELETE FROM inquiries WHERE id = ?', [id]);
        return true;
    },

    async deleteBrochureRequest(id) {
        if (useJSON) {
            const data = getJSONData();
            data.brochure_requests = data.brochure_requests.filter(b => b.id !== parseInt(id));
            saveJSONData();
            return true;
        }
        await pool.query('DELETE FROM brochure_requests WHERE id = ?', [id]);
        return true;
    }
};

module.exports = db;
