import { NextRequest, NextResponse } from 'next/server';

// Use the Node.js runtime (not Edge) so we can stream/buffer large file bodies
// and so `request.formData()` returns a real, readable File.
export const runtime = 'nodejs';

// Catbox allows up to 200MB per request; give the route enough wall-clock
// time to receive + forward that much data on slower connections.
export const maxDuration = 300;

// Next.js route handlers parse request bodies without a strict size limit on
// the Node.js runtime, but be explicit for clarity.
export const dynamic = 'force-dynamic';

const CATBOX_API = 'https://catbox.moe/user/api.php';
const CATBOX_FILES_PREFIX = 'https://files.catbox.moe/';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate size against catbox's 200MB documented limit to avoid
        // wasting bandwidth on a request catbox will reject.
        const MAX_BYTES = 200 * 1024 * 1024;
        if (typeof file.size === 'number' && file.size > MAX_BYTES) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File exceeds Catbox's 200MB limit (received ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
                },
                { status: 413 }
            );
        }

        // --- Root-cause fix ---
        // The File object returned by `request.formData()` is backed by a
        // stream/temp-storage in undici. Re-appending it directly to a new
        // FormData for the outbound fetch can result in an empty or malformed
        // multipart body, which makes Catbox reply with errors like
        // "No file selected" instead of a URL.
        //
        // The reliable approach (used by node-catbox) is to fully read the
        // bytes into an ArrayBuffer, rebuild a fresh Blob with the correct
        // MIME type, and attach it with an explicit filename via the 3-arg
        // form of `formData.append`.
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });

        const uploadFormData = new FormData();
        uploadFormData.append('reqtype', 'fileupload');
        uploadFormData.append('fileToUpload', blob, file.name || 'upload.bin');

        const response = await fetch(CATBOX_API, {
            method: 'POST',
            body: uploadFormData,
            headers: {
                // Catbox's edge rejects requests with an empty User-Agent.
                'User-Agent': 'Laapak-Report-System/1.0 (+https://laapak.com)',
                Accept: 'text/plain, */*',
            },
        });

        const responseText = (await response.text()).trim();

        // Per catbox API docs, success returns the direct file URL
        // (e.g. https://files.catbox.moe/abc123.mp4). Anything else is an
        // error message from the server (returned with HTTP 200 in most cases).
        if (responseText.startsWith(CATBOX_FILES_PREFIX)) {
            return NextResponse.json({ success: true, url: responseText });
        }

        console.error('Catbox API error response:', {
            status: response.status,
            body: responseText,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Catbox rejected the upload',
                details: responseText,
            },
            { status: 502 }
        );
    } catch (error) {
        console.error('Catbox upload error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: 'Upload failed', details: message },
            { status: 500 }
        );
    }
}