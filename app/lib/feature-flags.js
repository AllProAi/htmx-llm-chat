 /**
 * Motion LLM Chat - Feature Flags
 * Manages feature flags for progressive functionality rollout
 */

const FeatureFlags = {
    // Available flags
    FLAGS: {
        RESPONSES_API: 'feature_responses_api',
        WEB_SEARCH: 'feature_web_search',
        IMAGE_UPLOAD: 'feature_image_upload'
    },

    /**
     * Get the value of a feature flag
     * @param {string} flagName - The name of the flag to check
     * @param {boolean} defaultValue - Default value if flag is not set
     * @returns {boolean} - Whether the feature is enabled
     */
    isEnabled(flagName, defaultValue = false) {
        if (!this.FLAGS[flagName]) {
            console.warn(`Unknown feature flag: ${flagName}`);
            return defaultValue;
        }
        
        const storageKey = this.FLAGS[flagName];
        return localStorage.getItem(storageKey) === 'true';
    },

    /**
     * Set a feature flag value
     * @param {string} flagName - The name of the flag to set
     * @param {boolean} value - The value to set
     * @returns {boolean} - Whether the operation was successful
     */
    setFlag(flagName, value) {
        if (!this.FLAGS[flagName]) {
            console.warn(`Unknown feature flag: ${flagName}`);
            return false;
        }
        
        const storageKey = this.FLAGS[flagName];
        localStorage.setItem(storageKey, value ? 'true' : 'false');
        
        // Dispatch event for components to react
        document.dispatchEvent(new CustomEvent('feature-flag:changed', {
            detail: {
                flag: flagName,
                value: value
            }
        }));
        
        return true;
    },

    /**
     * Enable a feature flag
     * @param {string} flagName - The name of the flag to enable
     * @returns {boolean} - Whether the operation was successful
     */
    enable(flagName) {
        return this.setFlag(flagName, true);
    },

    /**
     * Disable a feature flag
     * @param {string} flagName - The name of the flag to disable
     * @returns {boolean} - Whether the operation was successful
     */
    disable(flagName) {
        return this.setFlag(flagName, false);
    },

    /**
     * Toggle a feature flag
     * @param {string} flagName - The name of the flag to toggle
     * @returns {boolean} - The new state of the flag
     */
    toggle(flagName) {
        const currentState = this.isEnabled(flagName);
        this.setFlag(flagName, !currentState);
        return !currentState;
    },

    /**
     * Initialize all feature flags with default values
     * @param {Object} defaults - Map of flag names to default values
     */
    initializeDefaults(defaults = {}) {
        // For each known flag, set default if not already set
        Object.keys(this.FLAGS).forEach(flagName => {
            const storageKey = this.FLAGS[flagName];
            if (localStorage.getItem(storageKey) === null) {
                const defaultValue = defaults[flagName] !== undefined ? defaults[flagName] : false;
                localStorage.setItem(storageKey, defaultValue ? 'true' : 'false');
            }
        });
    },

    /**
     * Get all feature flags and their values
     * @returns {Object} - Map of flag names to boolean values
     */
    getAllFlags() {
        const flags = {};
        Object.keys(this.FLAGS).forEach(flagName => {
            flags[flagName] = this.isEnabled(flagName);
        });
        return flags;
    }
};

// Initialize with defaults
FeatureFlags.initializeDefaults({
    // Initially disable all experimental features
    RESPONSES_API: false,
    WEB_SEARCH: false,
    IMAGE_UPLOAD: false
});

// Expose globally
window.FeatureFlags = FeatureFlags;