<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    /**
     * Upload a file and return the stored path
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
            'type' => 'required|string|in:test-screenshot,external-inspection',
        ]);

        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $file = $request->file('file');
            $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Determine the storage path based on type
            $path = $request->type === 'test-screenshot' 
                ? 'test-screenshots' 
                : 'external-inspections';
            
            // Store the file
            $filePath = $file->storeAs("public/{$path}", $filename);
            
            // Return the path for storing in database
            return response()->json([
                'success' => true,
                'path' => str_replace('public/', 'storage/', $filePath),
                'message' => 'تم رفع الملف بنجاح'
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'فشل في رفع الملف'
        ], 400);
    }
}
