const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

// Root: redirect to dashboard if logged in, else login
router.get('/', isAuthenticated, (req, res) => res.redirect('/login'));

// Show login page
router.get('/login', isAuthenticated, authController.showLogin);

// Handle login
router.post('/api/login', loginLimiter, authController.login);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
