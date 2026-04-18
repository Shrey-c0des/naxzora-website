const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/connection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Configuration for Admin Panel
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS in production
}));

// Routes
app.use('/', require('./routes/index'));
app.use('/products', require('./routes/products'));
app.use('/contact', require('./routes/contact'));
app.use('/about', require('./routes/about'));
app.use('/admin', require('./routes/admin'));

app.use('/brochure', require('./routes/brochure'));

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Page Not Found - NAXZORA',
        currentPage: ''
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
async function start() {
    await db.testConnection();
    app.listen(PORT, () => {
        console.log(`\n🚀 NAXZORA server running at http://localhost:${PORT}\n`);
    });
}

start();
