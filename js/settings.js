/**
 * Laapak Report System - Settings Management JavaScript
 * Handles all system settings, user management, backups, and configuration
 * 
 * Features:
 * - General system settings management
 * - User management (create, edit, delete admins/technicians)
 * - User permissions and roles
 * - Notification settings
 * - Data backup and restore
 * - System theme and appearance
 * - Backend API integration
 *
 * This file is now a simple entry point that imports the modular settings components
 */

// Import the main settings manager
import { SettingsManager } from './settings/settings-manager.js';

// Initialize settings manager when document is ready
let settingsManager;
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings manager
    settingsManager = new SettingsManager();
    
    // Check for offline status
    function updateOfflineStatus() {
        const offlineAlert = document.getElementById('offlineAlert');
        if (offlineAlert) {
            if (navigator.onLine) {
                offlineAlert.style.display = 'none';
            } else {
                offlineAlert.style.display = 'block';
            }
        }
    }

    // Initial check
    updateOfflineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
});
