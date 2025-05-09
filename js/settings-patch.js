/**
 * Laapak Report System - Settings API Integration Patch
 * This file contains the necessary methods to integrate the settings.js with the backend API
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check if settingsManager exists
    if (typeof settingsManager === 'undefined') {
        console.error('Settings manager not found');
        return;
    }

    // Patch the getUsers method to use API
    const originalGetUsers = settingsManager.getUsers;
    settingsManager.getUsers = async function() {
        try {
            // Try to get users from API adapter
            return await settingsApiAdapter.getUsers();
        } catch (error) {
            console.error('Error getting users from API, falling back to localStorage:', error);
            // Fall back to original method if API fails
            return originalGetUsers.call(this);
        }
    };

    // Patch the saveUser method to use API
    const originalSaveUser = settingsManager.saveUser;
    settingsManager.saveUser = async function(userData) {
        try {
            // Try to save user via API adapter
            return await settingsApiAdapter.saveUser(userData);
        } catch (error) {
            console.error('Error saving user to API, falling back to localStorage:', error);
            // Fall back to original method if API fails
            return originalSaveUser.call(this, userData);
        }
    };

    // Patch the deleteUser method to use API
    const originalDeleteUser = settingsManager.deleteUser;
    settingsManager.deleteUser = async function(userId) {
        try {
            // Try to delete user via API adapter
            return await settingsApiAdapter.deleteUser(userId);
        } catch (error) {
            console.error('Error deleting user from API, falling back to localStorage:', error);
            // Fall back to original method if API fails
            return originalDeleteUser.call(this, userId);
        }
    };

    // Patch the loadUsers method to handle async operations
    const originalLoadUsers = settingsManager.loadUsers;
    settingsManager.loadUsers = async function() {
        try {
            // Get users from API or localStorage
            const users = await this.getUsers();
            
            // Continue with the original implementation but with our users
            const usersTableBody = document.getElementById('usersTableBody');
            if (!usersTableBody) return;
            
            usersTableBody.innerHTML = '';
            
            // Add user rows
            users.forEach(user => {
                const row = document.createElement('tr');
                
                // Create avatar with initials
                const avatarUrl = user.avatar || generateAvatarUrl(user.fullName);
                
                // Format status badge
                const statusBadgeClass = user.status === 'active' ? 'bg-success' : 'bg-warning text-dark';
                const statusText = user.status === 'active' ? 'نشط' : 'معلق';
                
                // Format role badge
                const roleBadgeClass = user.role === ROLES.ADMIN ? 'bg-primary' : user.role === ROLES.TECHNICIAN ? 'bg-info' : 'bg-secondary';
                const roleText = user.role === ROLES.ADMIN ? 'مدير' : user.role === ROLES.TECHNICIAN ? 'فني' : 'مستخدم';
                
                // Create row content
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle me-3" style="background-image: url('${avatarUrl}'); width: 40px; height: 40px;"></div>
                            <div>
                                <div class="fw-bold">${user.fullName}</div>
                                <div class="small text-muted">${user.username}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td><span class="badge ${roleBadgeClass}">${roleText}</span></td>
                    <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light rounded-circle p-1 border-0 shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" style="width: 28px; height: 28px;">
                                <i class="fas fa-ellipsis-v" style="font-size: 12px;"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow" style="border-radius: 10px; border: none;">
                                <li><a class="dropdown-item py-2" href="#" onclick="settingsManager.editUser(${user.id}); return false;"><i class="fas fa-edit me-2 text-warning"></i> تعديل</a></li>
                                <li><a class="dropdown-item py-2" href="#" onclick="settingsManager.changePassword(${user.id}); return false;"><i class="fas fa-key me-2 text-primary"></i> تغيير كلمة المرور</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <a class="dropdown-item py-2 ${user.role === ROLES.ADMIN && users.filter(u => u.role === ROLES.ADMIN).length <= 1 ? 'disabled' : ''}" 
                                       href="#" onclick="${user.role === ROLES.ADMIN && users.filter(u => u.role === ROLES.ADMIN).length <= 1 ? 'alert(\'لا يمكن حذف المدير الوحيد\')' : `settingsManager.deleteUser(${user.id})`}; return false;">
                                        <i class="fas fa-trash me-2 text-danger"></i> حذف
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </td>
                `;
                
                usersTableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.edit-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const userId = parseInt(btn.getAttribute('data-id'));
                    this.editUser(userId);
                });
            });
            
            document.querySelectorAll('.change-password').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const userId = parseInt(btn.getAttribute('data-id'));
                    this.changePassword(userId);
                });
            });
            
            document.querySelectorAll('.delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const userId = parseInt(btn.getAttribute('data-id'));
                    this.deleteUser(userId);
                });
            });
        } catch (error) {
            console.error('Error loading users:', error);
            // Fall back to original method if API fails
            return originalLoadUsers.call(this);
        }
    };

    // Patch the saveNewUser method to handle async operations
    const originalSaveNewUser = settingsManager.saveNewUser;
    settingsManager.saveNewUser = async function() {
        try {
            // Get form values
            const fullName = document.getElementById('userFullName').value;
            const username = document.getElementById('userUsername').value;
            const email = document.getElementById('userEmail').value;
            const password = document.getElementById('userPassword').value;
            const role = document.getElementById('userRole').value;
            
            // Validate form
            if (!fullName || !username || !password || !role) {
                alert('يرجى ملء جميع الحقول المطلوبة');
                return;
            }
            
            // Create user object
            const userData = {
                fullName,
                username,
                email,
                password,
                role,
                status: 'active',
                lastLogin: null,
                createdAt: new Date().toISOString()
            };
            
            // Save user via API adapter
            await settingsApiAdapter.saveUser(userData);
            
            // Close modal and reload users
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            
            // Show success message
            this.showToast('تم إضافة المستخدم بنجاح');
            
            // Reload users
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving new user:', error);
            alert('حدث خطأ أثناء إضافة المستخدم. يرجى المحاولة مرة أخرى.');
        }
    };

    // Patch the updateUser method to handle async operations
    const originalUpdateUser = settingsManager.updateUser;
    settingsManager.updateUser = async function() {
        try {
            // Get form values
            const userId = parseInt(document.getElementById('editUserId').value);
            const fullName = document.getElementById('editUserFullName').value;
            const username = document.getElementById('editUserUsername').value;
            const email = document.getElementById('editUserEmail').value;
            const role = document.getElementById('editUserRole').value;
            const status = document.getElementById('editUserStatus').value;
            
            // Validate form
            if (!fullName || !username || !role) {
                alert('يرجى ملء جميع الحقول المطلوبة');
                return;
            }
            
            // Create user object
            const userData = {
                id: userId,
                fullName,
                username,
                email,
                role,
                status
            };
            
            // Update user via API adapter
            await settingsApiAdapter.saveUser(userData);
            
            // Close modal and reload users
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            // Show success message
            this.showToast('تم تحديث المستخدم بنجاح');
            
            // Reload users
            await this.loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('حدث خطأ أثناء تحديث المستخدم. يرجى المحاولة مرة أخرى.');
        }
    };

    // Patch the changePassword method to handle async operations
    const originalChangePassword = settingsManager.changePassword;
    settingsManager.changePassword = async function(userId) {
        try {
            const users = await this.getUsers();
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                console.error('User not found:', userId);
                return;
            }
            
            // Create modal if it doesn't exist
            if (!document.getElementById('changePasswordModal')) {
                const modalHTML = `
                <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">تغيير كلمة المرور</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="changePasswordForm">
                                    <input type="hidden" id="passwordUserId">
                                    <div class="mb-3">
                                        <label for="currentPassword" class="form-label">كلمة المرور الحالية</label>
                                        <input type="password" class="form-control" id="currentPassword" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="newPassword" class="form-label">كلمة المرور الجديدة</label>
                                        <input type="password" class="form-control" id="newPassword" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirmPassword" class="form-label">تأكيد كلمة المرور</label>
                                        <input type="password" class="form-control" id="confirmPassword" required>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                                <button type="button" class="btn btn-primary" id="savePasswordBtn">حفظ</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                
                // Add event listener to save button
                document.getElementById('savePasswordBtn').addEventListener('click', async () => {
                    const userId = parseInt(document.getElementById('passwordUserId').value);
                    const currentPassword = document.getElementById('currentPassword').value;
                    const newPassword = document.getElementById('newPassword').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    
                    if (!currentPassword || !newPassword || !confirmPassword) {
                        alert('يرجى ملء جميع الحقول');
                        return;
                    }
                    
                    if (newPassword !== confirmPassword) {
                        alert('كلمة المرور الجديدة وتأكيدها غير متطابقين');
                        return;
                    }
                    
                    try {
                        // Change password via API adapter
                        await settingsApiAdapter.changePassword(userId, currentPassword, newPassword);
                        
                        // Close modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                        modal.hide();
                        
                        // Show success message
                        settingsManager.showToast('تم تغيير كلمة المرور بنجاح');
                    } catch (error) {
                        console.error('Error changing password:', error);
                        alert('حدث خطأ أثناء تغيير كلمة المرور. يرجى التأكد من كلمة المرور الحالية والمحاولة مرة أخرى.');
                    }
                });
            }
            
            // Set user ID and show modal
            document.getElementById('passwordUserId').value = userId;
            
            // Clear form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
            modal.show();
        } catch (error) {
            console.error('Error preparing password change:', error);
            alert('حدث خطأ أثناء تحضير تغيير كلمة المرور. يرجى المحاولة مرة أخرى.');
        }
    };

    // Patch the setupEventListeners method to handle async operations
    const originalSetupEventListeners = settingsManager.setupEventListeners;
    settingsManager.setupEventListeners = function() {
        // Call original method
        originalSetupEventListeners.call(this);
        
        // Add event listener to add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            // Remove existing event listeners
            const newAddUserBtn = addUserBtn.cloneNode(true);
            addUserBtn.parentNode.replaceChild(newAddUserBtn, addUserBtn);
            
            // Add new event listener
            newAddUserBtn.addEventListener('click', () => {
                this.showAddUserModal();
            });
        }
        
        // Add event listener to save new user button
        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            // Remove existing event listeners
            const newSaveUserBtn = saveUserBtn.cloneNode(true);
            saveUserBtn.parentNode.replaceChild(newSaveUserBtn, saveUserBtn);
            
            // Add new event listener
            newSaveUserBtn.addEventListener('click', async () => {
                await this.saveNewUser();
            });
        }
        
        // Add event listener to save edit user button
        const saveEditUserBtn = document.getElementById('saveEditUserBtn');
        if (saveEditUserBtn) {
            // Remove existing event listeners
            const newSaveEditUserBtn = saveEditUserBtn.cloneNode(true);
            saveEditUserBtn.parentNode.replaceChild(newSaveEditUserBtn, saveEditUserBtn);
            
            // Add new event listener
            newSaveEditUserBtn.addEventListener('click', async () => {
                await this.updateUser();
            });
        }
    };

    // Initialize the patched methods
    console.log('Settings API integration patch applied');
    
    // Load users using the patched method
    await settingsManager.loadUsers();
});
