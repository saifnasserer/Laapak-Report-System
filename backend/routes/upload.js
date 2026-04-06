const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for in-memory file storage (max 200MB for videos)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

/**
 * POST /api/upload/catbox
 * Proxies file upload to Catbox.moe to bypass CORS restrictions.
 * Accepts multipart/form-data with a 'file' field.
 */
router.post('/catbox', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        console.log(`[Upload Proxy] Uploading ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB) to Catbox...`);

        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const text = await response.text();

        if (response.ok && text.trim().startsWith('http')) {
            console.log(`[Upload Proxy] Success: ${text.trim()}`);
            return res.json({ success: true, url: text.trim() });
        } else {
            console.error(`[Upload Proxy] Catbox error: ${text}`);
            return res.status(502).json({ error: 'Catbox upload failed', details: text });
        }
    } catch (err) {
        console.error('[Upload Proxy] Error:', err);
        return res.status(500).json({ error: 'Upload proxy error', details: err.message });
    }
});

module.exports = router;
