<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * List all admin users
     */
    public function listUsers()
    {
        $users = Admin::select('id', 'username', 'name', 'email', 'role', 'last_login', 'created_at')
            ->orderBy('name')
            ->get();
            
        return response()->json($users);
    }
    
    /**
     * Create a new admin user
     */
    public function createUser(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:admins',
            'password' => 'required|string|min:8',
            'name' => 'required|string',
            'email' => 'nullable|email|unique:admins',
            'role' => ['required', Rule::in(['admin', 'technician', 'viewer'])],
        ]);
        
        $admin = Admin::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
        ]);
        
        return response()->json([
            'message' => 'Admin user created successfully',
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ]
        ], 201);
    }
    
    /**
     * Update an admin user
     */
    public function updateUser(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);
        
        $request->validate([
            'username' => ['sometimes', 'string', Rule::unique('admins')->ignore($id)],
            'password' => 'sometimes|string|min:8',
            'name' => 'sometimes|string',
            'email' => ['nullable', 'email', Rule::unique('admins')->ignore($id)],
            'role' => ['sometimes', Rule::in(['admin', 'technician', 'viewer'])],
        ]);
        
        // Update fields if provided
        if ($request->has('username')) {
            $admin->username = $request->username;
        }
        
        if ($request->has('password')) {
            $admin->password = Hash::make($request->password);
        }
        
        if ($request->has('name')) {
            $admin->name = $request->name;
        }
        
        if ($request->has('email')) {
            $admin->email = $request->email;
        }
        
        if ($request->has('role')) {
            $admin->role = $request->role;
        }
        
        $admin->save();
        
        return response()->json([
            'message' => 'Admin user updated successfully',
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ]
        ]);
    }
    
    /**
     * Delete an admin user
     */
    public function deleteUser($id)
    {
        $admin = Admin::findOrFail($id);
        
        // Prevent deleting the last admin user
        $adminCount = Admin::where('role', 'admin')->count();
        if ($admin->role === 'admin' && $adminCount <= 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin user'
            ], 400);
        }
        
        $admin->delete();
        
        return response()->json([
            'message' => 'Admin user deleted successfully'
        ]);
    }
    
    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|different:current_password',
        ]);
        
        $admin = $request->user();
        
        // Check current password
        if (!Hash::check($request->current_password, $admin->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 400);
        }
        
        // Update password
        $admin->password = Hash::make($request->new_password);
        $admin->save();
        
        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }
}
