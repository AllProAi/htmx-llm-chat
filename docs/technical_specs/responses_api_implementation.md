# Responses API Implementation Specifications

## Architecture Overview

![Architecture Diagram](../assets/responses_api_architecture.png)

This document provides technical specifications for implementing the OpenAI Responses API in our HTMX LLM Chat application.

## API Interface

### ResponsesAPI Class

```javascript
class ResponsesAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.openai.com/v1/responses';
    this.model = 'gpt-4o';
  }

  async create(input, options = {}) {
    // Implementation details
  }

  async retrieve(responseId) {
    // Implementation details
  }

  async continueConversation(responseId, input, options = {}) {
    // Implementation details
  }
}
```

### Key Methods

#### create(input, options)

Creates a new response using the Responses API.

**Parameters:**
- `input`: String or array of content objects (for multimodal)
- `options`: Object containing optional parameters
  - `model`: String (default: 'gpt-4o')
  - `tools`: Array of tool objects
  - `temperature`: Number (0-2)
  - `maxCompletionTokens`: Number
  - `responseFormat`: Object

**Returns:**
- Promise resolving to a Response object

#### retrieve(responseId)

Retrieves an existing response by ID.

**Parameters:**
- `responseId`: String - The ID of the response to retrieve

**Returns:**
- Promise resolving to a Response object

#### continueConversation(responseId, input, options)

Continues an existing conversation.

**Parameters:**
- `responseId`: String - The ID of the previous response
- `input`: String or array of content objects
- `options`: Object containing optional parameters

**Returns:**
- Promise resolving to a Response object

## Data Models

### Response Object

```javascript
{
  id: String,
  created_at: Number,
  model: String,
  object: "response",
  output: Array<OutputItem>,
  usage: {
    completion_tokens: Number,
    prompt_tokens: Number,
    total_tokens: Number
  }
}
```

### OutputItem Object

Can be a message or a tool call:

```javascript
// Message
{
  id: String,
  content: Array<ContentItem>,
  role: "assistant",
  type: "message"
}

// Tool Call
{
  id: String,
  status: "completed" | "error",
  type: "web_search_call" | "file_search_call"
}
```

### ContentItem Object

```javascript
{
  text: String,
  type: "output_text",
  annotations: Array<Annotation>
}
```

## UI Components

### New Components

1. **WebSearchResults**
   - Displays search results from web_search tool
   - Renders citations and links

2. **ImageUploader**
   - Allows users to upload images to be included in prompts
   - Handles preview and removal

3. **ResponseStateIndicator**
   - Shows the state of the response (in progress, completed, error)

### Modified Components

1. **ChatMessage**
   - Enhanced to display annotations and citations
   - Support for rendered markdown with web links

2. **ConversationHistory**
   - Updated to work with server-side state
   - Add forking capability

## Integration with Existing Code

### Changes to api.js

```javascript
// Add the new ResponsesAPI class
// Maintain the existing ChatAPI class for backward compatibility
// Add a facade that selects the appropriate implementation
```

### Changes to main.js

```javascript
// Update sendMessage function to use ResponsesAPI
// Add support for multimodal inputs
// Handle tool outputs
```

### Changes to ui.js

```javascript
// Add support for displaying search results
// Enhance message rendering with annotations
// Add image upload UI
```

## Feature Flag Implementation

To safely roll out the new API:

```javascript
const FEATURES = {
  RESPONSES_API: localStorage.getItem('feature_responses_api') === 'true',
  WEB_SEARCH: localStorage.getItem('feature_web_search') === 'true',
  IMAGE_UPLOAD: localStorage.getItem('feature_image_upload') === 'true'
};

// Usage
if (FEATURES.RESPONSES_API) {
  // Use ResponsesAPI
} else {
  // Use ChatAPI
}
```

## Error Handling

1. API errors should be caught and displayed to users
2. Implement retries for transient failures
3. Provide fallback to Chat Completions API when needed

## Performance Considerations

1. Implement client-side caching for retrieved responses
2. Use debouncing for user inputs
3. Optimize rendering of large responses

## Security Considerations

1. API keys should continue to be stored securely
2. User content should be validated before sending to API
3. Sanitize and validate all responses before rendering

## Testing Strategy

1. Unit tests for ResponsesAPI class
2. Integration tests for API interactions
3. UI tests for new components
4. End-to-end tests for complete user flows

## Deployment Plan

1. Add feature flags for gradual rollout
2. Deploy new code with features disabled
3. Enable features for a small percentage of users
4. Monitor for issues
5. Gradually increase rollout percentage 