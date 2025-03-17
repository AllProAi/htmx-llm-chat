/**
 * Motion LLM Chat - Main
 * Initializes the application and connects all components
 */

// Handler for message submission
function sendMessage(event) {
    // Prevent form submission
    if (event) event.preventDefault();
    
    // Get the user's message
    const message = userInput.value.trim();
    
    // Don't send empty messages
    if (!message) return;
    
    // Get selected model and provider
    const model = chatAPI.getModel();
    const isAnthropicModel = model.startsWith('claude-');
    
    // Check if the appropriate API key is set
    if (isAnthropicModel && !chatAPI.hasAnthropicApiKey()) {
        chatUI.showError('Please enter your Anthropic API key in the settings panel.');
        
        // Open settings panel if it's not already open
        if (!settingsContainer.classList.contains('open')) {
            settingsContainer.classList.add('open');
        }
        
        return;
    } else if (!isAnthropicModel && !chatAPI.hasApiKey()) {
        chatUI.showError('Please enter your OpenAI API key in the settings panel.');
        
        // Open settings panel if it's not already open
        if (!settingsContainer.classList.contains('open')) {
            settingsContainer.classList.add('open');
        }
        
        return;
    }
    
    // Set loading state
    chatUI.setLoadingState(true);
    
    // Add user message to the chat
    chatUI.addUserMessage(message);
    
    // Clear the input
    chatUI.clearInput();
    
    // Show typing indicator
    chatUI.showTypingIndicator();
    
    // Initialize AI response element
    let aiMessageElement = null;
    
    // Send the message to the API
    chatAPI.sendMessage(
        message,
        // onChunk handler - called for each chunk of the streamed response
        (chunk) => {
            // Create the AI message element on first chunk if it doesn't exist
            if (!aiMessageElement) {
                // Remove typing indicator
                chatUI.removeTypingIndicator();
                
                // Add empty AI message
                aiMessageElement = chatUI.createMessageElement('ai', '');
                chatMessages.appendChild(aiMessageElement);
                chatUI.scrollToBottom();
            }
            
            // Append the chunk to the message content
            const contentElement = aiMessageElement.querySelector('.message-content');
            
            // If the content includes code blocks, we need to re-render the entire message
            if (chunk.includes('```') || contentElement.innerHTML.includes('<pre>')) {
                // Get the current text plus the new chunk
                const fullText = contentElement.textContent + chunk;
                
                // Format and set the content
                contentElement.innerHTML = chatUI.formatCodeBlocks(fullText);
            } else {
                // Just append the text
                contentElement.textContent += chunk;
            }
            
            // Scroll to bottom with each chunk
            chatUI.scrollToBottom();
        },
        // onComplete handler - called when the entire response is received
        (fullResponse) => {
            // Remove loading state
            chatUI.setLoadingState(false);
        },
        // onError handler - called on error
        (error) => {
            // Remove typing indicator
            chatUI.removeTypingIndicator();
            
            // Show error message
            chatUI.showError(error);
            
            // Remove loading state
            chatUI.setLoadingState(false);
        }
    );
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize API and UI
    chatAPI = new ChatAPI();
    chatUI = new ChatUI();
    
    // Get DOM elements
    settingsContainer = document.getElementById('settings-container');
    userInput = document.getElementById('user-input');
    
    // Initialize responses API toggle if present
    responsesApiToggle = document.getElementById('toggle-responses-api');
    if (responsesApiToggle) {
        responsesApiToggle.checked = chatAPI.useResponsesAPI();
    }
    
    // Initialize web search toggle if present
    webSearchToggle = document.getElementById('toggle-web-search');
    if (webSearchToggle) {
        webSearchToggle.checked = chatAPI.useWebSearch();
        
        // Web search should only be enabled if Responses API is enabled
        webSearchToggle.disabled = !chatAPI.useResponsesAPI();
    }
    
    // Initialize UI with conversation history
    chatUI.initializeUI();
    
    // Set up global variables for easy access in event handlers
    window.chatMessages = document.getElementById('chat-messages');
    window.settingsContainer = document.getElementById('settings-container');
    
    // Set the current conversation title
    const conversationTitle = document.getElementById('conversation-title');
    if (conversationTitle) {
        const currentConversation = chatAPI.getCurrentConversation();
        if (currentConversation) {
            conversationTitle.textContent = currentConversation.title;
        }
    }
    
    // Load messages from current conversation
    chatUI.loadConversation(chatAPI.currentConversationId);
    
    // Set global handler for sending messages
    window.sendMessage = sendMessage;
    
    // Setup settings panel toggle
    const toggleSettingsButton = document.getElementById('toggle-settings-button');
    const closeSettingsButton = document.getElementById('close-settings-button');
    
    if (toggleSettingsButton) {
        toggleSettingsButton.addEventListener('click', () => {
            settingsContainer.classList.add('open');
            document.body.classList.add('settings-open');
        });
    }
    
    if (closeSettingsButton) {
        closeSettingsButton.addEventListener('click', () => {
            settingsContainer.classList.remove('open');
            document.body.classList.remove('settings-open');
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
    settingsContainer.addEventListener('click', (event) => {
        event.stopPropagation();
    });
    
    // Set up API key-related functions
    window.saveApiKey = function() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiKeyStatus = document.getElementById('api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        const key = apiKeyInput.value.trim();
        
        if (key === '••••••••••••••••••••••') {
            apiKeyStatus.textContent = 'Please enter a new API key';
            apiKeyStatus.className = 'api-key-status status-error';
            animations.shakeElement(apiKeyInput);
            return;
        }
        
        if (chatAPI.saveApiKey(key)) {
            apiKeyInput.value = '••••••••••••••••••••••';
            apiKeyStatus.textContent = 'API key saved successfully';
            apiKeyStatus.className = 'api-key-status status-success';
            chatUI.updateEmptyState();
        } else {
            apiKeyStatus.textContent = 'Invalid API key format';
            apiKeyStatus.className = 'api-key-status status-error';
            animations.shakeElement(apiKeyInput);
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
            animations.shakeElement(apiKeyInput);
            return;
        }
        
        if (chatAPI.saveAnthropicApiKey(key)) {
            apiKeyInput.value = '••••••••••••••••••••••';
            apiKeyStatus.textContent = 'API key saved successfully';
            apiKeyStatus.className = 'api-key-status status-success';
            chatUI.updateEmptyState();
        } else {
            apiKeyStatus.textContent = 'Invalid API key format (should start with sk-ant-)';
            apiKeyStatus.className = 'api-key-status status-error';
            animations.shakeElement(apiKeyInput);
        }
    };
    
    window.clearApiKey = function() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiKeyStatus = document.getElementById('api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        chatAPI.clearApiKey();
        apiKeyInput.value = '';
        apiKeyStatus.textContent = 'API key cleared';
        apiKeyStatus.className = 'api-key-status';
        chatUI.updateEmptyState();
    };
    
    window.clearAnthropicApiKey = function() {
        const apiKeyInput = document.getElementById('anthropic-api-key-input');
        const apiKeyStatus = document.getElementById('anthropic-api-key-status');
        
        if (!apiKeyInput || !apiKeyStatus) return;
        
        chatAPI.clearAnthropicApiKey();
        apiKeyInput.value = '';
        apiKeyStatus.textContent = 'API key cleared';
        apiKeyStatus.className = 'api-key-status';
        chatUI.updateEmptyState();
    };
    
    window.saveModelSelection = function() {
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            chatAPI.saveModel(modelSelect.value);
        }
    };
    
    window.setTheme = function(theme) {
        chatUI.setTheme(theme);
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
        modelSelect.value = chatAPI.getModel();
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
    chatUI.setTheme(savedTheme);
    
    // Add form submission event listener
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            sendMessage(event);
        });
    }
    
    // Add event listener for pressing Enter in the input field
    if (userInput) {
        userInput.addEventListener('keypress', (event) => {
            // Send message on Enter, allow Shift+Enter for new line
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Check for API key on load and update UI accordingly
    if (chatAPI.hasApiKey()) {
        chatUI.updateEmptyState();
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
    
    if (apiKeyInput && apiKeyStatus && chatAPI.hasApiKey()) {
        apiKeyInput.value = '••••••••••••••••••••••';
        apiKeyStatus.textContent = 'API key is set';
        apiKeyStatus.className = 'api-key-status status-success';
    }
    
    if (anthropicApiKeyInput && anthropicApiKeyStatus && chatAPI.hasAnthropicApiKey()) {
        anthropicApiKeyInput.value = '••••••••••••••••••••••';
        anthropicApiKeyStatus.textContent = 'API key is set';
        anthropicApiKeyStatus.className = 'api-key-status status-success';
    }
});

/**
 * Toggle the Responses API
 * @param {boolean} enabled - Whether to enable the Responses API
 */
function toggleResponsesAPI(enabled) {
    chatAPI.setUseResponsesAPI(enabled);
    
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
    chatUI.showNotification(
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
    chatAPI.setUseWebSearch(enabled);
    
    // Show notification
    chatUI.showNotification(
        enabled ? 
        'Web search enabled. The AI can now search the web for up-to-date information.' : 
        'Web search disabled.'
    );
}

// Expose functions to window object
window.toggleResponsesAPI = toggleResponsesAPI;
window.toggleWebSearch = toggleWebSearch; 