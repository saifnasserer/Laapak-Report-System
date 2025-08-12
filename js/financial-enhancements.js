/**
 * Financial System Enhancements
 * Enhanced animations, interactions, and user experience features
 */

class FinancialEnhancements {
    constructor() {
        this.initializeEnhancements();
    }

    /**
     * Initialize all enhancements
     */
    initializeEnhancements() {
        this.setupAnimations();
        this.setupInteractions();
        this.setupNotifications();
        this.setupCharts();
        this.setupResponsive();
    }

    /**
     * Setup enhanced animations
     */
    setupAnimations() {
        // Animate KPI cards on load
        this.animateKPICards();
        
        // Animate charts on scroll
        this.animateChartsOnScroll();
        
        // Animate form elements
        this.animateFormElements();
    }

    /**
     * Animate KPI cards with staggered entrance
     */
    animateKPICards() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    /**
     * Animate charts when they come into view
     */
    animateChartsOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('chart-animate');
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.chart-container').forEach(chart => {
            observer.observe(chart);
        });
    }

    /**
     * Animate form elements
     */
    animateFormElements() {
        const formElements = document.querySelectorAll('.form-control, .btn, .category-option');
        formElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.4s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }

    /**
     * Setup enhanced interactions
     */
    setupInteractions() {
        // Enhanced button hover effects
        this.setupButtonEffects();
        
        // Enhanced form interactions
        this.setupFormInteractions();
        
        // Enhanced table interactions
        this.setupTableInteractions();
        
        // Enhanced modal interactions
        this.setupModalInteractions();
    }

    /**
     * Setup enhanced button effects
     */
    setupButtonEffects() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                this.createRippleEffect(e);
            });
            
            button.addEventListener('click', (e) => {
                this.createClickEffect(e);
            });
        });
    }

    /**
     * Create ripple effect on button hover
     */
    createRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Create click effect
     */
    createClickEffect(event) {
        const button = event.currentTarget;
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    /**
     * Setup enhanced form interactions
     */
    setupFormInteractions() {
        // Enhanced input focus effects
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('focus', (e) => {
                e.target.parentElement.classList.add('input-focused');
            });
            
            input.addEventListener('blur', (e) => {
                if (!e.target.value) {
                    e.target.parentElement.classList.remove('input-focused');
                }
            });
        });

        // Enhanced category selection
        document.querySelectorAll('.category-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.animateCategorySelection(e.target);
            });
        });
    }

    /**
     * Animate category selection
     */
    animateCategorySelection(element) {
        // Remove previous selections
        document.querySelectorAll('.category-option.selected').forEach(selected => {
            selected.classList.remove('selected');
        });
        
        // Add selection with animation
        element.classList.add('selected');
        element.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1.02)';
        }, 200);
    }

    /**
     * Setup enhanced table interactions
     */
    setupTableInteractions() {
        document.querySelectorAll('.table tbody tr').forEach(row => {
            row.addEventListener('mouseenter', (e) => {
                this.highlightTableRow(e.target);
            });
            
            row.addEventListener('mouseleave', (e) => {
                this.unhighlightTableRow(e.target);
            });
        });
    }

    /**
     * Highlight table row
     */
    highlightTableRow(row) {
        row.style.transform = 'scale(1.01)';
        row.style.boxShadow = '0 4px 12px rgba(0, 117, 83, 0.15)';
    }

    /**
     * Unhighlight table row
     */
    unhighlightTableRow(row) {
        row.style.transform = 'scale(1)';
        row.style.boxShadow = 'none';
    }

    /**
     * Setup enhanced modal interactions
     */
    setupModalInteractions() {
        // Enhanced modal animations
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('show.bs.modal', (e) => {
                this.animateModalOpen(e.target);
            });
            
            modal.addEventListener('hide.bs.modal', (e) => {
                this.animateModalClose(e.target);
            });
        });
    }

    /**
     * Animate modal opening
     */
    animateModalOpen(modal) {
        const dialog = modal.querySelector('.modal-dialog');
        dialog.style.transform = 'scale(0.7)';
        dialog.style.opacity = '0';
        
        setTimeout(() => {
            dialog.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            dialog.style.transform = 'scale(1)';
            dialog.style.opacity = '1';
        }, 10);
    }

    /**
     * Animate modal closing
     */
    animateModalClose(modal) {
        const dialog = modal.querySelector('.modal-dialog');
        dialog.style.transform = 'scale(0.7)';
        dialog.style.opacity = '0';
    }

    /**
     * Setup enhanced notifications
     */
    setupNotifications() {
        // Create notification container
        this.createNotificationContainer();
        
        // Setup notification styles
        this.setupNotificationStyles();
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
    }

    /**
     * Setup notification styles
     */
    setupNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification-item {
                background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                color: #333;
                font-weight: 500;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(10px);
                border-left: 4px solid;
                min-width: 300px;
            }
            
            .notification-item.show {
                transform: translateX(0);
            }
            
            .notification-item.success {
                border-left-color: #28a745;
            }
            
            .notification-item.error {
                border-left-color: #dc3545;
            }
            
            .notification-item.warning {
                border-left-color: #ffc107;
            }
            
            .notification-item.info {
                border-left-color: #0dcaf0;
            }
            
            .ripple-effect {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            }
            
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .chart-animate {
                animation: chartFadeIn 0.8s ease-out;
            }
            
            @keyframes chartFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .input-focused .form-label {
                color: #007553;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show enhanced notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification-item ${type}`;
        notification.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <i class="fas ${this.getNotificationIcon(type)} me-2"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Setup enhanced charts
     */
    setupCharts() {
        // Enhanced chart animations
        this.setupChartAnimations();
        
        // Enhanced chart interactions
        this.setupChartInteractions();
    }

    /**
     * Setup chart animations
     */
    setupChartAnimations() {
        // Add animation to chart containers
        document.querySelectorAll('.chart-container').forEach(chart => {
            chart.addEventListener('mouseenter', () => {
                chart.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            chart.addEventListener('mouseleave', () => {
                chart.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    /**
     * Setup chart interactions
     */
    setupChartInteractions() {
        // Add click handlers for chart elements
        document.querySelectorAll('.chart-container canvas').forEach(canvas => {
            canvas.addEventListener('click', (e) => {
                this.handleChartClick(e);
            });
        });
    }

    /**
     * Handle chart click
     */
    handleChartClick(event) {
        // Add visual feedback for chart clicks
        const canvas = event.target;
        canvas.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            canvas.style.transform = 'scale(1)';
        }, 150);
    }

    /**
     * Setup responsive enhancements
     */
    setupResponsive() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Setup mobile-specific enhancements
        if (window.innerWidth <= 768) {
            this.setupMobileEnhancements();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate chart sizes if needed
        this.resizeCharts();
        
        // Adjust layout for mobile
        if (window.innerWidth <= 768) {
            this.setupMobileEnhancements();
        }
    }

    /**
     * Resize charts
     */
    resizeCharts() {
        // Trigger chart resize if Chart.js is available
        if (typeof Chart !== 'undefined') {
            Chart.instances.forEach(chart => {
                chart.resize();
            });
        }
    }

    /**
     * Setup mobile enhancements
     */
    setupMobileEnhancements() {
        // Adjust card layouts for mobile
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.marginBottom = '1rem';
        });
        
        // Adjust button sizes for mobile
        document.querySelectorAll('.btn').forEach(btn => {
            btn.style.padding = '0.75rem 1rem';
            btn.style.fontSize = '0.9rem';
        });
    }

    /**
     * Format currency with animation
     */
    animateCurrencyValue(element, startValue, endValue, duration = 2000) {
        const startTime = performance.now();
        const range = endValue - startValue;

        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (range * easeOut);
            
            element.textContent = new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0
            }).format(Math.round(current));

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }

        requestAnimationFrame(updateValue);
    }

    /**
     * Animate percentage with counter
     */
    animatePercentage(element, startValue, endValue, duration = 2000) {
        const startTime = performance.now();
        const range = endValue - startValue;

        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (range * easeOut);
            
            element.textContent = current.toFixed(1) + '%';

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }

        requestAnimationFrame(updateValue);
    }

    /**
     * Create loading skeleton
     */
    createLoadingSkeleton(container, rows = 5) {
        container.innerHTML = '';
        
        for (let i = 0; i < rows; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-row';
            skeleton.innerHTML = `
                <div class="skeleton-item" style="width: 60%; height: 20px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div>
                <div class="skeleton-item" style="width: 40%; height: 20px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div>
            `;
            skeleton.style.cssText = `
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                padding: 1rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            container.appendChild(skeleton);
        }

        // Add shimmer animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Remove loading skeleton
     */
    removeLoadingSkeleton(container) {
        container.innerHTML = '';
    }
}

// Initialize enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financialEnhancements = new FinancialEnhancements();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancialEnhancements;
} 