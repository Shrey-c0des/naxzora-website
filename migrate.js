const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    console.log('🚀 Starting NAXZORA Database Migration...');

    const connectionConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true // Essential for running schema.sql
    };

    if (!connectionConfig.host || !connectionConfig.user || !connectionConfig.database) {
        console.error('❌ Error: Missing DB credentials in .env file.');
        console.log('Please ensure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are set.');
        process.exit(1);
    }

    try {
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to Remote Database.');

        // 1. Read Schema
        let schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8');
        
        // Remove "CREATE DATABASE" and "USE" lines as most cloud DBs don't allow them
        schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS.*;/gi, '');
        schemaSql = schemaSql.replace(/USE.*;/gi, '');

        console.log('⌛ Creating tables and seeding initial data...');
        await connection.query(schemaSql);
        console.log('✅ Schema applied successfully.');

        // 2. Sync local data.json (Optional: if the user has added new data locally)
        const dataPath = path.join(__dirname, 'db', 'data.json');
        if (fs.existsSync(dataPath)) {
            console.log('⌛ Syncing local data.json to remote DB...');
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

            // Clear existing data to avoid duplicates from seed
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            await connection.query('TRUNCATE TABLE products');
            await connection.query('TRUNCATE TABLE categories');
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');

            // Insert Categories
            for (const cat of data.categories) {
                await connection.execute(
                    'INSERT INTO categories (id, name, slug, description, image_url) VALUES (?, ?, ?, ?, ?)',
                    [cat.id, cat.name, cat.slug, cat.description, cat.image_url]
                );
            }

            // Insert Products
            for (const prod of data.products) {
                await connection.execute(
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
            console.log('✅ Local data.json synced to remote DB.');
        }

        await connection.end();
        console.log('\n✨ Migration Complete! Your NAXZORA database is ready.\n');

    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    }
}

migrate();
