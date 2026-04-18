const express = require('express');
const router = express.Router();

// Contact page
router.get('/', (req, res) => {
    res.render('contact', {
        title: 'Contact Us - NAXZORA',
        currentPage: 'contact',
        success: false,
    });
});

// Handle contact form submission
router.post('/', (req, res) => {
    const { name, email, phone, message } = req.body;
    // For now, just log and show success
    console.log('📧 Contact form submission:', { name, email, phone, message });
    res.render('contact', {
        title: 'Contact Us - NAXZORA',
        currentPage: 'contact',
        success: true,
    });
});

module.exports = router;
