const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Handle brochure request
router.post('/', async (req, res) => {
    try {
        const { name, email, mobile, city } = req.body;
        
        // Basic backend validation
        if (!name || !name.trim() || !email || !email.trim() || !mobile || !mobile.trim()) {
            return res.status(400).send('Name, Email, and Mobile number are required.');
        }

        await db.addBrochureRequest(name.trim(), email.trim(), mobile.trim(), city || '');
        
        // After saving, redirect to the actual PDF file
        res.redirect('/naxzora-brochure.pdf');
    } catch (err) {
        console.error('Error saving brochure request:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
