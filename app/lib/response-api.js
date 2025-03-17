/**
 * Motion LLM Chat - ResponseAPI Integration
 * Handles communication with OpenAI's Responses API
 */

class ResponseAPI {
    constructor() {
        this.responsesEndpoint = 'https://api.openai.com/v1/responses';
        this.controller = null; // AbortController for cancelling requests
        this.currentResponseId = null; // Current response ID for stateful conversations
        this.previousResponseIds = {}; // Map of conversation IDs to their latest response IDs
    }

    /**
     * Get the previous response ID for the current conversation
     * @param {string} conversationId - The conversation ID
     * @returns {string|null} - The previous response ID or null
     */
    getPreviousResponseId(conversationId) {
        return this.previousResponseIds[conversationId] || null;
    }

    /**
     * Save the response ID for a conversation
     * @param {string} conversationId - The conversation ID
     * @param {string} responseId - The response ID to save
     */
    saveResponseId(conversationId, responseId) {
        this.previousResponseIds[conversationId] = responseId;
        // Also save to localStorage for persistence across sessions
        try {
            const savedIds = JSON.parse(localStorage.getItem('response_ids') || '{}');
            savedIds[conversationId] = responseId;
            localStorage.setItem('response_ids', JSON.stringify(savedIds));
        } catch (error) {
            console.error('Failed to save response ID:', error);
        }
    }

    /**
     * Load saved response IDs from localStorage
     */
    loadSavedResponseIds() {
        try {
            const savedIds = JSON.parse(localStorage.getItem('response_ids') || '{}');
            this.previousResponseIds = savedIds;
        } catch (error) {
            console.error('Failed to load response IDs:', error);
            this.previousResponseIds = {};
        }
    }

    /**
     * Create a new conversation with the Responses API
     * @param {string} message - The initial message
     * @param {string} model - The model to use (e.g., 'gpt-4o')
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - The API response
     */
    async create(message, model, options = {}) {
        const body = {
            model: model || 'gpt-4o',
            input: message,
            temperature: options.temperature || 0.7
        };

        // Add tools if web search is enabled
        if (options.useWebSearch) {
            body.tools = [{ type: "web_search" }];
        }

        const response = await fetch(this.responsesEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getApiKey()}`
            },
            body: JSON.stringify(body),
            signal: options.signal
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Retrieve an existing response by ID
     * @param {string} responseId - The response ID to retrieve
     * @returns {Promise<Object>} - The API response
     */
    async retrieve(responseId) {
        const response = await fetch(`${this.responsesEndpoint}/${responseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.getApiKey()}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Continue a conversation using a previous response ID
     * @param {string} responseId - The previous response ID
     * @param {string} message - The new message
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - The API response
     */
    async continueConversation(responseId, message, options = {}) {
        const body = {
            model: options.model || 'gpt-4o',
            input: message,
            previous_response_id: responseId,
            temperature: options.temperature || 0.7
        };

        // Add tools if web search is enabled
        if (options.useWebSearch) {
            body.tools = [{ type: "web_search" }];
        }

        // Send the request
        const response = await fetch(this.responsesEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getApiKey()}`
            },
            body: JSON.stringify(body),
            signal: options.signal
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Send a message using the Responses API
     * @param {string} message - The message to send
     * @param {string} model - The model to use (e.g., 'gpt-4o')
     * @param {Array} history - The conversation history
     * @param {string} conversationId - The conversation ID
     * @param {Function} onProgress - Callback for streaming progress
     * @param {Function} onComplete - Callback when complete
     * @param {Function} onError - Callback for errors
     * @param {boolean} useWebSearch - Whether to enable web search
     * @returns {Promise<void>} - Promise that resolves when the request is complete
     */
    async sendMessage(message, model, history, conversationId, onProgress, onComplete, onError, useWebSearch = false) {
        try {
            // Cancel any existing requests
            this.cancelRequest();
            
            // Create a new AbortController for this request
            this.controller = new AbortController();
            
            // Check if web search is enabled in feature flags
            const webSearchEnabled = FeatureFlags.isEnabled('WEB_SEARCH');
            
            // Only use web search if both the parameter is true and the feature flag is enabled
            const shouldUseWebSearch = useWebSearch && webSearchEnabled;
            
            // Check if we're continuing a conversation
            const previousResponseId = this.getPreviousResponseId(conversationId);
            
            let response;
            
            if (previousResponseId) {
                // Continue the existing conversation
                response = await this.continueConversation(previousResponseId, message, {
                    model: model,
                    useWebSearch: shouldUseWebSearch,
                    signal: this.controller.signal
                });
            } else {
                // Start a new conversation
                response = await this.create(message, model, {
                    useWebSearch: shouldUseWebSearch,
                    signal: this.controller.signal
                });
            }
            
            // Save the response ID for future continuations
            if (response.id) {
                this.saveResponseId(conversationId, response.id);
            }

            // Extract the text content from the response
            let responseText = this.extractTextFromResponse(response);
            
            // Check for citations/annotations and format them
            const formattedResponse = this.formatResponseWithCitations(response);
            
            // Call the onComplete callback with the response
            onComplete(formattedResponse, response);
            
        } catch (error) {
            // Don't report errors from aborted requests
            if (error.name === 'AbortError') return;
            
            console.error('Responses API Request failed:', error);
            onError(error.message || 'An error occurred while communicating with the Responses API.');
        } finally {
            this.controller = null;
        }
    }

    /**
     * Cancel the current request
     */
    cancelRequest() {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }

    /**
     * Extract text from a Responses API response
     * @param {Object} responseData - The response data from the API
     * @returns {string} - The extracted text
     */
    extractTextFromResponse(responseData) {
        let text = '';
        
        if (responseData.output && Array.isArray(responseData.output)) {
            for (const item of responseData.output) {
                if (item.type === 'message' && item.content) {
                    for (const content of item.content) {
                        if (content.type === 'output_text' && content.text) {
                            text += content.text;
                        }
                    }
                }
            }
        }
        
        return text;
    }

    /**
     * Format a response with citations from web search
     * @param {Object} responseData - The response data from the API
     * @returns {Object} - The formatted response with citations
     */
    formatResponseWithCitations(responseData) {
        let formattedResponse = {
            text: '',
            citations: [],
            webSearchResults: []
        };
        
        if (responseData.output && Array.isArray(responseData.output)) {
            // First, check for web search results
            const webSearchCalls = responseData.output.filter(item => item.type === 'web_search_call');
            if (webSearchCalls.length > 0) {
                formattedResponse.hasWebSearch = true;
            }
            
            for (const item of responseData.output) {
                // Extract web search results if available
                if (item.type === 'web_search_call' && item.web_search) {
                    const searchResults = item.web_search?.results || [];
                    formattedResponse.webSearchResults = searchResults.map(result => ({
                        title: result.title || '',
                        url: result.url || '',
                        snippet: result.snippet || ''
                    }));
                }
                
                // Extract message content
                if (item.type === 'message' && item.content) {
                    for (const content of item.content) {
                        if (content.type === 'output_text') {
                            formattedResponse.text += content.text || '';
                            
                            // Extract citations if they exist
                            if (content.annotations && Array.isArray(content.annotations)) {
                                for (const annotation of content.annotations) {
                                    if (annotation.type === 'url_citation') {
                                        formattedResponse.citations.push({
                                            title: annotation.title || '',
                                            url: annotation.url || '',
                                            text: content.text.substring(
                                                annotation.start_index || 0,
                                                annotation.end_index || content.text.length
                                            )
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return formattedResponse;
    }

    /**
     * Get the API key for authentication
     * @returns {string} - The API key
     */
    getApiKey() {
        // Use the API key from the ChatAPI for consistency
        if (window.chatAPI && typeof window.chatAPI.getApiKey === 'function') {
            return window.chatAPI.getApiKey();
        }
        
        // Fallback to localStorage if ChatAPI is not available
        return localStorage.getItem('openai_api_key') || '';
    }

    /**
     * Initialize the ResponseAPI
     */
    init() {
        this.loadSavedResponseIds();
    }
}

// Initialize and export the ResponseAPI class
window.ResponseAPI = ResponseAPI; 