const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const catboxService = require('../utils/catbox');

const router = express.Router();

// Configure multer for in-memory file storage (max 200MB for videos)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

/**
 * POST /api/upload/catbox
 * Proxies file upload to Catbox.moe with authentication (userhash).
 * Accepts multipart/form-data with a 'file' field.
 */
router.post('/catbox', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        console.log(`[Upload Proxy] Authenticated upload for ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB) to Catbox...`);

        const url = await catboxService.uploadFile(req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        console.log(`[Upload Proxy] Success: ${url}`);
        return res.json({ success: true, url });
    } catch (err) {
        console.error('[Upload Proxy] Error:', err);
        return res.status(500).json({ error: 'Upload proxy error', details: err.message });
    }
});

module.exports = router;
