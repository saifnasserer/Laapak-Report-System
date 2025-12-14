/**
 * Notification Manager
 * Handles notification display and queue management
 * @class NotificationManager
 */
class NotificationManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.queue = [];
        this.maxVisible = 3;
        this.notifications = new Map();
        
        this.initializeStyles();
        this.setupEventListeners();
    }
    
    /**
     * Initialize notification styles
     * @private
     */
    initializeStyles() {
        if (document.getElementById('notificationManagerStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'notificationManagerStyles';
        style.textContent = `
            .glass-notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                max-width: 400px;
                padding: 1.25rem 1.5rem;
                background: var(--glass-bg-elevated, rgba(255, 255, 255, 0.8));
                backdrop-filter: blur(40px) saturate(180%);
                -webkit-backdrop-filter: blur(40px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.6);
                border-radius: var(--radius-lg, 16px);
                box-shadow: var(--shadow-glass-elevated, 0 20px 60px rgba(0, 0, 0, 0.12));
                z-index: 10000;
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
                animation: notificationSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .glass-notification.hide {
                animation: notificationSlideOut 0.3s ease forwards;
            }
            .glass-notification.error { border-left: 4px solid #ff3b30; }
            .glass-notification.success { border-left: 4px solid var(--laapak-medium-green, #0eaf54); }
            .glass-notification.warning { border-left: 4px solid #ff9500; }
            .glass-notification-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            .glass-notification.error .glass-notification-icon { color: #ff3b30; }
            .glass-notification.success .glass-notification-icon { color: var(--laapak-medium-green, #0eaf54); }
            .glass-notification.warning .glass-notification-icon { color: #ff9500; }
            .glass-notification-content {
                flex: 1;
                color: var(--text-primary, rgba(0, 0, 0, 0.9));
                font-size: 0.9375rem;
                line-height: 1.5;
            }
            .glass-notification-close {
                background: none;
                border: none;
                color: var(--text-tertiary, rgba(0, 0, 0, 0.5));
                cursor: pointer;
                font-size: 1.25rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: var(--transition-fast, all 0.15s ease);
            }
            .glass-notification-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: var(--text-primary, rgba(0, 0, 0, 0.9));
            }
            @keyframes notificationSlideIn {
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            @keyframes notificationSlideOut {
                to {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        this.eventBus.on('notification:show', (data) => {
            this.show(data.message, data.type, data.duration);
        });
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (error, success, warning)
     * @param {number} duration - Auto-dismiss duration in ms
     */
    show(message, type = 'error', duration = 5000) {
        const notificationId = 'notification-' + Date.now() + '-' + Math.random();
        
        this.queue.push({
            id: notificationId,
            message,
            type,
            duration
        });
        
        this.processQueue();
    }
    
    /**
     * Process notification queue
     * @private
     */
    processQueue() {
        // Remove hidden notifications
        document.querySelectorAll('.glass-notification.hide').forEach(n => {
            setTimeout(() => n.remove(), 300);
        });
        
        // Count visible notifications
        const visibleCount = document.querySelectorAll('.glass-notification:not(.hide)').length;
        
        // Show next notification if we have space
        if (this.queue.length > 0 && visibleCount < this.maxVisible) {
            const notificationData = this.queue.shift();
            this.createNotification(notificationData);
        }
    }
    
    /**
     * Create and display notification element
     * @private
     * @param {Object} data - Notification data
     */
    createNotification({ id, message, type, duration }) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `glass-notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        
        // Calculate top position
        const existingNotifications = document.querySelectorAll('.glass-notification:not(.hide)');
        const topOffset = 2 + (existingNotifications.length * 5.5);
        notification.style.top = `${topOffset}rem`;
        
        // Determine icon
        const icons = {
            error: 'fa-exclamation-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || icons.error} glass-notification-icon"></i>
            <div class="glass-notification-content">${message}</div>
            <button class="glass-notification-close" aria-label="إغلاق" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Close button handler
        const closeBtn = notification.querySelector('.glass-notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dismiss(id);
            });
        }
        
        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
    }
    
    /**
     * Dismiss notification
     * @param {string} id - Notification ID
     */
    dismiss(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
                this.notifications.delete(id);
                this.processQueue();
            }, 300);
        }
    }
    
    /**
     * Clear all notifications
     */
    clear() {
        this.notifications.forEach((notification, id) => {
            this.dismiss(id);
        });
        this.queue = [];
    }
}

// Export class
window.NotificationManager = NotificationManager;

