// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const validLicenseKeys = ['key1', 'key2', 'key3']; // Sample list of valid license keys
const activeSessions = {}; // Dictionary to store active sessions

const SESSION_TIMEOUT = 86400; 

// Middleware
app.use(bodyParser.json());

// Session timeout checker
setInterval(() => {
    const currentTime = Date.now() / 1000;
    for (const [key, value] of Object.entries(activeSessions)) {
        if (currentTime - value.lastActivity > SESSION_TIMEOUT) {
            delete activeSessions[key];
            console.log(`Session for license key ${key} has expired.`);
        }
    }
}, SESSION_TIMEOUT * 1000);

// Routes
app.get('/', (req, res) => {
    res.send('API server is running');
});

app.post('/validate_license', (req, res) => {
    const { license_key } = req.body;

    // Check if the license key is valid
    if (validLicenseKeys.includes(license_key)) {
        // Check if the license key has an active session
        if (activeSessions[license_key]) {
            // Check if the session has expired
            if (Date.now() / 1000 - activeSessions[license_key].lastActivity > SESSION_TIMEOUT) {
                // Session has expired, remove it
                delete activeSessions[license_key];
                console.log(`Session for license key ${license_key} expired.`);
            } else {
                // Session is still active, deny login
                return res.status(403).json({ error: 'User is already logged in from another instance.' });
            }
        }
        // Create a new session
        activeSessions[license_key] = { lastActivity: Date.now() / 1000 };
        console.log(`Session created for license key ${license_key}.`);
        return res.status(200).json({ valid: true });
    } else {
        return res.status(403).json({ valid: false });
    }
});

app.get('/check_session', (req, res) => {
    const { license_key } = req.query;
    if (activeSessions[license_key]) {
        console.log(`Session for license key ${license_key} is active.`);
        return res.status(200).json({ active_session: true });
    } else {
        console.log(`No active session found for license key ${license_key}.`);
        return res.status(200).json({ active_session: false });
    }
});

app.get('/logout', (req, res) => {
    const { license_key } = req.query;
    if (activeSessions[license_key]) {
        delete activeSessions[license_key]; // Clear session
        return res.status(200).json({ message: 'Logged out successfully.' });
    } else {
        console.log(`No active session found for logout request with license key ${license_key}.`);
        return res.status(403).json({ error: 'No active session for this user.' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
