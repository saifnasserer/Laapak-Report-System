const FormData = require('form-data');
const axios = require('axios');
const { Readable } = require('stream');

/**
 * CatboxService
 * Encapsulates interactions with the Catbox.moe API.
 * Documentation: https://catbox.moe/tools.php
 */
class CatboxService {
    constructor() {
        this.apiUrl = 'https://catbox.moe/user/api.php';
        this.userhash = process.env.CATBOX_USERHASH;
        
        if (this.userhash) {
            console.log(`[CatboxService] Initialized with userhash (ends with ...${this.userhash.slice(-4)})`);
        } else {
            console.warn('[CatboxService] Warning: CATBOX_USERHASH is not set. Uploads will be anonymous.');
        }
    }

    /**
     * Upload a file to Catbox.moe
     * @param {Buffer|ReadStream} fileContent - The content of the file
     * @param {Object} options - Additional options
     * @param {string} options.filename - Original filename
     * @param {string} options.contentType - Mime type of the file
     * @returns {Promise<string>} - The URL of the uploaded file
     */
    async uploadFile(fileContent, options = {}) {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        
        // Ensure we use the latest userhash from env if possible
        const userhash = this.userhash || process.env.CATBOX_USERHASH;
        if (userhash) {
            form.append('userhash', userhash);
        }

        // Handle Buffers by converting them to Streams to mimic fs.createReadStream behavior
        // Catbox API seems to prefer this or explicit form-data settings for Buffers
        let payload = fileContent;
        if (Buffer.isBuffer(fileContent)) {
            payload = new Readable();
            payload._read = () => {};
            payload.push(fileContent);
            payload.push(null);
        }

        form.append('fileToUpload', payload, {
            filename: options.filename || 'file',
            contentType: options.contentType
        });

        try {
            console.log(`[CatboxService] Sending request to ${this.apiUrl}...`);
            const response = await axios.post(this.apiUrl, form, {
                headers: {
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000 // 120 seconds - videos can be large
            });

            const result = typeof response.data === 'string' ? response.data.trim() : String(response.data).trim();
            if (result.startsWith('http')) {
                return result;
            } else {
                throw new Error(`Catbox API Error: ${result}`);
            }
        } catch (error) {
            const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`[CatboxService] Upload failed:`, errorMsg);
            throw new Error(`Catbox upload failed: ${errorMsg}`);
        }
    }

    /**
     * Delete files from Catbox.moe
     * @param {string[]} filenames - Array of filenames to delete (e.g., ['eh871k.png', 'd9pove.gif'])
     * @returns {Promise<string>} - API response
     */
    async deleteFiles(filenames) {
        if (!this.userhash) {
            throw new Error('Userhash is required for deleting files');
        }

        const form = new FormData();
        form.append('reqtype', 'deletefiles');
        form.append('userhash', this.userhash);
        form.append('files', filenames.join(' '));

        try {
            const response = await axios.post(this.apiUrl, form, {
                headers: { ...form.getHeaders() }
            });
            return response.data;
        } catch (error) {
            const errorMsg = error.response ? error.response.data : error.message;
            throw new Error(`Catbox delete failed: ${errorMsg}`);
        }
    }

    /**
     * Create an album
     * @param {string} title - Album title
     * @param {string} description - Album description
     * @param {string[]} files - Array of filenames already on Catbox
     * @returns {Promise<string>} - The short code or URL of the album
     */
    async createAlbum(title, description, files = []) {
        const form = new FormData();
        form.append('reqtype', 'createalbum');
        if (this.userhash) {
            form.append('userhash', this.userhash);
        }
        form.append('title', title);
        form.append('desc', description);
        form.append('files', files.join(' '));

        try {
            const response = await axios.post(this.apiUrl, form, {
                headers: { ...form.getHeaders() }
            });
            return response.data;
        } catch (error) {
            const errorMsg = error.response ? error.response.data : error.message;
            throw new Error(`Catbox create album failed: ${errorMsg}`);
        }
    }
}

module.exports = new CatboxService();
