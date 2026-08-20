const express = require('express');
const router = express.Router();
const docker = require('../services/docker');

router.get('/info', async (req, res) => {
    try {
        const info = await docker.getSystemInfo();
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
