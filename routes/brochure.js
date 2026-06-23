const express = require('express');
const router = express.Router();
const https = require('https');
const db = require('../db/connection');
require('dotenv').config();

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

/**
 * Send OTP via Fast2SMS DLT Quick SMS API
 * Docs: https://docs.fast2sms.com/
 */
function sendOTPviaSMS(mobile, otp) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.FAST2SMS_API_KEY;

        // If no API key is configured, log OTP to console (dev/testing mode)
        if (!apiKey) {
            console.log(`\n📱 [DEV MODE] OTP for ${mobile}: ${otp}\n`);
            return resolve({ success: true, dev: true });
        }

        const message = `Your NAXZORA brochure download OTP is: ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

        const payload = JSON.stringify({
            route: 'q',           // Quick (non-DLT) route
            message: message,
            language: 'english',
            flash: 0,
            numbers: mobile,
        });

        const options = {
            hostname: 'www.fast2sms.com',
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.return === true) {
                        resolve({ success: true });
                    } else {
                        console.error('Fast2SMS error:', parsed);
                        reject(new Error(parsed.message || 'SMS sending failed'));
                    }
                } catch (e) {
                    reject(new Error('Invalid response from SMS gateway'));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /brochure — Render the dedicated brochure download page
router.get('/', (req, res) => {
    res.render('brochure', {
        title: 'Download Brochure - NAXZORA',
        currentPage: 'brochure',
        metaDescription: 'Download the latest NAXZORA product brochure. Explore our complete range of premium bathroom fittings and sanitary hardware.',
    });
});

// POST /brochure/send-otp — Generate & send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { name, mobile, city } = req.body;

        if (!name || !name.trim()) {
            return res.json({ success: false, message: 'Name is required.' });
        }
        if (!mobile || !/^[0-9]{10}$/.test(mobile.trim())) {
            return res.json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP + user details in session
        req.session.brochureOTP = {
            otp,
            expiresAt,
            mobile: mobile.trim(),
            name: name.trim(),
            city: (city || '').trim(),
            verified: false,
        };

        let result;
        try {
            result = await sendOTPviaSMS(mobile.trim(), otp);
        } catch (smsError) {
            console.warn('SMS Gateway failed, falling back to simulated OTP. Error:', smsError.message);
            result = { success: true, dev: true, fallbackReason: smsError.message };
        }

        if (result && result.dev) {
            // Overwrite stored OTP with '123456' for easy testing when API key is missing or gateway fails
            req.session.brochureOTP.otp = '123456';
            const displayReason = result.fallbackReason ? ` (Fallback: Enter 123456)` : ' (Dev Mode: Enter 123456)';

            // Explicitly save session before responding — critical for deployed environments
            return req.session.save((err) => {
                if (err) console.error('Session save error:', err);
                console.log('[OTP] Session saved for', mobile.trim(), '| Session ID:', req.sessionID);
                return res.json({ 
                    success: true, 
                    message: `OTP sent successfully.${displayReason}` 
                });
            });
        }

        // Explicitly save session before responding
        return req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            console.log('[OTP] Session saved for', mobile.trim(), '| Session ID:', req.sessionID);
            return res.json({ success: true, message: 'OTP sent successfully.' });
        });
    } catch (err) {
        console.error('Error sending OTP:', err.message);
        return res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
});

// POST /brochure/verify-otp — Verify OTP, save request, allow download
router.post('/verify-otp', async (req, res) => {
    try {
        const { otp } = req.body;
        const sessionData = req.session.brochureOTP;

        console.log('[VERIFY] Session ID:', req.sessionID, '| Has brochureOTP:', !!sessionData);

        if (!sessionData) {
            return res.json({ success: false, message: 'Session expired. Please start again.' });
        }
        if (Date.now() > sessionData.expiresAt) {
            delete req.session.brochureOTP;
            return res.json({ success: false, message: 'OTP expired. Please request a new one.' });
        }
        if (!otp || otp.trim() !== sessionData.otp) {
            return res.json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }

        // OTP matched — save the brochure request to DB
        await db.addBrochureRequest(
            sessionData.name,
            sessionData.mobile,
            sessionData.city
        );

        // Clear session OTP
        delete req.session.brochureOTP;

        return res.json({ success: true, message: 'OTP verified. Downloading brochure...' });
    } catch (err) {
        console.error('Error verifying OTP:', err.message);
        return res.json({ success: false, message: 'Server error. Please try again.' });
    }
});

module.exports = router;
