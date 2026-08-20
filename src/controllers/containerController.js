const docker = require('../services/docker');

// views
const showContainers = async (req, res) => {
    try {
        const containers = await docker.getAllContainers();
        res.render('containers', {
            title: 'Containers | Dockuy',
            containers,
            active: 'containers'
        });
    } catch (error) {
        console.error('error fetching containers:', error);
        res.render('containers', {
            title: 'Containers | Dockuy',
            containers: [],
            active: 'containers',
            error: 'Failed to load containers. Is Docker running?'
        });
    }
};

// api
const getContainers = async (req, res) => {
    try {
        const containers = await docker.getAllContainers();
        res.json(containers);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getContainer = async (req, res) => {
    try {
        const container = await docker.getContainer(req.params.id);
        res.json(container);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const startContainer = async (req, res) => {
    try {
        await docker.startContainer(req.params.id);
        res.json({ success: true, message: 'Container started' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const stopContainer = async (req, res) => {
    try {
        await docker.stopContainer(req.params.id);
        res.json({ success: true, message: 'Container stopped' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const restartContainer = async (req, res) => {
    try {
        await docker.restartContainer(req.params.id);
        res.json({ success: true, message: 'Container restarted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteContainer = async (req, res) => {
    try {
        await docker.deleteContainer(req.params.id);
        res.json({ success: true, message: 'Container deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getLogs = async (req, res) => {
    try {
        const tail = parseInt(req.query.tail) || 100;
        const logs = await docker.getLogs(req.params.id, tail);
        res.json({ logs });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getStats = async (req, res) => {
    try {
        const stats = await docker.getStats(req.params.id);
        res.json(stats);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createContainer = async (req, res) => {
    try {
        const { name, image, ports, env, volumes, restartPolicy, memoryLimit, autoStart } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image name is required' });
        }
        const result = await docker.createContainer({
            name: name?.trim(),
            image: image.trim(),
            ports,
            env,
            volumes,
            restartPolicy,
            memoryLimit,
            autoStart: autoStart !== false
        });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateContainer = async (req, res) => {
    try {
        const { name, image, ports, env, volumes, restartPolicy, memoryLimit, autoStart } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image name is required' });
        }
        const result = await docker.updateContainer(req.params.id, {
            name: name?.trim(),
            image: image.trim(),
            ports,
            env,
            volumes,
            restartPolicy,
            memoryLimit,
            autoStart: autoStart !== false
        });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    showContainers,
    getContainers,
    getContainer,
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    createContainer,
    updateContainer,
    getLogs,
    getStats
};
