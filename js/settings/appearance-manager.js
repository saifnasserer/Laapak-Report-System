/**
 * Laapak Report System - Appearance Management Module
 * Handles all appearance-related settings including themes, colors, and UI preferences
 */

import { defaultSettings } from './settings-constants.js';
import { showToast } from './settings-utils.js';

export class AppearanceManager {
    constructor() {
        this.initializeAppearanceSettings();
        this.applyCurrentTheme();
    }

    // Initialize appearance settings in localStorage if not present
    initializeAppearanceSettings() {
        const settings = this.getSettings();
        if (!settings.appearance) {
            settings.appearance = defaultSettings.appearance;
            this.saveSettings(settings);
        }
    }

    // Get settings from localStorage
    getSettings() {
        return JSON.parse(localStorage.getItem('lpk_settings') || '{}');
    }

    // Save settings to localStorage
    saveSettings(settings) {
        localStorage.setItem('lpk_settings', JSON.stringify(settings));
    }

    // Apply the current theme settings to the page
    applyCurrentTheme() {
        const settings = this.getSettings();
        const appearance = settings.appearance || defaultSettings.appearance;
        
        // Apply dark mode if enabled
        if (appearance.darkMode) {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }
        
        // Apply RTL direction if enabled
        if (appearance.rtl) {
            document.body.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('dir', 'rtl');
            
            // Add RTL Bootstrap if not already added
            if (!document.getElementById('bootstrap-rtl')) {
                const rtlStylesheet = document.createElement('link');
                rtlStylesheet.id = 'bootstrap-rtl';
                rtlStylesheet.rel = 'stylesheet';
                rtlStylesheet.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css';
                document.head.appendChild(rtlStylesheet);
            }
        } else {
            document.body.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('dir', 'ltr');
            
            // Remove RTL Bootstrap if present
            const rtlStylesheet = document.getElementById('bootstrap-rtl');
            if (rtlStylesheet) {
                rtlStylesheet.remove();
            }
        }
        
        // Apply font size
        const fontSizeClass = `font-size-${appearance.fontSize}`;
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        document.body.classList.add(fontSizeClass);
        
        // Apply custom colors
        this.applyCustomColors(appearance.primaryColor, appearance.secondaryColor);
    }

    // Apply custom colors to CSS variables
    applyCustomColors(primaryColor, secondaryColor) {
        // Create a style element for custom CSS variables
        let styleElement = document.getElementById('custom-theme-colors');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-theme-colors';
            document.head.appendChild(styleElement);
        }
        
        // Set CSS variables
        styleElement.textContent = `
            :root {
                --bs-primary: ${primaryColor};
                --bs-primary-rgb: ${this.hexToRgb(primaryColor)};
                --bs-secondary: ${secondaryColor};
                --bs-secondary-rgb: ${this.hexToRgb(secondaryColor)};
            }
            
            .btn-primary {
                background-color: ${primaryColor};
                border-color: ${primaryColor};
            }
            
            .btn-primary:hover {
                background-color: ${this.adjustColor(primaryColor, -20)};
                border-color: ${this.adjustColor(primaryColor, -20)};
            }
            
            .btn-outline-primary {
                color: ${primaryColor};
                border-color: ${primaryColor};
            }
            
            .btn-outline-primary:hover {
                background-color: ${primaryColor};
                border-color: ${primaryColor};
            }
            
            .text-primary {
                color: ${primaryColor} !important;
            }
            
            .bg-primary {
                background-color: ${primaryColor} !important;
            }
            
            .border-primary {
                border-color: ${primaryColor} !important;
            }
            
            a {
                color: ${primaryColor};
            }
            
            a:hover {
                color: ${this.adjustColor(primaryColor, -20)};
            }
            
            .nav-link.active {
                color: ${primaryColor} !important;
            }
            
            .form-check-input:checked {
                background-color: ${primaryColor};
                border-color: ${primaryColor};
            }
        `;
    }

    // Convert hex color to RGB
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }

    // Adjust color brightness
    adjustColor(color, amount) {
        // Remove # if present
        color = color.replace('#', '');
        
        // Parse hex values
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);
        
        // Adjust values
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Save appearance settings
    saveAppearanceSettings(appearanceData) {
        try {
            // Get current settings
            const settings = this.getSettings();
            
            // Update appearance settings
            settings.appearance = {
                ...settings.appearance,
                ...appearanceData
            };
            
            // Save settings
            this.saveSettings(settings);
            
            // Apply new theme
            this.applyCurrentTheme();
            
            // Show success message
            showToast('تم حفظ إعدادات المظهر بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('Error saving appearance settings:', error);
            showToast('فشل في حفظ إعدادات المظهر', 'error');
            return false;
        }
    }

    // Toggle dark mode
    toggleDarkMode() {
        const settings = this.getSettings();
        settings.appearance = settings.appearance || defaultSettings.appearance;
        settings.appearance.darkMode = !settings.appearance.darkMode;
        this.saveSettings(settings);
        this.applyCurrentTheme();
        
        const modeText = settings.appearance.darkMode ? 'الوضع المظلم' : 'الوضع الفاتح';
        showToast(`تم تفعيل ${modeText}`, 'success');
    }

    // Toggle RTL mode
    toggleRtlMode() {
        const settings = this.getSettings();
        settings.appearance = settings.appearance || defaultSettings.appearance;
        settings.appearance.rtl = !settings.appearance.rtl;
        this.saveSettings(settings);
        this.applyCurrentTheme();
        
        const directionText = settings.appearance.rtl ? 'من اليمين إلى اليسار' : 'من اليسار إلى اليمين';
        showToast(`تم تغيير اتجاه الصفحة إلى ${directionText}`, 'success');
    }

    // Change font size
    changeFontSize(size) {
        if (!['small', 'medium', 'large'].includes(size)) {
            console.error('Invalid font size:', size);
            return false;
        }
        
        const settings = this.getSettings();
        settings.appearance = settings.appearance || defaultSettings.appearance;
        settings.appearance.fontSize = size;
        this.saveSettings(settings);
        this.applyCurrentTheme();
        
        const sizeText = size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير';
        showToast(`تم تغيير حجم الخط إلى ${sizeText}`, 'success');
        
        return true;
    }

    // Reset appearance settings to defaults
    resetAppearanceSettings() {
        const settings = this.getSettings();
        settings.appearance = { ...defaultSettings.appearance };
        this.saveSettings(settings);
        this.applyCurrentTheme();
        
        showToast('تم إعادة ضبط إعدادات المظهر إلى الإعدادات الافتراضية', 'success');
    }

    // Load appearance settings into form
    loadAppearanceSettings(formId = 'appearanceSettingsForm') {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const settings = this.getSettings();
        const appearance = settings.appearance || defaultSettings.appearance;
        
        // Set form values
        const darkModeSwitch = form.querySelector('#darkModeSwitch');
        if (darkModeSwitch) {
            darkModeSwitch.checked = appearance.darkMode;
        }
        
        const rtlSwitch = form.querySelector('#rtlSwitch');
        if (rtlSwitch) {
            rtlSwitch.checked = appearance.rtl;
        }
        
        const fontSizeSelect = form.querySelector('#fontSize');
        if (fontSizeSelect) {
            fontSizeSelect.value = appearance.fontSize;
        }
        
        const primaryColorInput = form.querySelector('#primaryColor');
        if (primaryColorInput) {
            primaryColorInput.value = appearance.primaryColor;
        }
        
        const secondaryColorInput = form.querySelector('#secondaryColor');
        if (secondaryColorInput) {
            secondaryColorInput.value = appearance.secondaryColor;
        }
    }
}
