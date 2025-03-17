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
    }

    /**
     * Send a message using the Responses API
     * @param {string} message - The message to send
     * @param {string} model - The model to use
     * @param {Array} history - The conversation history
     * @param {string} conversationId - The current conversation ID
     * @param {Function} onProgress - Callback for streaming progress
     * @param {Function} onComplete - Callback when the response is complete
     * @param {Function} onError - Callback for errors
     * @param {boolean} useWebSearch - Whether to use web search capability
     */
    async sendMessage(message, model, history, conversationId, onProgress, onComplete, onError, useWebSearch = false) {
        try {
            // Create a new AbortController for this request
            this.controller = new AbortController();
            const signal = this.controller.signal;

            // Prepare the request body
            const body = {
                model: model,
                input: message,
                temperature: 0.7
            };

            // Add previous response ID if available
            const previousResponseId = this.getPreviousResponseId(conversationId);
            if (previousResponseId) {
                body.previous_response_id = previousResponseId;
            }

            // Add tools if web search is enabled
            if (useWebSearch) {
                body.tools = [{ type: "web_search" }];
            }

            // Send the request to the OpenAI Responses API
            const response = await fetch(this.responsesEndpoint, {
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

            const responseData = await response.json();
            
            // Save the response ID for future continuations
            if (responseData.id) {
                this.saveResponseId(conversationId, responseData.id);
            }

            // Extract the text content from the response
            let responseText = this.extractTextFromResponse(responseData);
            
            // Check for citations/annotations and format them
            const formattedResponse = this.formatResponseWithCitations(responseData);
            
            // Call the onComplete callback with the response
            onComplete(formattedResponse, responseData);
            
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
            citations: []
        };
        
        if (responseData.output && Array.isArray(responseData.output)) {
            for (const item of responseData.output) {
                // Skip web search call entries
                if (item.type === 'web_search_call') continue;
                
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
                                            url: annotation.url || ''
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
     * Get the API key from localStorage
     * @returns {string} The API key
     */
    getApiKey() {
        return localStorage.getItem('openai_api_key') || '';
    }
}

// Export the ResponseAPI class
window.ResponseAPI = ResponseAPI; 