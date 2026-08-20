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
    deleteImage
};
