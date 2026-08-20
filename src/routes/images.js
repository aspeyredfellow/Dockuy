const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { apiLimiter } = require('../middleware/rateLimit');

// View
router.get('/', imageController.showImages);

// API
router.get('/api', apiLimiter, imageController.getImages);
router.delete('/api/:id', apiLimiter, imageController.deleteImage);

module.exports = router;
