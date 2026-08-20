const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { apiLimiter } = require('../middleware/rateLimit');

// view
router.get('/', imageController.showImages);

// api
router.get('/api', apiLimiter, imageController.getImages);
router.get('/api/:id', apiLimiter, imageController.getImage);
router.post('/api/pull', apiLimiter, imageController.pullImage);
router.post('/api/create', apiLimiter, imageController.pullImage);
router.post('/api/build', apiLimiter, imageController.buildImage);
router.post('/api/:id/tag', apiLimiter, imageController.tagImage);
router.delete('/api/:id', apiLimiter, imageController.deleteImage);

module.exports = router;
