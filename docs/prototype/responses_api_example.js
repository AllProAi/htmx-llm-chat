/**
 * Example implementation of the OpenAI Responses API
 * 
 * This file provides a working example of how to use the Responses API
 * for our HTMX LLM Chat application. It demonstrates the key functionality
 * including creating conversations, retrieving responses, and handling web search.
 */

// Import necessary dependencies
const OPENAI_API_KEY = localStorage.getItem('openai_api_key');

/**
 * ResponsesAPI class for handling interactions with OpenAI Responses API
 */
class ResponsesAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.openai.com/v1/responses';
    this.model = 'gpt-4o';
  }

  /**
   * Create a new response
   * @param {string|object} input - Message content (text or multimodal)
   * @param {object} options - Additional options
   * @returns {Promise<object>} Response object
   */
  async create(input, options = {}) {
    const {
      model = this.model,
      tools = [],
      temperature = 1.0,
      maxCompletionTokens = null,
      responseFormat = { type: 'text' },
      previousResponseId = null
    } = options;

    // Prepare request payload
    const payload = {
      model,
      input: typeof input === 'string' 
        ? input 
        : Array.isArray(input) 
          ? input 
          : [{ role: 'user', content: [{ type: 'input_text', text: input }] }],
      temperature,
      tools,
      text: {
        format: responseFormat
      }
    };

    // Add optional parameters if provided
    if (maxCompletionTokens) payload.max_completion_tokens = maxCompletionTokens;
    if (previousResponseId) payload.previous_response_id = previousResponseId;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey || OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error creating response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating response:', error);
      throw error;
    }
  }

  /**
   * Retrieve an existing response by ID
   * @param {string} responseId - ID of the response to retrieve
   * @returns {Promise<object>} Response object
   */
  async retrieve(responseId) {
    try {
      const response = await fetch(`${this.endpoint}/${responseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey || OPENAI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error retrieving response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving response:', error);
      throw error;
    }
  }

  /**
   * Continue a conversation from a previous response
   * @param {string} responseId - ID of the previous response
   * @param {string|object} input - New message content
   * @param {object} options - Additional options
   * @returns {Promise<object>} Response object
   */
  async continueConversation(responseId, input, options = {}) {
    return this.create(input, {
      ...options,
      previousResponseId: responseId
    });
  }

  /**
   * Create a response with web search capability
   * @param {string} query - The user's query
   * @param {object} options - Additional options
   * @returns {Promise<object>} Response with web search results
   */
  async searchWeb(query, options = {}) {
    return this.create(query, {
      ...options,
      tools: [{ type: 'web_search' }]
    });
  }
}

/**
 * Example usage of ResponsesAPI
 */
async function exampleUsage() {
  // Initialize the API
  const responsesAPI = new ResponsesAPI();
  let response, continuedResponse, webSearchResponse;

  try {
    // Example 1: Simple conversation
    console.log('Creating a simple response...');
    response = await responsesAPI.create('Tell me a brief joke about programming');
    
    console.log('Response:');
    console.log(response.output[0].content[0].text);
    console.log('\n');

    // Example 2: Continue the conversation
    console.log('Continuing the conversation...');
    continuedResponse = await responsesAPI.continueConversation(
      response.id,
      'Explain why that joke is funny'
    );
    
    console.log('Continued Response:');
    console.log(continuedResponse.output[0].content[0].text);
    console.log('\n');

    // Example 3: Web search
    console.log('Performing a web search...');
    webSearchResponse = await responsesAPI.searchWeb(
      'What are the latest developments in JavaScript frameworks?'
    );
    
    console.log('Web Search Response:');
    // The response will have multiple output items - the search call and the text response
    const searchCall = webSearchResponse.output.find(item => item.type === 'web_search_call');
    const textResponse = webSearchResponse.output.find(item => item.type === 'message');
    
    console.log('Search Call Status:', searchCall.status);
    console.log('Text Response:');
    console.log(textResponse.content[0].text);
    
    // Example 4: Parse and display annotations (citations)
    console.log('\nAnnotations/Citations:');
    const annotations = textResponse.content[0].annotations || [];
    
    if (annotations.length > 0) {
      annotations.forEach((annotation, index) => {
        if (annotation.type === 'url_citation') {
          console.log(`[${index + 1}] ${annotation.title}`);
          console.log(`    URL: ${annotation.url}`);
        }
      });
    } else {
      console.log('No annotations found');
    }

  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Uncomment to run the example
// exampleUsage();

/**
 * Example of implementing a streaming response
 * Note: The current Responses API doesn't support streaming directly,
 * but we can implement polling to achieve a similar effect
 */
class StreamingResponsesAPI extends ResponsesAPI {
  /**
   * Create a streaming response using polling
   * @param {string|object} input - Message content
   * @param {object} options - Additional options
   * @param {function} onProgress - Callback for progress updates
   * @returns {Promise<object>} Final response
   */
  async createStreaming(input, options = {}, onProgress) {
    // Create the initial response
    const response = await this.create(input, options);
    
    // Set up polling to check for updates
    return this.pollForCompletion(response.id, onProgress);
  }
  
  /**
   * Poll for response completion
   * @param {string} responseId - ID of the response to poll
   * @param {function} onProgress - Callback for progress updates
   * @returns {Promise<object>} Final response
   */
  async pollForCompletion(responseId, onProgress) {
    const pollInterval = 500; // ms
    let isComplete = false;
    let finalResponse;
    
    while (!isComplete) {
      // Retrieve the current state of the response
      const response = await this.retrieve(responseId);
      
      // Check if all outputs are complete
      const allComplete = response.output.every(item => 
        item.type === 'message' || (item.status && item.status === 'completed')
      );
      
      isComplete = allComplete;
      
      // Call the progress callback
      if (onProgress && typeof onProgress === 'function') {
        onProgress(response);
      }
      
      if (isComplete) {
        finalResponse = response;
        break;
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    return finalResponse;
  }
}

/**
 * Example of using the streaming API
 */
async function streamingExample() {
  const streamingAPI = new StreamingResponsesAPI();
  
  try {
    console.log('Starting streaming response...');
    
    // Define progress handler
    const onProgress = (response) => {
      console.clear();
      console.log('Current response state:');
      
      response.output.forEach(item => {
        if (item.type === 'message' && item.content && item.content.length > 0) {
          console.log(item.content[0].text);
        } else if (item.type.includes('_call')) {
          console.log(`Tool call: ${item.type} - Status: ${item.status}`);
        }
      });
    };
    
    // Create streaming response with web search
    const finalResponse = await streamingAPI.createStreaming(
      'What is the current status of OpenAI APIs?',
      { tools: [{ type: 'web_search' }] },
      onProgress
    );
    
    console.log('\nFinal response complete!');
    
  } catch (error) {
    console.error('Error in streaming example:', error);
  }
}

// Uncomment to run the streaming example
// streamingExample();

// Export the classes for use in other files
export { ResponsesAPI, StreamingResponsesAPI }; 