<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DeviceController extends Controller
{
    public function index()
    {
        $devices = Device::orderBy('model')->get();
        return response()->json(['success' => true, 'data' => $devices]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'model' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'serial_number' => 'required|string|max:255|unique:devices,serial_number',
            'processor' => 'nullable|string',
            'ram' => 'nullable|string',
            'storage' => 'nullable|string',
            'gpu' => 'nullable|string',
            'battery' => 'nullable|string',
            'additional_details' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $device = Device::create($request->all());
        return response()->json(['success' => true, 'data' => $device, 'message' => 'تم إضافة الجهاز بنجاح'], 201);
    }

    public function show($id)
    {
        $device = Device::with('reports')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $device]);
    }

    public function update(Request $request, $id)
    {
        $device = Device::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'model' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'serial_number' => 'required|string|max:255|unique:devices,serial_number,' . $id,
            'processor' => 'nullable|string',
            'ram' => 'nullable|string',
            'storage' => 'nullable|string',
            'gpu' => 'nullable|string',
            'battery' => 'nullable|string',
            'additional_details' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $device->update($request->all());
        return response()->json(['success' => true, 'data' => $device, 'message' => 'تم تحديث بيانات الجهاز بنجاح']);
    }

    public function destroy($id)
    {
        $device = Device::findOrFail($id);
        $device->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف الجهاز بنجاح']);
    }
}
