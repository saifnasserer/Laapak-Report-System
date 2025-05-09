<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportNoteController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'report_id' => 'required|exists:reports,id',
            'note' => 'required|string',
            'priority' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $note = ReportNote::create($request->all());
        return response()->json(['success' => true, 'data' => $note, 'message' => 'تم إضافة الملاحظة بنجاح'], 201);
    }

    public function destroy($id)
    {
        $note = ReportNote::findOrFail($id);
        $note->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف الملاحظة']);
    }
}
