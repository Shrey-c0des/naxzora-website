-- NAXZORA Database Schema
-- Run this file to set up the MySQL database

CREATE DATABASE IF NOT EXISTS naxzora;
USE naxzora;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category_id INT,
    description TEXT,
    features TEXT,
    material VARCHAR(100),
    finish VARCHAR(100),
    image_url VARCHAR(255),
    gallery TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Seed Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Faucets & Taps', 'faucets-taps', 'Premium faucets and taps engineered for durability and elegance. Available in multiple finishes.', '/images/categories/faucets.jpg'),
('Showers & Bath Fittings', 'showers-bath', 'Luxury shower systems and bath fittings for the ultimate bathing experience.', '/images/categories/showers.jpg'),
('Pipes & Connectors', 'pipes-connectors', 'Industrial-grade pipes and connectors built to last. CPVC, PPR, and composite options.', '/images/categories/pipes.jpg'),
('Valves & Cocks', 'valves-cocks', 'Precision-engineered valves and cocks for reliable water flow control.', '/images/categories/valves.jpg'),
('Bathroom Accessories', 'bathroom-accessories', 'Complete your bathroom with our range of towel bars, soap dispensers, and more.', '/images/categories/accessories.jpg'),
('Sanitary Ware', 'sanitary-ware', 'Designer wash basins, water closets, and sanitary fixtures for modern bathrooms.', '/images/categories/sanitary.jpg');

-- Seed Products
INSERT INTO products (name, slug, category_id, description, features, material, finish, image_url, gallery, is_featured) VALUES
-- Faucets & Taps
('Zenith Single Lever Basin Mixer', 'zenith-basin-mixer', 1, 'The Zenith Basin Mixer combines contemporary design with NAXZORA engineering. Its sleek single-lever operation provides effortless temperature and flow control, while the ceramic disc cartridge ensures drip-free performance for years.', '["Ceramic disc cartridge","Single lever operation","Aerator for water saving","Quarter turn mechanism","Hot & cold water mixing"]', 'Brass', 'Chrome', '/images/products/zenith-basin-mixer.jpg', '["/images/products/zenith-basin-mixer.jpg","/images/products/zenith-basin-mixer-2.jpg"]', TRUE),

('Aura Wall Mounted Tap', 'aura-wall-tap', 1, 'The Aura wall-mounted tap brings minimalist sophistication to your kitchen or bathroom. Designed for wall installation with concealed pipework for a clean, modern look.', '["Wall mounted design","15mm cartridge","Concealed installation","Durable brass body","Easy maintenance"]', 'Brass', 'Matte Black', '/images/products/aura-wall-tap.jpg', '["/images/products/aura-wall-tap.jpg"]', FALSE),

('Nova Pillar Cock', 'nova-pillar-cock', 1, 'A timeless pillar cock design with precision engineering. The Nova delivers consistent water flow with a smooth quarter-turn operation.', '["Quarter turn ceramic disc","Pillar mount design","Foam flow aerator","Heavy duty brass body","Anti-rust coating"]', 'Brass', 'Chrome', '/images/products/nova-pillar-cock.jpg', '["/images/products/nova-pillar-cock.jpg"]', FALSE),

-- Showers & Bath Fittings
('Cascade Overhead Rain Shower', 'cascade-rain-shower', 2, 'Experience rainfall in your bathroom. The Cascade 200mm overhead shower delivers a luxurious, even water distribution that transforms your daily routine into a spa experience.', '["200mm ultra-slim design","Air-infusion technology","Self-cleaning nozzles","360° swivel joint","Anti-limescale coating"]', 'Stainless Steel', 'Chrome', '/images/products/cascade-rain-shower.jpg', '["/images/products/cascade-rain-shower.jpg"]', TRUE),

('Torrent Hand Shower Set', 'torrent-hand-shower', 2, 'The Torrent hand shower set includes a multi-function shower head, flexible hose, and wall bracket. Three spray patterns let you customize your shower experience.', '["3 spray patterns","1.5m flexible hose","Wall bracket included","Easy-click spray change","Water saving mode"]', 'ABS Plastic + Chrome', 'Chrome', '/images/products/torrent-hand-shower.jpg', '["/images/products/torrent-hand-shower.jpg"]', FALSE),

-- Pipes & Connectors
('NAXZORA CPVC Pipe - 1 inch', 'cpvc-pipe-1inch', 3, 'Industrial-grade CPVC pipes designed for hot and cold water supply systems. Meets IS 15778 standards with superior chemical resistance and long service life.', '["IS 15778 certified","Temperature range: 0-93°C","Pressure rating: 10 kg/cm²","Corrosion resistant","25-year warranty"]', 'CPVC', 'Off-White', '/images/products/cpvc-pipe.jpg', '["/images/products/cpvc-pipe.jpg"]', TRUE),

('PPR Composite Pipe - 3/4 inch', 'ppr-pipe-34inch', 3, 'Premium PPR pipes with fiberglass composite layer for reduced thermal expansion. Ideal for hot water lines and central heating systems.', '["Fiberglass reinforced","Low thermal expansion","FDA grade material","Smooth inner bore","Weld-joint system"]', 'PPR + Fiberglass', 'Green', '/images/products/ppr-pipe.jpg', '["/images/products/ppr-pipe.jpg"]', FALSE),

-- Valves & Cocks
('ProFlow Concealed Stop Valve', 'proflow-stop-valve', 4, 'The ProFlow concealed stop valve offers precise flow control with a sleek flush-mount design. Quarter-turn ceramic disc mechanism ensures smooth operation.', '["Concealed flush-mount design","Quarter turn ceramic disc","15mm / 20mm options","Heavy brass forging","Decorative flange included"]', 'Brass', 'Chrome', '/images/products/proflow-stop-valve.jpg', '["/images/products/proflow-stop-valve.jpg"]', TRUE),

('Angular Stop Cock - Premium', 'angular-stop-cock', 4, 'Premium angular stop cock with wall flange. Designed for under-basin installation with a compact footprint and reliable shut-off.', '["Angular design","Wall flange included","Ceramic disc cartridge","Compact form factor","Chrome plated finish"]', 'Brass', 'Chrome', '/images/products/angular-stop-cock.jpg', '["/images/products/angular-stop-cock.jpg"]', FALSE),

-- Bathroom Accessories
('Elite Towel Bar - 24 inch', 'elite-towel-bar', 5, 'The Elite towel bar combines structural strength with refined design. Concealed mounting hardware creates a floating effect that complements any bathroom decor.', '["24 inch length","Concealed mounting","Heavy gauge construction","Anti-fingerprint coating","Rust-proof guarantee"]', 'Stainless Steel 304', 'Brushed Nickel', '/images/products/elite-towel-bar.jpg', '["/images/products/elite-towel-bar.jpg"]', FALSE),

('Luxe Soap Dispenser', 'luxe-soap-dispenser', 5, 'Wall-mounted liquid soap dispenser with a premium glass reservoir and pump mechanism. Adds a touch of luxury to any washbasin area.', '["500ml capacity","Glass reservoir","Pump mechanism","Wall mounted","Easy refill design"]', 'Glass + Stainless Steel', 'Chrome', '/images/products/luxe-soap-dispenser.jpg', '["/images/products/luxe-soap-dispenser.jpg"]', TRUE),

-- Sanitary Ware
('Horizon Wall Hung Basin', 'horizon-wall-basin', 6, 'The Horizon wall-hung basin is a statement piece in modern bathroom design. Its clean lines and generous bowl create a perfect balance between form and function.', '["Wall hung installation","Overflow protection","Pre-drilled tap hole","Vitreous china body","Scratch resistant glaze"]', 'Ceramic', 'White', '/images/products/horizon-wall-basin.jpg', '["/images/products/horizon-wall-basin.jpg"]', TRUE),

('Summit One-Piece WC', 'summit-one-piece-wc', 6, 'The Summit one-piece water closet features a rimless flushing system for superior hygiene. Dual-flush mechanism saves water without compromising performance.', '["Rimless flush technology","Dual flush 3L/6L","Soft close seat","S-trap / P-trap options","Easy clean glaze"]', 'Ceramic', 'White', '/images/products/summit-wc.jpg', '["/images/products/summit-wc.jpg"]', FALSE);
