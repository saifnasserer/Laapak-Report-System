<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExternalInspection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExternalInspectionController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'report_id' => 'required|exists:reports,id',
            'image_path' => 'required|string',
            'description' => 'nullable|string',
            'position' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $inspection = ExternalInspection::create($request->all());
        return response()->json(['success' => true, 'data' => $inspection, 'message' => 'تم إضافة صورة الفحص الخارجي'], 201);
    }

    public function destroy($id)
    {
        $inspection = ExternalInspection::findOrFail($id);
        $inspection->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف صورة الفحص الخارجي']);
    }
}
