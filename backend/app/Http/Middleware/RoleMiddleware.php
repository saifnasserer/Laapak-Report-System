<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Admin;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if user is an admin
        if (!$request->user() instanceof Admin) {
            return response()->json(['message' => 'Access denied. Admin privileges required.'], 403);
        }

        // Check if admin has the required role
        if (!in_array($request->user()->role, $roles)) {
            return response()->json(['message' => 'Access denied. Insufficient privileges.'], 403);
        }

        return $next($request);
    }
}
