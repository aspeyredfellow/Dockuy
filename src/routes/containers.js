const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const { apiLimiter } = require('../middleware/rateLimit');

// ===== VIEW ROUTES =====
router.get('/', containerController.showContainers);

// ===== API ROUTES =====
router.get('/api', apiLimiter, containerController.getContainers);
router.get('/api/:id', apiLimiter, containerController.getContainer);
router.post('/api/:id/start', apiLimiter, containerController.startContainer);
router.post('/api/:id/stop', apiLimiter, containerController.stopContainer);
router.post('/api/:id/restart', apiLimiter, containerController.restartContainer);
router.delete('/api/:id', apiLimiter, containerController.deleteContainer);
router.post('/api/create', apiLimiter, containerController.createContainer);
router.post('/api/:id/update', apiLimiter, containerController.updateContainer);
router.get('/api/:id/logs', apiLimiter, containerController.getLogs);
router.get('/api/:id/stats', apiLimiter, containerController.getStats);

module.exports = router;
