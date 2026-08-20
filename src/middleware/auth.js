const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const PASSWORD_HASH = config.PASSWORD_HASH;
const JWT_SECRET = config.JWT_SECRET;

// verify password
const verifyPassword = async (password) => {
    if (!password || !PASSWORD_HASH) return false;
    try {
        return await bcrypt.compare(password, PASSWORD_HASH);
    } catch (error) {
        console.error('password verification error:', error);
        return false;
    }
};

// generate jwt token
const generateToken = () => {
    return jwt.sign(
        { authenticated: true, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
    );
};

// authenticate middleware
const authenticate = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.authenticated) {
            return next();
        }
        throw new Error('Invalid token');
    } catch (error) {
        res.clearCookie('token');
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        return res.redirect('/login');
    }
};

// check if already authenticated
const isAuthenticated = (req, res, next) => {
    const token = req.cookies?.token;
    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            // token invalid, continue to login
        }
    }
    next();
};

module.exports = {
    verifyPassword,
    generateToken,
    authenticate,
    isAuthenticated
};
