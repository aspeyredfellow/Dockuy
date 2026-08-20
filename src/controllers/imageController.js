const docker = require('../services/docker');

const showImages = async (req, res) => {
    try {
        const images = await docker.getAllImages();
        res.render('images', {
            title: 'Images | Dockuy',
            images,
            active: 'images'
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.render('images', {
            title: 'Images | Dockuy',
            images: [],
            active: 'images',
            error: 'Failed to load images. Is Docker running?'
        });
    }
};

const getImages = async (req, res) => {
    try {
        const images = await docker.getAllImages();
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getImage = async (req, res) => {
    try {
        const image = await docker.getImage(req.params.id);
        res.json(image);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const pullImage = async (req, res) => {
    try {
        const { image } = req.body;
        if (!image || !image.trim()) {
            return res.status(400).json({ error: 'Image name is required' });
        }
        const result = await docker.pullImage(image.trim());
        res.json({ success: true, message: `Image ${result.image} pulled successfully`, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const tagImage = async (req, res) => {
    try {
        const { repo, tag } = req.body;
        if (!repo || !repo.trim()) {
            return res.status(400).json({ error: 'Repository name is required' });
        }
        const result = await docker.tagImage(req.params.id, repo.trim(), tag?.trim() || 'latest');
        res.json({ success: true, message: `Image tagged as ${result.repo}:${result.tag}`, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const buildImage = async (req, res) => {
    try {
        const { source, name, tag, dockerfile } = req.body;
        if (!source || !source.trim()) {
            return res.status(400).json({ error: 'Source context path is required' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Image name is required' });
        }

        const result = await docker.buildImage({
            contextPath: source.trim(),
            imageName: name.trim(),
            tag: tag?.trim() || 'latest',
            dockerfile: dockerfile?.trim() || 'Dockerfile'
        });

        res.json({
            success: true,
            message: `Image ${result.image} built successfully`,
            ...result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteImage = async (req, res) => {
    try {
        await docker.deleteImage(req.params.id);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    showImages,
    getImages,
    getImage,
    pullImage,
    tagImage,
    buildImage,
    deleteImage
};
