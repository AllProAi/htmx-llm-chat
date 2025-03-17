//  Motion LLM Chat -
//Initializes the application and connects all components
//


let settingsContainer = null;
let userInput = null;
let responsesApiToggle = null;
let webSearchToggle = null;
let chatMessages = null;

// Handler for message submission
function sendMessage(event) {
    // Prevent form submission
    if (event) {
        event.preventDefault();
        event.stopPropagation(); // Also stop propagation
    }
    
    // Get the user's message
    const message = userInput.value.trim();
    
    // Don't send empty messages
    if (!message) return;
    
    // Get selected model and provider
    const model = window.chatAPI.getModel();
    const isAnthropicModel = model.startsWith('claude-');
    
    // Check if the appropriate API key is set
    if (isAnthropicModel && !window.chatAPI.hasAnthropicApiKey()) {
        window.chatUI.showError('Please enter your Anthropic API key in the settings panel.');
        
        // Open settings panel if it's not already open
        if (!settingsContainer.classList.contains('open')) {
            settingsContainer.classList.add('open');
        }
        
        return;
    } else if (!isAnthropicModel && !window.chatAPI.hasApiKey()) {
        window.chatUI.showError('Please enter your OpenAI API key in the settings panel.');
        
        // Open settings panel if it's not already open
        if (!settingsContainer.classList.contains('open')) {
            settingsContainer.classList.add('open');
        }
        
        return;
    }
    
    // Clear the input
    window.chatUI.clearInput();
    
    // Add user message to the UI
    const messageElement = window.chatUI.addUserMessage(message);
    
    // Show typing indicator as AI prepares response
    const typingIndicator = window.chatUI.showTypingIndicator();
    
    // Set loading state for UI feedback
    window.chatUI.setLoadingState(true);
    
    // Add to conversation history (prevent duplicates)
    const conversation = window.chatAPI.getCurrentConversation();
    if (!conversation.messages) {
        conversation.messages = [];
    }
    
    // Check if this message is a duplicate of the last user message
    const lastMessage = conversation.messages.length > 0 ? 
        conversation.messages[conversation.messages.length - 1] : null;
        
    // Only add if it's not a duplicate or if the last message wasn't from the user
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== message) {
        conversation.messages.push({
            role: 'user',
            content: message
        });
        
        // Save updated conversation
        window.chatAPI.saveConversations();
    }
    
    // Determine if we should use the Responses API
    const useResponsesApi = window.FeatureFlags.isEnabled('RESPONSES_API') && window.chatAPI.responseAPI !== null;
    const useWebSearch = window.FeatureFlags.isEnabled('WEB_SEARCH');
    
    // Choose API method based on feature flags
    if (useResponsesApi) {
        // Use the Responses API
        window.chatAPI.responseAPI.sendMessage(
            message, 
            model,
            conversation.messages,
            conversation.id,
            // onProgress handler
            (chunk) => {
                // Update typing indicator with chunks as they arrive
                if (typingIndicator && typeof typingIndicator.innerHTML !== 'undefined') {
                    // Add the chunk to the content
                    typingIndicator.innerHTML += chunk;
                    
                    // Keep scrolling to bottom as content comes in
                    window.chatUI.scrollToBottom();
                }
            },
            // onComplete handler
            (response) => {
                // Fade out typing dots
                const dotsContainer = document.querySelector('.typing-dots');
                if (dotsContainer) {
                    dotsContainer.style.opacity = '0';
                    dotsContainer.style.transition = 'opacity 0.3s ease-out';
                }
                
                // Wait for transition to complete
                setTimeout(() => {
                    // Remove typing indicator
                    window.chatUI.removeTypingIndicator();
                    
                    // Add AI response to the UI
                    window.chatUI.addAIMessage(response.text);
                    
                    // Add to conversation history
                    conversation.messages.push({
                        role: 'assistant',
                        content: response.text
                    });
                    
                    // Save updated conversation
                    window.chatAPI.saveConversations();
                    
                    // Remove loading state
                    window.chatUI.setLoadingState(false);
                }, 300); // Transition time
            },
            // onError handler
            (error) => {
                // Remove typing indicator
                window.chatUI.removeTypingIndicator();
                
                // Show error message
                window.chatUI.showError(error);
                
                // Remove loading state
                window.chatUI.setLoadingState(false);
            },
            // Use web search if enabled
            useWebSearch
        );
    } else {
        // Use the traditional Chat Completions API
        window.chatAPI.sendMessage(
            message,
            // onChunk handler - called for each chunk of the streamed response
            (chunk) => {
                // Update typing indicator with chunks as they arrive
                if (typingIndicator && typeof typingIndicator.innerHTML !== 'undefined') {
                    // Add the chunk to the content 
                    typingIndicator.innerHTML += chunk;
                    
                    // Keep scrolling to bottom as content grows
                    window.chatUI.scrollToBottom();
                }
            },
            // onComplete handler - called when the entire response is received
            (fullResponse) => {
                // Fade out typing dots
                const dotsContainer = document.querySelector('.typing-dots');
                if (dotsContainer) {
                    dotsContainer.style.opacity = '0';
                    dotsContainer.style.transition = 'opacity 0.3s ease-out';
                }
                
                // Wait for transition to complete
                setTimeout(() => {
                    // Remove typing indicator
                    window.chatUI.removeTypingIndicator();
                    
                    // Add AI response to the UI
                    window.chatUI.addAIMessage(fullResponse);
                    
                    // Add to conversation history
                    conversation.messages.push({
                        role: 'assistant',
                        content: fullResponse
                    });
                    
                    // Save updated conversation
                    window.chatAPI.saveConversations();
                    
                    // Remove loading state
                    window.chatUI.setLoadingState(false);
                }, 300); // Transition time
            },
            // onError handler - called on error
            (error) => {
                // Remove typing indicator
                window.chatUI.removeTypingIndicator();
                
                // Show error message
                window.chatUI.showError(error);
                
                // Remove loading state
                window.chatUI.setLoadingState(false);
            }
        );
    }
    
    // Return false to prevent form submission
    return false;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI (chatAPI is already initialized in api.js)
    window.chatUI = new ChatUI();
    
    // Get DOM elements
    settingsContainer = document.getElementById('settings-container');
    userInput = document.getElementById('user-input');
    
    // Initialize responses API toggle if present
    responsesApiToggle = document.getElementById('toggle-responses-api');
    if (responsesApiToggle) {
        responsesApiToggle.checked = window.FeatureFlags.isEnabled('RESPONSES_API');
        
        // Add event listener for the toggle
        responsesApiToggle.addEventListener('change', (event) => {
            window.FeatureFlags.setFlag('RESPONSES_API', event.target.checked);
            
            // Update web search toggle availability
            if (webSearchToggle) {
                webSearchToggle.disabled = !event.target.checked;
                // Disable web search if Responses API is disabled
                if (!event.target.checked && webSearchToggle.checked) {
                    webSearchToggle.checked = false;
                    window.FeatureFlags.setFlag('WEB_SEARCH', false);
                }
            }
        });
    }
    
    // Initialize web search toggle if present
    webSearchToggle = document.getElementById('toggle-web-search');
    if (webSearchToggle) {
        webSearchToggle.checked = window.FeatureFlags.isEnabled('WEB_SEARCH');
        webSearchToggle.disabled = !window.FeatureFlags.isEnabled('RESPONSES_API');
        
        // Add event listener for the toggle
        webSearchToggle.addEventListener('change', (event) => {
            window.FeatureFlags.setFlag('WEB_SEARCH', event.target.checked);
        });
    }
    
    // Initialize UI with conversation history
    window.chatUI.initializeUI();
    
    // Set up global variables for easy access in event handlers
    chatMessages = document.getElementById('chat-messages');
    
    // Set the current conversation title
    const conversationTitle = document.getElementById('conversation-title');
    if (conversationTitle) {
        const currentConversation = window.chatAPI.getCurrentConversation();
        if (currentConversation) {
            conversationTitle.textContent = currentConversation.title;
        }
    }
    
    // Load messages from current conversation
    window.chatUI.loadConversation(window.chatAPI.currentConversationId);
    
    // Set global handlers
    window.sendMessage = sendMessage;
    window.toggleResponsesAPI = toggleResponsesAPI;
    window.toggleWebSearch = toggleWebSearch;
    
    // Setup additional event listeners and UI elements
    setupEventListeners();
});

/**
 * Toggle the Responses API
 * @param {boolean} enabled - Whether to enable the Responses API
 */
function toggleResponsesAPI(enabled) {
    window.chatAPI.setUseResponsesAPI(enabled);
    
    // Update web search toggle - only enable it if Responses API is enabled
    if (webSearchToggle) {
        webSearchToggle.disabled = !enabled;
        
        // If disabling Responses API, also disable web search
        if (!enabled && webSearchToggle.checked) {
            webSearchToggle.checked = false;
            toggleWebSearch(false);
        }
    }
    
    // Show notification
    window.chatUI.showNotification(
        enabled ? 
        'Responses API enabled. Enjoy stateful conversations and advanced features!' : 
        'Responses API disabled. Using standard Chat Completions API.'
    );
}

/**
 * Toggle web search functionality
 * @param {boolean} enabled - Whether to enable web search
 */
function toggleWebSearch(enabled) {
    window.chatAPI.setUseWebSearch(enabled);
    
    // Show notification
    window.chatUI.showNotification(
        enabled ? 
        'Web search enabled. The AI can now search the web for up-to-date information.' : 
        'Web search disabled.'
    );
}

// Expose functions to window object
window.toggleResponsesAPI = toggleResponsesAPI;
window.toggleWebSearch = toggleWebSearch;

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Setup settings panel toggle
    const toggleSettingsButton = document.getElementById('toggle-settings-button');
    const closeSettingsButton = document.getElementById('close-settings-button');
    
    if (toggleSettingsButton) {
        toggleSettingsButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default action
            event.stopPropagation(); // Stop propagation to prevent immediate closing
            settingsContainer.classList.add('open');
            document.body.classList.add('settings-open');
            console.log('Settings panel opened'); // Add debug log
        });
    }
    
    if (closeSettingsButton) {
        closeSettingsButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default action
            settingsContainer.classList.remove('open');
            document.body.classList.remove('settings-open');
            console.log('Settings panel closed'); // Add debug log
        });
    }
    
    // Close settings panel when clicking outside of it
    document.addEventListener('click', (event) => {
        // If the settings container is open AND the click is outside the settings panel
        // AND the click is not on the toggle button
        if (settingsContainer.classList.contains('open') && 
            !event.target.closest('.settings-panel') && 
            !event.target.closest('#toggle-settings-button')) {
            settingsContainer.classList.remove('open');
            document.body.classList.remove('settings-open');
        }
    });
    
    // Stop propagation for clicks inside the settings panel
    if (settingsContainer) {
        settingsContainer.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }
    
    // Set up API key-related functions
    window.saveApiKey = function() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiKeyStatus = document.getElementById('api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        const key = apiKeyInput.value.trim();
        
        if (key === '••••••••••••••••••••••') {
            apiKeyStatus.textContent = 'Please enter a new API key';
            apiKeyStatus.className = 'api-key-status status-error';
            if (window.animations && window.animations.shakeElement) {
                window.animations.shakeElement(apiKeyInput);
            }
            return;
        }
        
        if (window.chatAPI.saveApiKey(key)) {
            apiKeyInput.value = '••••••••••••••••••••••';
            apiKeyStatus.textContent = 'API key saved successfully';
            apiKeyStatus.className = 'api-key-status status-success';
            window.chatUI.updateEmptyState();
        } else {
            apiKeyStatus.textContent = 'Invalid API key format';
            apiKeyStatus.className = 'api-key-status status-error';
            if (window.animations && window.animations.shakeElement) {
                window.animations.shakeElement(apiKeyInput);
            }
        }
    };
    
    window.saveAnthropicApiKey = function() {
        const apiKeyInput = document.getElementById('anthropic-api-key-input');
        const apiKeyStatus = document.getElementById('anthropic-api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        const key = apiKeyInput.value.trim();
        
        if (key === '••••••••••••••••••••••') {
            apiKeyStatus.textContent = 'Please enter a new API key';
            apiKeyStatus.className = 'api-key-status status-error';
            if (window.animations && window.animations.shakeElement) {
                window.animations.shakeElement(apiKeyInput);
            }
            return;
        }
        
        if (window.chatAPI.saveAnthropicApiKey(key)) {
            apiKeyInput.value = '••••••••••••••••••••••';
            apiKeyStatus.textContent = 'API key saved successfully';
            apiKeyStatus.className = 'api-key-status status-success';
            window.chatUI.updateEmptyState();
        } else {
            apiKeyStatus.textContent = 'Invalid API key format (should start with sk-ant-)';
            apiKeyStatus.className = 'api-key-status status-error';
            if (window.animations && window.animations.shakeElement) {
                window.animations.shakeElement(apiKeyInput);
            }
        }
    };
    
    window.clearApiKey = function() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiKeyStatus = document.getElementById('api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        window.chatAPI.clearApiKey();
        apiKeyInput.value = '';
        apiKeyStatus.textContent = 'API key cleared';
        apiKeyStatus.className = 'api-key-status';
        window.chatUI.updateEmptyState();
    };
    
    window.clearAnthropicApiKey = function() {
        const apiKeyInput = document.getElementById('anthropic-api-key-input');
        const apiKeyStatus = document.getElementById('anthropic-api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        window.chatAPI.clearAnthropicApiKey();
        apiKeyInput.value = '';
        apiKeyStatus.textContent = 'API key cleared';
        apiKeyStatus.className = 'api-key-status';
        window.chatUI.updateEmptyState();
    };
    
    window.saveModelSelection = function() {
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            window.chatAPI.saveModel(modelSelect.value);
        }
    };
    
    window.setTheme = function(theme) {
        window.chatUI.setTheme(theme);
    };
    
    // Set up event listeners for settings panel
    const saveApiKeyButton = document.getElementById('save-api-key');
    const clearApiKeyButton = document.getElementById('clear-api-key');
    const toggleApiKeyVisibilityButton = document.getElementById('toggle-api-key-visibility');
    const saveAnthropicApiKeyButton = document.getElementById('save-anthropic-api-key');
    const clearAnthropicApiKeyButton = document.getElementById('clear-anthropic-api-key');
    const toggleAnthropicApiKeyVisibilityButton = document.getElementById('toggle-anthropic-api-key-visibility');
    const modelSelect = document.getElementById('model-select');
    const themeLightBtn = document.getElementById('theme-light');
    const themeDarkBtn = document.getElementById('theme-dark');
    const themeSystemBtn = document.getElementById('theme-system');
    
    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', window.saveApiKey);
    }
    
    if (clearApiKeyButton) {
        clearApiKeyButton.addEventListener('click', window.clearApiKey);
    }
    
    if (saveAnthropicApiKeyButton) {
        saveAnthropicApiKeyButton.addEventListener('click', window.saveAnthropicApiKey);
    }
    
    if (clearAnthropicApiKeyButton) {
        clearAnthropicApiKeyButton.addEventListener('click', window.clearAnthropicApiKey);
    }
    
    if (toggleApiKeyVisibilityButton && document.getElementById('api-key-input')) {
        toggleApiKeyVisibilityButton.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                toggleApiKeyVisibilityButton.textContent = '🔒';
            } else {
                apiKeyInput.type = 'password';
                toggleApiKeyVisibilityButton.textContent = '👁️';
            }
        });
    }
    
    if (toggleAnthropicApiKeyVisibilityButton && document.getElementById('anthropic-api-key-input')) {
        toggleAnthropicApiKeyVisibilityButton.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('anthropic-api-key-input');
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                toggleAnthropicApiKeyVisibilityButton.textContent = '🔒';
            } else {
                apiKeyInput.type = 'password';
                toggleAnthropicApiKeyVisibilityButton.textContent = '👁️';
            }
        });
    }
    
    if (modelSelect) {
        modelSelect.addEventListener('change', window.saveModelSelection);
        modelSelect.value = window.chatAPI.getModel();
    }
    
    if (themeLightBtn) {
        themeLightBtn.addEventListener('click', () => window.setTheme('light'));
    }
    
    if (themeDarkBtn) {
        themeDarkBtn.addEventListener('click', () => window.setTheme('dark'));
    }
    
    if (themeSystemBtn) {
        themeSystemBtn.addEventListener('click', () => window.setTheme('system'));
    }
    
    // Initialize theme based on saved preference or system default
    const savedTheme = localStorage.getItem('theme') || 'system';
    window.chatUI.setTheme(savedTheme);
    
    // Add form submission event listener
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            sendMessage(event);
            return false; // Return false to prevent form submission
        });
        
        // Add onsubmit handler as a fallback
        messageForm.onsubmit = function(event) {
            event.preventDefault();
            event.stopPropagation();
            sendMessage(event);
            return false;
        };
    }
    
    // Add event listener for pressing Enter in the input field
    if (userInput) {
        userInput.addEventListener('keypress', (event) => {
            // Send message on Enter, allow Shift+Enter for new line
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                sendMessage(event);
            }
        });
    }
    
    // Check for API key on load and update UI accordingly
    if (window.chatAPI.hasApiKey()) {
        window.chatUI.updateEmptyState();
    } else {
        // Automatically open settings panel if no API key is set
        setTimeout(() => {
            if (settingsContainer) {
                settingsContainer.classList.add('open');
            }
        }, 500);
    }
    
    // Update API key input display if key exists
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKeyStatus = document.getElementById('api-key-status');
    const anthropicApiKeyInput = document.getElementById('anthropic-api-key-input');
    const anthropicApiKeyStatus = document.getElementById('anthropic-api-key-status');
    
    if (apiKeyInput && apiKeyStatus && window.chatAPI.hasApiKey()) {
        apiKeyInput.value = '••••••••••••••••••••••';
        apiKeyStatus.textContent = 'API key is set';
        apiKeyStatus.className = 'api-key-status status-success';
    }
    
    if (anthropicApiKeyInput && anthropicApiKeyStatus && window.chatAPI.hasAnthropicApiKey()) {
        anthropicApiKeyInput.value = '••••••••••••••••••••••';
        anthropicApiKeyStatus.textContent = 'API key is set';
        anthropicApiKeyStatus.className = 'api-key-status status-success';
    }
    
    // Initialize conversations list
    window.chatUI.displayConversations(window.chatAPI.conversations);
    window.chatUI.highlightCurrentConversation(window.chatAPI.currentConversationId);
    
    // Set up event listeners for feature flag changes
    document.addEventListener('feature-flag:changed', (event) => {
        const { flag, value } = event.detail;
        
        // Update UI based on flag changes
        if (flag === 'RESPONSES_API') {
            // Update the toggle if it exists
            if (responsesApiToggle) {
                responsesApiToggle.checked = value;
            }
            
            // Disable web search toggle if Responses API is disabled
            if (webSearchToggle) {
                webSearchToggle.disabled = !value;
                
                // If Responses API is disabled, also disable web search
                if (!value && webSearchToggle.checked) {
                    webSearchToggle.checked = false;
                    window.FeatureFlags.setFlag('WEB_SEARCH', false);
                }
            }
            
            console.log(`Responses API ${value ? 'enabled' : 'disabled'}`);
        } else if (flag === 'WEB_SEARCH') {
            // Update the toggle if it exists
            if (webSearchToggle) {
                webSearchToggle.checked = value;
            }
            
            console.log(`Web Search ${value ? 'enabled' : 'disabled'}`);
        }
    });
    
    // Listen for settings toggle
    const settingsToggle = document.getElementById('settings-toggle');
} 