/**
 * Laapak Report System - Settings API Adapter
 * Connects the existing settings.js user management with the backend API
 */

class SettingsApiAdapter {
    constructor() {
        // Initialize with API service
        this.api = apiService;
        this.initialized = false;
        
        // Map backend roles to frontend roles
        this.roleMap = {
            'admin': ROLES.ADMIN,
            'technician': ROLES.TECHNICIAN,
            'viewer': ROLES.VIEWER
        };
    }
    
    // Initialize the adapter
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Check if API is available
            await this.api.healthCheck();
            this.initialized = true;
            console.log('Settings API adapter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize settings API adapter:', error);
            // Fall back to localStorage if API is not available
            this.initialized = false;
        }
    }
    
    // Get users from API or localStorage
    async getUsers() {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            if (this.initialized) {
                // Get users from API
                const admins = await this.api.getAdmins();
                
                // Transform to match the expected format in settings.js
                return admins.map(admin => ({
                    id: admin.id,
                    username: admin.username,
                    fullName: admin.name,
                    email: admin.email || '',
                    role: this.roleMap[admin.role] || ROLES.VIEWER,
                    lastLogin: admin.lastLogin,
                    createdAt: admin.createdAt
                }));
            } else {
                // Fall back to localStorage
                return JSON.parse(localStorage.getItem('lpk_users') || '[]');
            }
        } catch (error) {
            console.error('Error getting users:', error);
            // Fall back to localStorage
            return JSON.parse(localStorage.getItem('lpk_users') || '[]');
        }
    }
    
    // Save user to API
    async saveUser(userData) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            if (this.initialized) {
                // Transform to match API format
                const apiUserData = {
                    username: userData.username,
                    name: userData.fullName,
                    email: userData.email,
                    role: Object.keys(this.roleMap).find(key => this.roleMap[key] === userData.role) || 'viewer'
                };
                
                // Add password for new users
                if (userData.password) {
                    apiUserData.password = userData.password;
                }
                
                if (userData.id) {
                    // Update existing user
                    await this.api.updateAdmin(userData.id, apiUserData);
                } else {
                    // Create new user
                    await this.api.createAdmin(apiUserData);
                }
                
                return true;
            } else {
                // Fall back to localStorage
                const users = JSON.parse(localStorage.getItem('lpk_users') || '[]');
                
                if (userData.id) {
                    // Update existing user
                    const index = users.findIndex(u => u.id === userData.id);
                    if (index !== -1) {
                        users[index] = { ...users[index], ...userData };
                    }
                } else {
                    // Create new user
                    userData.id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
                    users.push(userData);
                }
                
                localStorage.setItem('lpk_users', JSON.stringify(users));
                return true;
            }
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }
    
    // Delete user from API
    async deleteUser(userId) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            if (this.initialized) {
                // Delete user from API
                await this.api.deleteAdmin(userId);
                return true;
            } else {
                // Fall back to localStorage
                const users = JSON.parse(localStorage.getItem('lpk_users') || '[]');
                const filteredUsers = users.filter(u => u.id !== userId);
                localStorage.setItem('lpk_users', JSON.stringify(filteredUsers));
                return true;
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
    
    // Change user password
    async changePassword(userId, currentPassword, newPassword) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            if (this.initialized) {
                // Change password via API
                await this.api.changePassword({
                    userId,
                    currentPassword,
                    newPassword
                });
                return true;
            } else {
                // Fall back to localStorage (simplified for demo)
                const users = JSON.parse(localStorage.getItem('lpk_users') || '[]');
                const userIndex = users.findIndex(u => u.id === userId);
                
                if (userIndex !== -1) {
                    users[userIndex].passwordHash = 'hashed_' + newPassword;
                    localStorage.setItem('lpk_users', JSON.stringify(users));
                    return true;
                }
                
                return false;
            }
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

// Create global instance
const settingsApiAdapter = new SettingsApiAdapter();
