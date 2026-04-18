const express = require('express');
const router = express.Router();

// About page
router.get('/', (req, res) => {
    res.render('about', {
        title: 'About NAXZORA - Our Story & Vision',
        currentPage: 'about',
    });
});

module.exports = router;
