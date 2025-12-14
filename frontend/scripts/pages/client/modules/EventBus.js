/**
 * Event Bus
 * Centralized event system for decoupled component communication
 * @class EventBus
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.onceCallbacks = new Map();
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.events.get(event);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }
    
    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        if (!this.onceCallbacks.has(event)) {
            this.onceCallbacks.set(event, new Set());
        }
        
        this.onceCallbacks.get(event).add(callback);
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        // Emit to regular listeners
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // Emit to once listeners and remove them
        if (this.onceCallbacks.has(event)) {
            this.onceCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in once event listener for ${event}:`, error);
                }
            });
            this.onceCallbacks.delete(event);
        }
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
        
        if (this.onceCallbacks.has(event)) {
            this.onceCallbacks.get(event).delete(callback);
        }
    }
    
    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (this.events.has(event)) {
            this.events.delete(event);
        }
        
        if (this.onceCallbacks.has(event)) {
            this.onceCallbacks.delete(event);
        }
    }
    
    /**
     * Clear all events
     */
    clear() {
        this.events.clear();
        this.onceCallbacks.clear();
    }
}

// Export singleton instance
window.EventBus = EventBus;
window.eventBus = new EventBus();

