const express = require('express');
const router = express.Router();

const db = require('../db/connection');

// Contact page
router.get('/', (req, res) => {
    res.render('contact', {
        title: 'Contact Us - NAXZORA',
        currentPage: 'contact',
        success: false,
    });
});

// Handle contact form submission
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, subject } = req.body;
        await db.addInquiry(name, email, phone, subject || 'General Inquiry', message);
        
        res.render('contact', {
            title: 'Contact Us - NAXZORA',
            currentPage: 'contact',
            success: true,
        });
    } catch (err) {
        console.error('Error saving inquiry:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
