/**
 * Motion LLM Chat - API Utilities
 * Handles communication with OpenAI and Anthropic APIs
 */

class ChatAPI {
    constructor() {
        this.openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.anthropicEndpoint = 'https://api.anthropic.com/v1/messages';
        this.whisperEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
        this.controller = null; // AbortController for cancelling requests
        
        // Conversation management
        this.conversations = this.loadConversations();
        this.currentConversationId = this.loadCurrentConversationId();
        
        // Initialize with a default conversation if needed
        if (Object.keys(this.conversations).length === 0 || !this.conversations[this.currentConversationId]) {
            this.createNewConversation('New Chat');
        }
    }

    // Conversation management methods
    
    /**
     * Create a new conversation
     * @param {string} title - The title of the conversation
     * @returns {string} The ID of the new conversation
     */
    createNewConversation(title = 'New Chat') {
        const id = 'conv_' + Date.now();
        this.conversations[id] = {
            id: id,
            title: title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.saveConversations();
        this.setCurrentConversation(id);
        return id;
    }
    
    /**
     * Set the current conversation
     * @param {string} id - The ID of the conversation to set as current
     */
    setCurrentConversation(id) {
        if (this.conversations[id]) {
            this.currentConversationId = id;
            localStorage.setItem('current_conversation_id', id);
        }
    }
    
    /**
     * Get the current conversation
     * @returns {Object} The current conversation
     */
    getCurrentConversation() {
        return this.conversations[this.currentConversationId];
    }
    
    /**
     * Get the current conversation history
     * @returns {Array} The messages in the current conversation
     */
    get conversationHistory() {
        return this.getCurrentConversation()?.messages || [];
    }
    
    /**
     * Set conversation history for the current conversation
     * @param {Array} messages - The messages to set
     */
    set conversationHistory(messages) {
        if (this.getCurrentConversation()) {
            this.getCurrentConversation().messages = messages;
            this.getCurrentConversation().updatedAt = new Date().toISOString();
            this.saveConversations();
        }
    }
    
    /**
     * Update conversation title
     * @param {string} id - The conversation ID
     * @param {string} title - The new title
     */
    updateConversationTitle(id, title) {
        if (this.conversations[id]) {
            this.conversations[id].title = title;
            this.conversations[id].updatedAt = new Date().toISOString();
            this.saveConversations();
        }
    }
    
    /**
     * Delete a conversation
     * @param {string} id - The ID of the conversation to delete
     * @returns {boolean} Whether the deletion was successful
     */
    deleteConversation(id) {
        if (!this.conversations[id]) return false;
        
        // Delete the conversation
        delete this.conversations[id];
        this.saveConversations();
        
        // If we deleted the current conversation, select another one
        if (id === this.currentConversationId) {
            const conversationIds = Object.keys(this.conversations);
            if (conversationIds.length > 0) {
                this.setCurrentConversation(conversationIds[0]);
            } else {
                // Create a new one if there are no conversations left
                this.createNewConversation('New Chat');
            }
        }
        
        return true;
    }
    
    /**
     * Save conversations to localStorage
     */
    saveConversations() {
        try {
            localStorage.setItem('conversations', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('Failed to save conversations:', error);
        }
    }
    
    /**
     * Load conversations from localStorage
     * @returns {Object} The loaded conversations or an empty object
     */
    loadConversations() {
        try {
            const saved = localStorage.getItem('conversations');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load conversations:', error);
            return {};
        }
    }
    
    /**
     * Load current conversation ID from localStorage
     * @returns {string} The current conversation ID or null
     */
    loadCurrentConversationId() {
        return localStorage.getItem('current_conversation_id');
    }

    /**
     * Get the OpenAI API key from localStorage
     * @returns {string|null} The API key or null if not set
     */
    getApiKey() {
        return localStorage.getItem('openai_api_key');
    }

    /**
     * Get the Anthropic API key from localStorage
     * @returns {string|null} The API key or null if not set
     */
    getAnthropicApiKey() {
        return localStorage.getItem('anthropic_api_key');
    }

    /**
     * Save the OpenAI API key to localStorage
     * @param {string} key - The API key to save
     * @returns {boolean} Whether the key was saved successfully
     */
    saveApiKey(key) {
        if (!key || !key.startsWith('sk-')) {
            return false;
        }
        
        try {
            localStorage.setItem('openai_api_key', key);
            return true;
        } catch (error) {
            console.error('Failed to save API key:', error);
            return false;
        }
    }

    /**
     * Save the Anthropic API key to localStorage
     * @param {string} key - The API key to save
     * @returns {boolean} Whether the key was saved successfully
     */
    saveAnthropicApiKey(key) {
        if (!key || !key.startsWith('sk-ant-')) {
            return false;
        }
        
        try {
            localStorage.setItem('anthropic_api_key', key);
            return true;
        } catch (error) {
            console.error('Failed to save Anthropic API key:', error);
            return false;
        }
    }

    /**
     * Clear the OpenAI API key from localStorage
     */
    clearApiKey() {
        localStorage.removeItem('openai_api_key');
    }

    /**
     * Clear the Anthropic API key from localStorage
     */
    clearAnthropicApiKey() {
        localStorage.removeItem('anthropic_api_key');
    }

    /**
     * Check if an OpenAI API key is saved
     * @returns {boolean} Whether an API key is saved
     */
    hasApiKey() {
        const key = this.getApiKey();
        return !!key && key.startsWith('sk-');
    }

    /**
     * Check if an Anthropic API key is saved
     * @returns {boolean} Whether an API key is saved
     */
    hasAnthropicApiKey() {
        const key = this.getAnthropicApiKey();
        return !!key && key.startsWith('sk-ant-');
    }

    /**
     * Check if the required API key is available for the selected model
     * @returns {boolean} Whether the required API key is available
     */
    hasRequiredApiKey() {
        const model = this.getModel();
        if (model.startsWith('claude-')) {
            return this.hasAnthropicApiKey();
        } else {
            return this.hasApiKey();
        }
    }

    /**
     * Get the selected model from localStorage
     * @returns {string} The selected model or default gpt-3.5-turbo
     */
    getModel() {
        return localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
    }

    /**
     * Save the selected model to localStorage
     * @param {string} model - The model to save
     */
    saveModel(model) {
        localStorage.setItem('ai_model', model);
    }

    /**
     * Get the API provider for the current model
     * @returns {string} 'openai' or 'anthropic'
     */
    getProvider() {
        const model = this.getModel();
        return model.startsWith('claude-') ? 'anthropic' : 'openai';
    }

    /**
     * Add a message to the conversation history
     * @param {string} role - The role of the message (user or assistant)
     * @param {string} content - The content of the message
     */
    addMessageToHistory(role, content) {
        const conversation = this.getCurrentConversation();
        if (!conversation) return;
        
        conversation.messages.push({ role, content });
        conversation.updatedAt = new Date().toISOString();
        
        // If this is the first user message, try to generate a title
        if (role === 'user' && conversation.messages.length === 1) {
            this.updateConversationTitle(conversation.id, this.generateTitleFromMessage(content));
        }
        
        // Limit history length to prevent token limits
        if (conversation.messages.length > 100) {
            // Remove oldest messages, but keep the system prompt if any
            const systemPrompt = conversation.messages.find(msg => msg.role === 'system');
            conversation.messages = conversation.messages.slice(-100);
            
            if (systemPrompt && conversation.messages[0].role !== 'system') {
                conversation.messages.unshift(systemPrompt);
            }
        }
        
        this.saveConversations();
    }

    /**
     * Generate a title from the first message
     * @param {string} message - The message to generate a title from
     * @returns {string} The generated title
     */
    generateTitleFromMessage(message) {
        // Truncate to the first 30 characters or the first sentence, whichever is shorter
        const firstSentence = message.split(/[.!?]/)[0];
        const title = firstSentence.length > 30 ? firstSentence.substring(0, 30) + '...' : firstSentence;
        return title || 'New Chat';
    }

    /**
     * Clear the conversation history
     */
    clearConversation() {
        this.createNewConversation('New Chat');
    }

    /**
     * Cancel any ongoing request
     */
    cancelRequest() {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }

    /**
     * Send a message to the selected AI API
     * @param {string} message - The message to send
     * @param {Function} onChunk - Callback for each chunk of the response
     * @param {Function} onComplete - Callback when the response is complete
     * @param {Function} onError - Callback for errors
     */
    async sendMessage(message, onChunk, onComplete, onError) {
        const provider = this.getProvider();
        const model = this.getModel();
        
        if (provider === 'openai' && !this.hasApiKey()) {
            onError('No OpenAI API key provided. Please add your OpenAI API key in settings.');
            return;
        } else if (provider === 'anthropic' && !this.hasAnthropicApiKey()) {
            onError('No Anthropic API key provided. Please add your Anthropic API key in settings.');
            return;
        } else if (provider === 'anthropic') {
            onError('The Anthropic API cannot be called directly from the browser due to CORS restrictions. Please select an OpenAI model or deploy a backend proxy server.');
            return;
        }

        // Add user message to history
        this.addMessageToHistory('user', message);

        // Create a new AbortController for this request
        this.controller = new AbortController();
        const signal = this.controller.signal;

        try {
            if (provider === 'openai') {
                await this.sendOpenAIMessage(message, onChunk, onComplete, onError, signal);
            } else {
                await this.sendAnthropicMessage(message, onChunk, onComplete, onError, signal);
            }
        } catch (error) {
            // Don't report errors from aborted requests
            if (error.name === 'AbortError') return;
            
            console.error(`${provider.toUpperCase()} API Request failed:`, error);
            onError(error.message || `An error occurred while communicating with the ${provider.toUpperCase()} API.`);
        } finally {
            this.controller = null;
        }
    }

    /**
     * Send a message to the OpenAI API
     * @private
     */
    async sendOpenAIMessage(message, onChunk, onComplete, onError, signal) {
        // Prepare the request body
        const body = {
            model: this.getModel(),
            messages: [
                // Add a system message for better context
                { role: 'system', content: 'You are a helpful assistant. Provide concise and accurate responses.' },
                ...this.conversationHistory
            ],
            temperature: 0.7,
            stream: true // Enable streaming for real-time responses
        };

        // Send the request to the OpenAI API
        const response = await fetch(this.openaiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getApiKey()}`
            },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }

        // Process the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            // Decode the chunk and process it
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                // Skip empty lines or the SSE "data: " prefix
                if (!line.trim() || !line.startsWith('data: ')) continue;
                
                // Skip the "[DONE]" marker
                if (line.includes('[DONE]')) continue;
                
                try {
                    // Parse the JSON payload
                    const json = JSON.parse(line.replace(/^data: /, ''));
                    const { choices } = json;
                    const { delta } = choices[0];
                    const { content } = delta;
                    
                    // Process content if available
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                } catch (err) {
                    console.error('Error parsing chunk:', err, line);
                }
            }
        }

        // Add the complete AI response to history
        this.addMessageToHistory('assistant', fullResponse);
        onComplete(fullResponse);
    }

    /**
     * Send a message to the Anthropic API
     * @private
     */
    async sendAnthropicMessage(message, onChunk, onComplete, onError, signal) {
        // Convert conversation history to Anthropic format
        const messages = [];
        for (const msg of this.conversationHistory) {
            if (msg.role === 'system') continue; // Skip system messages for Anthropic
            
            // Map OpenAI roles to Anthropic roles
            const role = msg.role === 'assistant' ? 'assistant' : 'user';
            messages.push({ role, content: msg.content });
        }

        // Prepare the request body
        const body = {
            model: this.getModel(),
            messages: messages,
            system: "You are a helpful assistant. Provide concise and accurate responses.",
            max_tokens: 4096,
            temperature: 0.7,
            stream: true
        };

        // Send the request to the Anthropic API
        const response = await fetch(this.anthropicEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.getAnthropicApiKey(),
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }

        // Process the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            // Decode the chunk and process it
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                // Skip empty lines or the SSE "data: " prefix
                if (!line.trim() || !line.startsWith('data: ')) continue;
                
                // Skip the "[DONE]" marker
                if (line.includes('[DONE]')) continue;
                
                try {
                    // Parse the JSON payload
                    const json = JSON.parse(line.replace(/^data: /, ''));
                    
                    if (json.type === 'content_block_delta' && json.delta && json.delta.text) {
                        const content = json.delta.text;
                        fullResponse += content;
                        onChunk(content);
                    }
                } catch (err) {
                    console.error('Error parsing chunk:', err, line);
                }
            }
        }

        // Add the complete AI response to history
        this.addMessageToHistory('assistant', fullResponse);
        onComplete(fullResponse);
    }

    /**
     * Transcribe audio using OpenAI's Whisper API
     * @param {Blob} audioBlob - The audio blob to transcribe
     * @param {Function} onSuccess - Callback with the transcribed text
     * @param {Function} onError - Callback for errors
     */
    async transcribeAudio(audioBlob, onSuccess, onError) {
        if (!this.hasApiKey()) {
            onError('No OpenAI API key provided. Please add your OpenAI API key in settings.');
            return;
        }

        try {
            // Prepare form data for the request
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', 'en'); // You can make this configurable
            
            // Send the request to the Whisper API
            const response = await fetch(this.whisperEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            onSuccess(data.text);
        } catch (error) {
            console.error('Whisper API Request failed:', error);
            onError(error.message || 'An error occurred while transcribing audio.');
        }
    }
}

// Create and export a singleton instance
const chatAPI = new ChatAPI(); 