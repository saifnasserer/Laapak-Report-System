import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const uploadFormData = new FormData();
        uploadFormData.append('reqtype', 'fileupload');
        uploadFormData.append('fileToUpload', file);

        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: uploadFormData,
        });

        const url = await response.text();

        if (url && url.startsWith('https://files.catbox.moe/')) {
            return NextResponse.json({ success: true, url });
        } else {
            return NextResponse.json({ success: false, error: url }, { status: 500 });
        }
    } catch (error) {
        console.error('Catbox upload error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
