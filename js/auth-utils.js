/**
 * Authentication Utilities for Laapak Reports
 * Handles authentication state and user management
 */

class AuthUtils {
    constructor() {
        this.tokenKey = 'auth_token';
        this.userKey = 'auth_user';
        this.userTypeKey = 'auth_user_type'; // 'admin' or 'client'
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get authentication token
     * @returns {string|null} JWT token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    /**
     * Get authenticated user
     * @returns {Object|null} User object
     */
    getUser() {
        const userJson = localStorage.getItem(this.userKey);
        return userJson ? JSON.parse(userJson) : null;
    }

    /**
     * Set authenticated user
     * @param {Object} user - User object
     */
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Get user type (admin or client)
     * @returns {string|null} User type
     */
    getUserType() {
        return localStorage.getItem(this.userTypeKey);
    }

    /**
     * Set user type
     * @param {string} type - User type ('admin' or 'client')
     */
    setUserType(type) {
        if (type !== 'admin' && type !== 'client') {
            throw new Error('Invalid user type. Must be "admin" or "client"');
        }
        localStorage.setItem(this.userTypeKey, type);
    }

    /**
     * Store authentication data
     * @param {Object} data - Authentication data
     * @param {string} userType - User type ('admin' or 'client')
     */
    storeAuthData(data, userType) {
        this.setToken(data.token);
        this.setUser(data.user);
        this.setUserType(userType);
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.userTypeKey);
    }

    /**
     * Check if user is admin
     * @returns {boolean} Admin status
     */
    isAdmin() {
        return this.getUserType() === 'admin';
    }

    /**
     * Check if user is client
     * @returns {boolean} Client status
     */
    isClient() {
        return this.getUserType() === 'client';
    }

    /**
     * Redirect to appropriate dashboard based on user type
     */
    redirectToDashboard() {
        if (this.isAdmin()) {
            window.location.href = '/admin.html';
        } else if (this.isClient()) {
            window.location.href = '/client-dashboard.html';
        }
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = '/index.html';
    }

    /**
     * Check authentication and redirect if not authenticated
     * @param {string} requiredType - Required user type ('admin' or 'client')
     * @returns {boolean} Authentication check result
     */
    checkAuth(requiredType) {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        if (requiredType && this.getUserType() !== requiredType) {
            this.redirectToLogin();
            return false;
        }

        return true;
    }
}

// Create a singleton instance
const authUtils = new AuthUtils();
