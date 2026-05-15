const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const BASE_URL = 'https://naxzora-website.onrender.com';

// Products listing page
router.get('/', async (req, res) => {
    try {
        const categorySlug = req.query.category || null;
        const categories = await db.getCategories();
        const products = await db.getProducts(categorySlug);
        const activeCategory = categorySlug
            ? categories.find(c => c.slug === categorySlug)
            : null;

        // Dynamic SEO based on category
        const pageTitle = activeCategory
            ? `${activeCategory.name} - Premium ${activeCategory.name} | NAXZORA`
            : 'All Products - Premium Bathroom Fittings & Hardware | NAXZORA';

        const metaDescription = activeCategory
            ? `Explore NAXZORA's premium ${activeCategory.name.toLowerCase()} collection. ${activeCategory.description} High-quality, durable bathroom fittings made in India.`
            : 'Browse NAXZORA\'s complete collection of premium bathroom fittings — faucets, showers, pipes, valves, accessories, and sanitary ware. Precision-engineered for modern Indian homes.';

        const canonicalUrl = activeCategory
            ? `${BASE_URL}/products?category=${activeCategory.slug}`
            : `${BASE_URL}/products`;

        // JSON-LD: BreadcrumbList + ItemList
        const breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "Products", "item": `${BASE_URL}/products` }
            ]
        };

        if (activeCategory) {
            breadcrumb.itemListElement.push({
                "@type": "ListItem", "position": 3,
                "name": activeCategory.name,
                "item": `${BASE_URL}/products?category=${activeCategory.slug}`
            });
        }

        const itemList = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": activeCategory ? activeCategory.name : "All NAXZORA Products",
            "description": metaDescription,
            "numberOfItems": products.length,
            "itemListElement": products.map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `${BASE_URL}/products/${p.slug}`,
                "name": p.name
            }))
        };

        res.render('products', {
            title: pageTitle,
            currentPage: 'products',
            categories,
            products,
            activeCategory,
            activeCategorySlug: categorySlug,
            metaDescription,
            canonicalUrl,
            ogTitle: activeCategory ? `${activeCategory.name} | NAXZORA Products` : 'All Products | NAXZORA',
            ogDescription: metaDescription,
            ogImage: `${BASE_URL}/images/logo.png`,
            ogType: 'website',
            keywords: activeCategory
                ? `NAXZORA ${activeCategory.name.toLowerCase()}, ${activeCategory.name.toLowerCase()} India, premium ${activeCategory.name.toLowerCase()}, buy ${activeCategory.name.toLowerCase()} online, bathroom fittings`
                : 'NAXZORA products, bathroom fittings, faucets, showers, pipes, valves, bathroom accessories, sanitary ware, premium bathroom hardware India',
            jsonLd: [breadcrumb, itemList],
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
                metaDescription: 'The product you are looking for could not be found. Browse our complete collection of premium bathroom fittings.',
                canonicalUrl: `${BASE_URL}/products`,
                ogTitle: 'Product Not Found | NAXZORA',
                ogDescription: 'Browse our complete collection of premium bathroom fittings.',
                ogImage: `${BASE_URL}/images/logo.png`,
                ogType: 'website',
                keywords: 'NAXZORA, bathroom fittings',
                jsonLd: [],
            });
        }
        const relatedProducts = await db.getRelatedProducts(product.category_id, product.id);

        const productFeatures = Array.isArray(product.features) ? product.features : [];
        const productDescription = product.description || '';

        // JSON-LD: Product + BreadcrumbList
        const breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "Products", "item": `${BASE_URL}/products` },
                { "@type": "ListItem", "position": 3, "name": product.category_name, "item": `${BASE_URL}/products?category=${product.category_slug}` },
                { "@type": "ListItem", "position": 4, "name": product.name, "item": `${BASE_URL}/products/${product.slug}` }
            ]
        };

        const productSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": productDescription,
            "image": product.image_url ? `${BASE_URL}${product.image_url}` : `${BASE_URL}/images/logo.png`,
            "brand": {
                "@type": "Brand",
                "name": "NAXZORA"
            },
            "manufacturer": {
                "@type": "Organization",
                "name": "NAXZORA",
                "@id": `${BASE_URL}/#organization`
            },
            "category": product.category_name,
            "url": `${BASE_URL}/products/${product.slug}`,
            "mainEntityOfPage": `${BASE_URL}/products/${product.slug}`,
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "priceCurrency": "INR",
                "price": "0",
                "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                "url": `${BASE_URL}/products/${product.slug}`,
                "seller": {
                    "@type": "Organization",
                    "name": "NAXZORA"
                }
            }
        };

        if (product.material) {
            productSchema.material = product.material;
        }
        if (product.finish) {
            productSchema.color = product.finish;
        }
        if (product.gallery && product.gallery.length > 0) {
            productSchema.image = product.gallery.map(img => `${BASE_URL}${img}`);
        }
        if (productFeatures.length > 0) {
            productSchema.additionalProperty = productFeatures.map(f => ({
                "@type": "PropertyValue",
                "name": "Feature",
                "value": f
            }));
        }

        const metaDescription = `${product.name} by NAXZORA — ${productDescription.substring(0, 140)}${productDescription.length > 140 ? '...' : ''}. ${product.material ? 'Material: ' + product.material + '.' : ''} ${product.finish ? 'Finish: ' + product.finish + '.' : ''}`;

        res.render('product-detail', {
            title: `${product.name} - ${product.category_name} | NAXZORA`,
            currentPage: 'products',
            product,
            relatedProducts,
            metaDescription: metaDescription.trim(),
            canonicalUrl: `${BASE_URL}/products/${product.slug}`,
            ogTitle: `${product.name} | NAXZORA ${product.category_name}`,
            ogDescription: productDescription.substring(0, 200),
            ogImage: product.image_url ? `${BASE_URL}${product.image_url}` : `${BASE_URL}/images/logo.png`,
            ogType: 'product',
            keywords: `${product.name}, NAXZORA ${product.category_name.toLowerCase()}, ${product.material || ''} ${product.category_name.toLowerCase()}, premium bathroom fittings, ${product.finish || ''} finish, buy ${product.name.toLowerCase()}`,
            jsonLd: [breadcrumb, productSchema],
        });
    } catch (err) {
        console.error('Product detail error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
