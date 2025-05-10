/**
 * Laapak Report System - User Management Module
 * Handles all user-related functionality including CRUD operations
 */

import { ROLES, sampleUsers } from './settings-constants.js';
import { generateAvatarUrl, formatDate, showToast } from './settings-utils.js';

export class UserManager {
    constructor() {
        this.initializeData();
    }

    // Initialize data in localStorage if not present
    initializeData() {
        if (!localStorage.getItem('lpk_users')) {
            localStorage.setItem('lpk_users', JSON.stringify(sampleUsers));
        }
    }

    // Get users from API or localStorage
    async getUsers() {
        try {
            // Try to get users from API adapter
            if (window.settingsApiAdapter && typeof window.settingsApiAdapter.getUsers === 'function') {
                return await window.settingsApiAdapter.getUsers();
            }
            throw new Error('API adapter not available');
        } catch (error) {
            console.error('Error getting users from API, falling back to localStorage:', error);
            // Fall back to localStorage if API fails
            return JSON.parse(localStorage.getItem('lpk_users') || '[]');
        }
    }

    // Save users to API or localStorage
    async saveUsers(users) {
        try {
            // We don't need to bulk save users with the API adapter
            // Each user is saved individually through the adapter in other methods
            localStorage.setItem('lpk_users', JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            return false;
        }
    }

    // Load users into the users table
    async loadUsers(tableBodyId = 'usersTableBody', totalCountId = 'totalUsersCount') {
        const usersTableBody = document.getElementById(tableBodyId);
        const totalUsersCount = document.getElementById(totalCountId);
        if (!usersTableBody) return;
        
        try {
            // Show loading indicator
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 mb-0">جاري تحميل البيانات...</p>
                    </td>
                </tr>
            `;
            
            // Get users from API or localStorage
            const users = await this.getUsers();
            usersTableBody.innerHTML = '';
            
            // Update total users count
            if (totalUsersCount) {
                totalUsersCount.textContent = users.length;
            }
            
            if (users.length === 0) {
                usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5">
                            <i class="fas fa-users fa-3x mb-3 text-muted"></i>
                            <p class="mb-0">لا يوجد مستخدمين للعرض</p>
                        </td>
                    </tr>
                `;
                return;
            }
        
            // Add user rows
            users.forEach((user, index) => {
                const row = document.createElement('tr');
                
                // Create avatar with initials
                const avatarUrl = user.avatar || generateAvatarUrl(user.fullName);
                
                // Format status badge
                const statusBadgeClass = user.status === 'active' ? 'bg-success' : 'bg-warning text-dark';
                const statusText = user.status === 'active' ? 'نشط' : 'معلق';
                
                // Format role badge
                const roleBadgeClass = user.role === ROLES.ADMIN ? 'bg-primary' : user.role === ROLES.TECHNICIAN ? 'bg-info' : 'bg-secondary';
                const roleText = user.role === ROLES.ADMIN ? 'مدير' : user.role === ROLES.TECHNICIAN ? 'فني' : 'مستخدم';
                
                // Format last login date
                const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : 'لم يسجل دخول بعد';
                
                // Create row content
                row.innerHTML = `
                    <td class="ps-3">${index + 1}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${avatarUrl}" alt="${user.fullName}" class="rounded-circle me-2" width="32" height="32">
                            <div>
                                <div class="fw-bold">${user.fullName}</div>
                                <small class="text-muted">${user.username}</small>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="badge ${roleBadgeClass}">${roleText}</span>
                    </td>
                    <td>
                        <span class="badge ${statusBadgeClass}">${statusText}</span>
                    </td>
                    <td>${lastLogin}</td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light rounded-circle p-1 border-0 shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" style="width: 28px; height: 28px;">
                                <i class="fas fa-ellipsis-v" style="font-size: 12px;"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow" style="border-radius: 10px; border: none;">
                                <li><a class="dropdown-item py-2 edit-user" href="#" data-id="${user.id}"><i class="fas fa-edit me-2 text-warning"></i> تعديل</a></li>
                                <li><a class="dropdown-item py-2 change-password" href="#" data-id="${user.id}"><i class="fas fa-key me-2 text-primary"></i> تغيير كلمة المرور</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item py-2 delete-user" href="#" data-id="${user.id}"><i class="fas fa-trash me-2 text-danger"></i> حذف</a></li>
                            </ul>
                        </div>
                    </td>
                `;
                
                usersTableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading users:', error);
            // Show error message in the table
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                        <p class="mb-0">فشل في تحميل بيانات المستخدمين. يرجى المحاولة مرة أخرى.</p>
                    </td>
                </tr>
            `;
            // Show toast message
            showToast('فشل في تحميل بيانات المستخدمين. يرجى المحاولة مرة أخرى.', 'error');
        }
    }

    // Add a new user
    async addUser(userData) {
        try {
            // Get users array
            const users = await this.getUsers();
            
            // Check if username already exists
            const usernameExists = users.some(user => user.username.toLowerCase() === userData.username.toLowerCase());
            if (usernameExists) {
                throw new Error('اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر');
            }
            
            // Generate new ID
            const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
            const newId = maxId + 1;
            
            // Create new user object
            const newUser = {
                id: newId,
                username: userData.username,
                fullName: userData.fullName,
                email: userData.email,
                passwordHash: 'hashed_' + userData.password, // In a real app, this would be properly hashed
                role: userData.role,
                status: 'active',
                avatar: null,
                lastLogin: null,
                createdAt: new Date().toISOString()
            };
            
            // Try to save via API first
            try {
                if (window.settingsApiAdapter && typeof window.settingsApiAdapter.createUser === 'function') {
                    const savedUser = await window.settingsApiAdapter.createUser(newUser);
                    // Use the returned user from API instead of our local one
                    if (savedUser) {
                        newUser = savedUser;
                    }
                }
            } catch (apiError) {
                console.warn('API save failed, using local storage:', apiError);
                // Fall back to local storage if API fails
            }
            
            // Add to users array
            users.push(newUser);
            
            // Save users
            await this.saveUsers(users);
            
            // Show success message
            showToast('تم إضافة المستخدم بنجاح', 'success');
            
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
            showToast(error.message || 'حدث خطأ أثناء إضافة المستخدم', 'error');
            throw error;
        }
    }

    // Update an existing user
    async updateUser(userId, userData) {
        try {
            // Get users array
            const users = await this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('لم يتم العثور على المستخدم');
            }
            
            // Check if username is already taken by another user
            const usernameExists = users.some(u => u.id !== userId && u.username.toLowerCase() === userData.username.toLowerCase());
            if (usernameExists) {
                throw new Error('اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر');
            }
            
            // Check if this is the last admin user and trying to change role
            if (users[userIndex].role === ROLES.ADMIN && userData.role !== ROLES.ADMIN) {
                const adminCount = users.filter(u => u.role === ROLES.ADMIN).length;
                if (adminCount <= 1) {
                    throw new Error('لا يمكن تغيير دور المدير الوحيد!');
                }
            }
            
            // Create updated user object
            const updatedUser = {
                ...users[userIndex],
                fullName: userData.fullName,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                status: userData.status
            };
            
            // Try to update via API first
            try {
                if (window.settingsApiAdapter && typeof window.settingsApiAdapter.updateUser === 'function') {
                    const savedUser = await window.settingsApiAdapter.updateUser(userId, updatedUser);
                    // Use the returned user from API
                    if (savedUser) {
                        users[userIndex] = savedUser;
                    } else {
                        users[userIndex] = updatedUser;
                    }
                } else {
                    users[userIndex] = updatedUser;
                }
            } catch (apiError) {
                console.warn('API update failed, using local storage:', apiError);
                // Fall back to local storage if API fails
                users[userIndex] = updatedUser;
            }
            
            // Save users
            await this.saveUsers(users);
            
            // Show success message
            showToast('تم تحديث بيانات المستخدم بنجاح', 'success');
            
            return updatedUser;
        } catch (error) {
            console.error('Error updating user:', error);
            showToast(error.message || 'حدث خطأ أثناء تحديث بيانات المستخدم', 'error');
            throw error;
        }
    }

    // Change user password
    async changePassword(userId, newPassword) {
        try {
            // Get users array
            const users = await this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('لم يتم العثور على المستخدم');
            }
            
            // Update password hash
            users[userIndex].passwordHash = 'hashed_' + newPassword; // In a real app, this would be properly hashed
            
            // Try to update via API first
            try {
                if (window.settingsApiAdapter && typeof window.settingsApiAdapter.changePassword === 'function') {
                    await window.settingsApiAdapter.changePassword(userId, newPassword);
                }
            } catch (apiError) {
                console.warn('API password change failed, using local storage:', apiError);
                // Fall back to local storage if API fails
            }
            
            // Save users
            await this.saveUsers(users);
            
            // Show success message
            showToast('تم تغيير كلمة المرور بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            showToast(error.message || 'حدث خطأ أثناء تغيير كلمة المرور', 'error');
            throw error;
        }
    }

    // Delete a user
    async deleteUser(userId) {
        try {
            // Get users array
            const users = await this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('لم يتم العثور على المستخدم');
            }
            
            // Check if this is the last admin user
            const user = users[userIndex];
            if (user.role === ROLES.ADMIN && users.filter(u => u.role === ROLES.ADMIN).length <= 1) {
                throw new Error('لا يمكن حذف المدير الوحيد!');
            }
            
            // Try to delete via API first
            try {
                if (window.settingsApiAdapter && typeof window.settingsApiAdapter.deleteUser === 'function') {
                    await window.settingsApiAdapter.deleteUser(userId);
                }
            } catch (apiError) {
                console.warn('API delete failed, using local storage:', apiError);
                // Fall back to local storage if API fails
            }
            
            // Remove user from array
            users.splice(userIndex, 1);
            
            // Save users
            await this.saveUsers(users);
            
            // Show success message
            showToast('تم حذف المستخدم بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast(error.message || 'حدث خطأ أثناء حذف المستخدم', 'error');
            throw error;
        }
    }

    // Get a user by ID
    async getUserById(userId) {
        try {
            const users = await this.getUsers();
            return users.find(u => u.id === userId) || null;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }
}
