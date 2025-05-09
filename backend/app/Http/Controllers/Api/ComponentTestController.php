<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ComponentTest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ComponentTestController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'report_id' => 'required|exists:reports,id',
            'component_type' => 'required|string',
            'test_purpose' => 'required|string',
            'test_result' => 'required|string',
            'screenshot_path' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $test = ComponentTest::create($request->all());
        return response()->json(['success' => true, 'data' => $test, 'message' => 'تم إضافة نتيجة الفحص بنجاح'], 201);
    }

    public function destroy($id)
    {
        $test = ComponentTest::findOrFail($id);
        $test->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف نتيجة الفحص']);
    }
}
