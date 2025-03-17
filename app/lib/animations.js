/**
 * Motion LLM Chat - Animation Utilities
 * Handles animations using Motion (formerly Framer Motion)
 */

class Animations {
    constructor() {
        // Check if Motion is available
        this.hasMotion = typeof window.motion !== 'undefined';
    }
    
    /**
     * Initialize animations and observe motion preferences
     */
    init() {
        // Check if Motion library is available and log warning if not
        if (!this.hasMotion) {
            console.warn('Motion library not found. Animations will be disabled.');
        }
        
        // Check for reduced motion preference
        this.checkReducedMotion();
        
        // Apply initial animations to elements
        this.applyInitialAnimations();
        
        // Set up settings panel animations
        this.setupSettingsPanelAnimations();
    }

    /**
     * Check if the user prefers reduced motion
     */
    checkReducedMotion() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Listen for changes to the preference
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
            this.prefersReducedMotion = event.matches;
        });
    }

    /**
     * Apply initial animations to elements
     */
    applyInitialAnimations() {
        // Don't animate if Motion is not available or reduced motion is preferred
        if (!this.hasMotion || this.prefersReducedMotion) return;
        
        // Add subtle entrance animation to header
        const header = document.querySelector('.app-header');
        if (header) {
            window.motion.animate(header, {
                y: [-10, 0],
                opacity: [0, 1]
            }, {
                duration: 0.5,
                easing: 'ease-out'
            });
        }
        
        // Add animation to empty state
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            window.motion.animate(emptyState, {
                scale: [0.95, 1],
                opacity: [0, 1]
            }, {
                duration: 0.6,
                easing: 'ease-out',
                delay: 0.2
            });
        }
    }

    /**
     * Set up settings panel animations
     */
    setupSettingsPanelAnimations() {
        const settingsContainer = document.getElementById('settings-container');
        const toggleSettingsButton = document.getElementById('toggle-settings-button');
        const closeSettingsButton = document.getElementById('close-settings-button');
        
        if (!settingsContainer || !this.hasMotion || this.prefersReducedMotion) return;
        
        // Add MutationObserver to watch for class changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isOpen = settingsContainer.classList.contains('open');
                    this.animateSettingsPanel(settingsContainer, isOpen);
                }
            });
        });
        
        // Start observing
        observer.observe(settingsContainer, { attributes: true });
        
        // Make close button more interactive
        if (closeSettingsButton) {
            closeSettingsButton.addEventListener('mouseenter', () => {
                if (!this.hasMotion || this.prefersReducedMotion) return;
                
                window.motion.animate(closeSettingsButton, {
                    scale: 1.1,
                    rotate: 90
                }, {
                    duration: 0.2
                });
            });
            
            closeSettingsButton.addEventListener('mouseleave', () => {
                if (!this.hasMotion || this.prefersReducedMotion) return;
                
                window.motion.animate(closeSettingsButton, {
                    scale: 1,
                    rotate: 0
                }, {
                    duration: 0.2
                });
            });
        }
    }
    
    /**
     * Animate the settings panel sliding in or out
     * @param {HTMLElement} panel - The settings panel element
     * @param {boolean} isOpen - Whether the panel is opening or closing
     */
    animateSettingsPanel(panel, isOpen) {
        if (!this.hasMotion || this.prefersReducedMotion) return;
        
        if (isOpen) {
            // Panel is opening
            window.motion.animate(panel, { 
                x: ['100%', '0%']
            }, {
                duration: 0.3,
                easing: [0.22, 1, 0.36, 1] // Custom easing for smooth slide
            });
        }
    }

    /**
     * Create a typing indicator animation
     * @param {HTMLElement} element - The element to animate
     */
    createTypingIndicator(element) {
        if (!this.hasMotion || this.prefersReducedMotion) return;
        
        const dots = element.querySelectorAll('.typing-dot');
        
        dots.forEach((dot, i) => {
            window.motion.animate(dot, {
                y: [0, -10, 0],
                opacity: [1, 0.5, 1]
            }, {
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                easing: 'ease-in-out'
            });
        });
    }

    /**
     * Create a bounce animation for the send button
     * @param {HTMLElement} button - The button to animate
     */
    animateSendButton(button) {
        if (!this.hasMotion || this.prefersReducedMotion) return;
        
        window.motion.animate(button, {
            scale: [1, 0.9, 1]
        }, {
            duration: 0.3,
            easing: 'ease-in-out'
        });
    }

    /**
     * Create a shake animation for an element (used for errors)
     * @param {HTMLElement} element - The element to animate
     */
    shakeElement(element) {
        if (!this.hasMotion || this.prefersReducedMotion) {
            // Fallback with CSS
            element.style.animation = 'shake 0.4s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 400);
            return;
        }
        
        window.motion.animate(element, {
            x: [0, -5, 5, -5, 5, 0]
        }, {
            duration: 0.4,
            easing: 'ease-in-out'
        });
    }

    /**
     * Create a slide transition for the settings panel
     * @param {HTMLElement} element - The element to animate
     * @param {boolean} isVisible - Whether the element is becoming visible
     */
    slidePanel(element, isVisible) {
        if (!this.hasMotion || this.prefersReducedMotion) {
            element.style.display = isVisible ? 'block' : 'none';
            return;
        }
        
        if (isVisible) {
            element.style.display = 'block';
            window.motion.animate(element, {
                y: [-20, 0],
                opacity: [0, 1]
            }, {
                duration: 0.3,
                easing: 'ease-out'
            });
        } else {
            window.motion.animate(element, {
                y: [0, -20],
                opacity: [1, 0]
            }, {
                duration: 0.3,
                easing: 'ease-in',
                onComplete: () => {
                    element.style.display = 'none';
                }
            });
        }
    }

    /**
     * Create a typing effect for text
     * @param {HTMLElement} element - The element to animate
     * @param {string} text - The text to display
     * @param {number} speed - Typing speed in milliseconds per character
     * @returns {Promise} A promise that resolves when the animation is complete
     */
    typeText(element, text, speed = 30) {
        if (this.prefersReducedMotion) {
            element.textContent = text;
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            let index = 0;
            element.textContent = '';
            
            const interval = setInterval(() => {
                element.textContent += text[index];
                index++;
                
                if (index >= text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }

    /**
     * Create a pulse animation
     * @param {HTMLElement} element - The element to animate
     */
    pulseElement(element) {
        if (!this.hasMotion || this.prefersReducedMotion) return;
        
        window.motion.animate(element, {
            scale: [1, 1.05, 1]
        }, {
            duration: 0.5,
            easing: 'ease-in-out'
        });
    }
    
    /**
     * Create a fade-in animation
     * @param {HTMLElement} element - The element to animate
     * @param {number} duration - Animation duration in seconds
     */
    fadeIn(element, duration = 0.3) {
        if (!this.hasMotion || this.prefersReducedMotion) {
            element.style.opacity = 1;
            return;
        }
        
        window.motion.animate(element, {
            opacity: [0, 1]
        }, {
            duration,
            easing: 'ease-out'
        });
    }
    
    /**
     * Create a fade-out animation
     * @param {HTMLElement} element - The element to animate
     * @param {number} duration - Animation duration in seconds
     * @returns {Promise} A promise that resolves when the animation is complete
     */
    fadeOut(element, duration = 0.3) {
        if (!this.hasMotion || this.prefersReducedMotion) {
            element.style.opacity = 0;
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            window.motion.animate(element, {
                opacity: [1, 0]
            }, {
                duration,
                easing: 'ease-in',
                onComplete: resolve
            });
        });
    }
}

// Create and export a singleton instance
const animations = new Animations();

// Expose the instance globally for other modules
window.animations = animations; 