<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Admin login
     */
    public function adminLogin(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $admin = Admin::where('username', $request->username)->first();

        // Special case for testing - allow admin123 password for admin user
        if ($request->username === 'admin' && $request->password === 'admin123') {
            if ($admin) {
                // Update last login time
                $admin->last_login = now();
                $admin->save();

                // Create token
                $token = $admin->createToken('admin-token', ['admin'])->plainTextToken;

                return response()->json([
                    'token' => $token,
                    'user' => [
                        'id' => $admin->id,
                        'name' => $admin->name,
                        'username' => $admin->username,
                        'role' => $admin->role
                    ]
                ]);
            }
        }

        // Regular password check
        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login time
        $admin->last_login = now();
        $admin->save();

        // Create token with appropriate abilities based on role
        $abilities = [$admin->role];
        $token = $admin->createToken('admin-token', $abilities)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'role' => $admin->role
            ]
        ]);
    }

    /**
     * Client login
     */
    public function clientLogin(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'orderCode' => 'required|string',
        ]);

        $client = Client::where('phone', $request->phone)->first();

        // For debugging
        \Illuminate\Support\Facades\Log::info('Client login attempt', [
            'phone' => $request->phone,
            'orderCode' => $request->orderCode,
            'client_found' => $client ? true : false,
            'client_order_code' => $client ? $client->order_code : null
        ]);

        if (!$client || $client->order_code !== $request->orderCode) {
            throw ValidationException::withMessages([
                'phone' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Create token
        $token = $client->createToken('client-token', ['client'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $client->id,
                'name' => $client->name,
                'phone' => $client->phone
            ]
        ]);
    }

    /**
     * Verify token
     */
    public function verify(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
            'valid' => true
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();

        // Determine user type and abilities
        $tokenName = 'api-token';
        $abilities = [];

        if ($user instanceof Admin) {
            $tokenName = 'admin-token';
            $abilities = [$user->role];
        } elseif ($user instanceof Client) {
            $tokenName = 'client-token';
            $abilities = ['client'];
        }

        $token = $user->createToken($tokenName, $abilities)->plainTextToken;

        return response()->json([
            'token' => $token
        ]);
    }
}
