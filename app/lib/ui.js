/**
 * Motion LLM Chat - UI Utilities
 * Handles UI interaction and updates
 */

class ChatUI {
    constructor() {
        // Create fallback for marked.js if it's not available
        if (typeof window.marked === 'undefined') {
            console.warn('Marked.js not found, using basic fallback');
            window.marked = (text) => {
                return this.formatBasicMarkdown(text);
            };
            window.marked.setOptions = () => {}; // No-op
        }
        
        // UI elements
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.charCount = document.getElementById('char-count');
        this.emojiButton = document.getElementById('emoji-button');
        this.clearButton = document.getElementById('clear-button');
        this.suggestionChips = document.querySelectorAll('.suggestion-chip');
        this.inputSuggestions = document.getElementById('input-suggestions');
        this.sendButton = document.getElementById('send-button');
        this.emptyState = document.getElementById('empty-state');
        this.settingsContainer = document.getElementById('settings-container');
        this.sidebar = document.getElementById('sidebar');
        this.conversationList = document.getElementById('conversation-list');
        this.conversationTitle = document.getElementById('conversation-title');
        this.messageForm = document.getElementById('message-form');
        this.toggleSettingsButton = document.getElementById('toggle-settings-button');
        this.markdownPreview = document.getElementById('markdown-preview');
        this.previewButton = document.getElementById('preview-button');
        this.mdButtons = document.querySelectorAll('.md-button');
        
        // Recording state
        this.isRecording = false;
        this.recorder = null;
        this.audioChunks = [];
        this.recordButton = null;
        
        // Track the current typing indicator element
        this.typingIndicator = null;
        
        // Check if Motion is available
        this.hasMotion = typeof window.motion !== 'undefined';
        
        // Auto-resize functionality for textarea
        this.setupTextareaAutoResize();
        
        // Configure marked options
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,        // Add line breaks
                gfm: true,           // GitHub Flavored Markdown
                headerIds: false,    // No header IDs for security
                mangle: false,       // Don't mangle email addresses
                sanitize: false,     // Let DOMPurify handle this
                smartLists: true,    // Smart list behavior
                smartypants: true,   // Smart typography
                xhtml: false         // No XHTML closing tags
            });
        }
        
        // Initialize UI elements
        this.initializeUI();
    }

    /**
     * Initialize the UI with event listeners
     */
    init() {
        // Check if Motion library is available and log warning if not
        if (!this.hasMotion) {
            console.warn('Motion library not found. Animations will be disabled.');
        }
        
        // Initialize sidebar and conversation management
        this.initSidebar();
        this.initConversationTitle();
        this.renderConversationList();
    }

    /**
     * Initialize the sidebar
     */
    initSidebar() {
        // Toggle sidebar visibility
        const toggleSidebarButton = document.getElementById('toggle-sidebar-button');
        const showSidebarButton = document.getElementById('show-sidebar-button');
        const newChatButton = document.getElementById('new-chat-button');
        
        if (toggleSidebarButton) {
            toggleSidebarButton.addEventListener('click', () => {
                this.sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebar_collapsed', this.sidebar.classList.contains('collapsed'));
            });
        }
        
        if (showSidebarButton) {
            showSidebarButton.addEventListener('click', () => {
                this.sidebar.classList.add('visible');
            });
            
            // Also add event listener to close sidebar when clicking outside of it on mobile
            document.addEventListener('click', (event) => {
                if (window.innerWidth <= 768 && 
                    !this.sidebar.contains(event.target) && 
                    !showSidebarButton.contains(event.target) &&
                    this.sidebar.classList.contains('visible')) {
                    this.sidebar.classList.remove('visible');
                }
            });
        }
        
        if (newChatButton) {
            newChatButton.addEventListener('click', () => {
                const newId = chatAPI.createNewConversation('New Chat');
                this.loadConversation(newId);
            });
        }
        
        // Apply saved sidebar state
        const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isSidebarCollapsed) {
            this.sidebar.classList.add('collapsed');
        }
    }
    
    /**
     * Initialize the editable conversation title
     */
    initConversationTitle() {
        if (!this.conversationTitle) return;
        
        // Save title on blur
        this.conversationTitle.addEventListener('blur', () => {
            const title = this.conversationTitle.textContent.trim();
            if (title) {
                chatAPI.updateConversationTitle(chatAPI.currentConversationId, title);
                this.renderConversationList();
            } else {
                // Reset to current title if empty
                this.conversationTitle.textContent = chatAPI.getCurrentConversation()?.title || 'New Chat';
            }
        });
        
        // Save title on Enter key
        this.conversationTitle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.conversationTitle.blur();
            }
        });
    }
    
    /**
     * Render the conversation list in the sidebar
     */
    renderConversationList() {
        if (!this.conversationList) return;
        
        // Clear the list
        this.conversationList.innerHTML = '';
        
        // Get all conversations
        const conversations = chatAPI.conversations;
        
        // Sort by updated time, most recent first
        const sortedIds = Object.keys(conversations).sort((a, b) => {
            return new Date(conversations[b].updatedAt) - new Date(conversations[a].updatedAt);
        });
        
        // Generate the HTML for each conversation
        sortedIds.forEach(id => {
            const conv = conversations[id];
            const isActive = id === chatAPI.currentConversationId;
            
            const item = document.createElement('div');
            item.className = `conversation-item ${isActive ? 'active' : ''}`;
            item.setAttribute('data-id', id);
            
            item.innerHTML = `
                <div class="conversation-title-text">${conv.title}</div>
                <button class="delete-conversation" title="Delete conversation">✕</button>
            `;
            
            // Add click event to load the conversation
            item.addEventListener('click', (event) => {
                if (!event.target.classList.contains('delete-conversation')) {
                    this.loadConversation(id);
                }
            });
            
            // Add delete button event
            const deleteButton = item.querySelector('.delete-conversation');
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.deleteConversation(id);
            });
            
            this.conversationList.appendChild(item);
        });
    }
    
    /**
     * Load a conversation
     * @param {string} id - The ID of the conversation to load
     */
    loadConversation(id) {
        // Set the current conversation in the API
        chatAPI.setCurrentConversation(id);
        
        // Update the active item in the list
        this.renderConversationList();
        
        // Update the title
        const conversation = chatAPI.getCurrentConversation();
        if (conversation && this.conversationTitle) {
            this.conversationTitle.textContent = conversation.title;
        }
        
        // Clear the chat area
        this.chatMessages.innerHTML = '';
        
        // Add the empty state
        this.chatMessages.appendChild(this.emptyState);
        this.updateEmptyState();
        
        // Load the messages
        const messages = chatAPI.conversationHistory;
        
        // Track conversation flow to group consecutive messages if needed
        let previousRole = null;
        
        // Process messages in order
        messages.forEach((msg, index) => {
            // Only process user and assistant messages
            if (msg.role === 'user' || msg.role === 'assistant') {
                const role = msg.role === 'user' ? 'user' : 'ai';
                
                // Create a clean chat interface with proper ordering
                this.addMessageToChat(role, msg.content);
            }
            
            // Update previous role for next iteration
            previousRole = msg.role;
        });
        
        // Close the sidebar on mobile
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('visible');
        }
        
        // Focus the input
        this.userInput.focus();
    }
    
    /**
     * Delete a conversation
     * @param {string} id - The ID of the conversation to delete
     */
    deleteConversation(id) {
        if (confirm('Are you sure you want to delete this conversation?')) {
            const wasCurrentConversation = id === chatAPI.currentConversationId;
            
            // Delete the conversation
            chatAPI.deleteConversation(id);
            
            // Update the conversation list
            this.renderConversationList();
            
            // If we deleted the current conversation, load the new current one
            if (wasCurrentConversation) {
                this.loadConversation(chatAPI.currentConversationId);
            }
        }
    }
    
    /**
     * Add a message to the chat (used when loading conversations)
     * @param {string} role - The role of the message (user or ai)
     * @param {string} content - The content of the message
     */
    addMessageToChat(role, content) {
        // Hide empty state
        this.updateEmptyState();
        
        // Create the message element
        const messageElement = this.createMessageElement(role, content);
        
        // Add to chat
        this.chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Update suggestion visibility
        this.checkSuggestionVisibility();
    }

    /**
     * Add a user message to the chat
     * @param {string} message - The user's message
     */
    addUserMessage(message) {
        // Hide empty state
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
        
        // Check for duplicate messages (prevent double sends)
        const existingMessages = this.chatMessages.querySelectorAll('.user-message');
        if (existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            const lastMessageContent = lastMessage.querySelector('.message-content');
            
            // If the last message content is identical, don't add another one
            if (lastMessageContent && lastMessageContent.textContent.trim() === message.trim()) {
                // Just return the existing message element
                return lastMessage;
            }
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        
        // Get formatted timestamp
        const timestamp = this.formatTimestamp();
        
        // Format message content
        const formattedMessage = this.formatMessage(message);
        
        // Set message HTML
        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-sender">
                    <span class="sender-icon">👤</span>
                    You
                </div>
                <div class="message-time">${timestamp}</div>
            </div>
            <div class="message-content">${formattedMessage}</div>
        `;
        
        // Add to chat
        this.chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Update suggestion visibility
        this.checkSuggestionVisibility();
        
        return messageElement;
    }
    
    /**
     * Add an AI message to the chat
     * @param {string|Object} message - The message content or formatted message object
     */
    addAIMessage(message) {
        // Remove typing indicator if present
        this.removeTypingIndicator();
        
        // Check if message is a simple string or formatted object with citations
        let messageText = '';
        let citations = [];
        
        if (typeof message === 'string') {
            messageText = message;
        } else if (typeof message === 'object') {
            messageText = message.text || '';
            citations = message.citations || [];
        }
        
        // Check for duplicate messages (prevent doubles)
        const existingMessages = this.chatMessages.querySelectorAll('.ai-message');
        if (existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            const lastMessageContent = lastMessage.querySelector('.message-content');
            
            // If the last message content is identical, don't add another one
            if (lastMessageContent && lastMessageContent.textContent.trim() === messageText.trim()) {
                // Just return the existing message element
                return lastMessage;
            }
        }
        
        // Create the message element
        const messageElement = this.createMessageElement('assistant', messageText);
        
        // Add citations if present
        if (citations && citations.length > 0) {
            const citationsContainer = document.createElement('div');
            citationsContainer.className = 'citations-container';
            
            const citationsTitle = document.createElement('div');
            citationsTitle.className = 'citations-title';
            citationsTitle.textContent = 'Web Search Results';
            citationsContainer.appendChild(citationsTitle);
            
            const citationsList = document.createElement('div');
            citationsList.className = 'citations-list';
            
            citations.forEach(citation => {
                const citationItem = document.createElement('a');
                citationItem.className = 'citation-item';
                citationItem.href = citation.url;
                citationItem.target = '_blank';
                citationItem.rel = 'noopener noreferrer';
                citationItem.title = citation.title;
                
                const titleElement = document.createElement('div');
                titleElement.className = 'citation-title';
                titleElement.textContent = citation.title;
                
                const urlElement = document.createElement('div');
                urlElement.className = 'citation-url';
                urlElement.textContent = new URL(citation.url).hostname;
                
                citationItem.appendChild(titleElement);
                citationItem.appendChild(urlElement);
                citationsList.appendChild(citationItem);
            });
            
            citationsContainer.appendChild(citationsList);
            messageElement.appendChild(citationsContainer);
        }
        
        // Add the message to the chat
        this.chatMessages.appendChild(messageElement);
        
        // Format code blocks and syntax highlighting
        this.formatCodeBlocks(messageElement);
        
        // Animate the message entrance
        this.animateMessageEntrance(messageElement, 'assistant');
        
        // Scroll to the bottom of the chat
        this.scrollToBottom();
    }

    /**
     * Set up auto-resize for the textarea
     */
    setupTextareaAutoResize() {
        if (!this.userInput) {
            console.warn('User input textarea not found, skipping auto-resize setup');
            return;
        }
        
        this.userInput.addEventListener('input', () => {
            // Reset height to auto to get the correct scrollHeight
            this.userInput.style.height = 'auto';
            
            // Set new height based on scrollHeight, with a max of 4 rows
            const lineHeight = parseInt(getComputedStyle(this.userInput).lineHeight);
            const maxHeight = lineHeight * 4;
            const newHeight = Math.min(this.userInput.scrollHeight, maxHeight);
            
            this.userInput.style.height = `${newHeight}px`;
        });
    }

    /**
     * Toggle the settings panel
     */
    toggleSettingsPanel() {
        if (this.settingsContainer) {
            if (this.settingsContainer.classList.contains('open')) {
                this.settingsContainer.classList.remove('open');
            } else {
                this.settingsContainer.classList.add('open');
            }
        }
    }

    /**
     * Initialize the settings panel after it's loaded
     */
    initSettingsPanel() {
        // This method is no longer needed as settings are set up in main.js
        // Keeping it for backward compatibility
    }

    /**
     * Set the theme
     * @param {string} theme - The theme to set (light, dark, or system)
     */
    setTheme(theme) {
        localStorage.setItem('theme', theme);
        
        // Update active button if elements exist
        const themeButtons = document.querySelectorAll('.theme-button');
        if (themeButtons.length > 0) {
            themeButtons.forEach(btn => btn.classList.remove('active'));
            const themeButton = document.getElementById(`theme-${theme}`);
            if (themeButton) {
                themeButton.classList.add('active');
            }
        }
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        
        // If system, detect and apply system preference
        if (theme === 'system') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }
    }

    /**
     * Create a message element
     * @param {string} role - The role of the message (user or ai)
     * @param {string} content - The content of the message
     * @returns {HTMLElement} The message element
     */
    createMessageElement(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${role}`;
        
        // Add message header with sender and time
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const sender = document.createElement('span');
        sender.className = 'message-sender';
        sender.textContent = role === 'user' ? 'You' : 'AI Assistant';
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.formatTime(new Date());
        
        header.appendChild(sender);
        header.appendChild(time);
        
        // Add message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Simple markdown-like formatting for code blocks
        if (content.includes('```')) {
            const formatted = this.formatCodeBlocks(content);
            messageContent.innerHTML = formatted;
        } else {
            messageContent.textContent = content;
        }
        
        // Assemble the message
        messageElement.appendChild(header);
        messageElement.appendChild(messageContent);
        
        // Apply entrance animation using Motion
        this.animateMessageEntrance(messageElement, role);
        
        return messageElement;
    }

    /**
     * Format code blocks in messages
     * @param {string} content - The message content
     * @returns {string} The formatted content
     */
    formatCodeBlocks(content) {
        // Simple regex to replace code blocks with HTML
        return content.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    }

    /**
     * Format the current time
     * @param {Date} date - The date to format
     * @returns {string} The formatted time string
     */
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Show the typing indicator
     */
    showTypingIndicator() {
        // Remove any existing typing indicator
        this.removeTypingIndicator();
        
        // Create a new typing indicator
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
        this.typingIndicator.setAttribute('aria-label', 'AI is typing');
        
        // Create a div for streamed content first (so dots overlay it)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'typing-content';
        contentDiv.innerHTML = '';
        this.typingIndicator.appendChild(contentDiv);
        
        // Create dots container
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'typing-dots';
        
        // Create the dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            dotsContainer.appendChild(dot);
            
            // Add animation if Motion library is available
            if (this.hasMotion && window.motion) {
                window.motion.animate(dot, 
                    { opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] },
                    { duration: 1, repeat: Infinity, delay: i * 0.2 }
                );
            }
        }
        
        // Add dots container to typing indicator (after content)
        this.typingIndicator.appendChild(dotsContainer);
        
        // Add to chat messages container
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.appendChild(this.typingIndicator);
        }
        
        // Scroll to the bottom
        this.scrollToBottom();
        
        // Return the content div, not the whole indicator
        return contentDiv;
    }

    /**
     * Remove the typing indicator
     */
    removeTypingIndicator() {
        if (this.typingIndicator && this.typingIndicator.parentNode) {
            this.typingIndicator.parentNode.removeChild(this.typingIndicator);
            this.typingIndicator = null;
        }
    }

    /**
     * Animate the typing indicator dots
     */
    animateTypingDots() {
        if (!this.typingIndicator) return;
        
        const dots = this.typingIndicator.querySelectorAll('.typing-dot');
        
        if (this.hasMotion) {
            dots.forEach((dot, i) => {
                // Use Motion for the animation
                window.motion.animate(dot, {
                    y: [0, -10, 0],
                    opacity: [1, 0.5, 1]
                }, {
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                });
            });
        } else {
            // Fallback to CSS animations
            dots.forEach((dot, i) => {
                dot.style.animation = `bounce 1s ${i * 0.2}s infinite`;
            });
        }
    }

    /**
     * Animate message entrance
     * @param {HTMLElement} element - The message element to animate
     * @param {string} role - The role of the message (user or ai)
     */
    animateMessageEntrance(element, role) {
        if (this.hasMotion) {
            // Different animation for user vs AI messages
            if (role === 'user') {
                // User messages slide in from right
                window.motion.animate(element, {
                    x: [50, 0],
                    opacity: [0, 1]
                }, {
                    duration: 0.5,
                    easing: [0.34, 1.56, 0.64, 1] // Spring-like easing
                });
            } else {
                // AI messages fade in
                window.motion.animate(element, {
                    opacity: [0, 1]
                }, {
                    duration: 0.3
                });
            }
        } else {
            // Fallback to CSS transitions
            if (role === 'user') {
                element.style.transform = 'translateX(50px)';
                element.style.opacity = '0';
                element.style.transition = 'transform 0.5s, opacity 0.5s';
                
                // Force reflow to ensure transition works
                element.offsetHeight;
                
                element.style.transform = 'translateX(0)';
                element.style.opacity = '1';
            } else {
                element.style.opacity = '0';
                element.style.transition = 'opacity 0.3s';
                
                // Force reflow to ensure transition works
                element.offsetHeight;
                
                element.style.opacity = '1';
            }
        }
    }

    /**
     * Update the empty state visibility
     */
    updateEmptyState() {
        const hasAnyApiKey = chatAPI.hasApiKey() || chatAPI.hasAnthropicApiKey();
        
        if (hasAnyApiKey && this.chatMessages.querySelectorAll('.message').length === 0) {
            this.emptyState.style.display = 'flex';
        } else {
            this.emptyState.style.display = 'none';
        }
    }

    /**
     * Scroll to the bottom of the chat
     */
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /**
     * Clear the user input
     */
    clearInput() {
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        this.userInput.focus();
    }

    /**
     * Set UI state during message sending
     * @param {boolean} isSending - Whether a message is being sent
     */
    setLoadingState(isSending) {
        this.userInput.disabled = isSending;
        this.sendButton.disabled = isSending;
        
        if (isSending) {
            this.sendButton.innerHTML = '<span class="loading-spinner"></span>';
        } else {
            this.sendButton.innerHTML = '<span class="send-icon">➤</span>';
        }
    }

    /**
     * Show an error message in the chat
     * @param {string} message - The error message
     */
    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = `Error: ${message}`;
        
        this.chatMessages.appendChild(errorContainer);
        this.scrollToBottom();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    }

    /**
     * Initialize the speech to text button
     */
    initSpeechToText() {
        this.recordButton = document.getElementById('record-button');
        
        if (!this.recordButton) return;
        
        // Check if browser supports audio recording
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.recordButton.disabled = true;
            this.recordButton.title = 'Speech to text is not supported in your browser';
            return;
        }
        
        this.recordButton.addEventListener('click', () => this.toggleRecording());
    }
    
    /**
     * Toggle audio recording state
     */
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    /**
     * Start audio recording
     */
    async startRecording() {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Show recording indicator
            this.recordButton.classList.add('recording');
            this.recordButton.setAttribute('aria-label', 'Stop recording');
            this.recordButton.title = 'Stop recording';
            
            // Reset audio chunks
            this.audioChunks = [];
            
            // Create media recorder
            this.recorder = new MediaRecorder(stream);
            
            // Collect audio data
            this.recorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });
            
            // Handle recording stop
            this.recorder.addEventListener('stop', () => {
                // Stop all tracks in the stream to release the microphone
                stream.getTracks().forEach(track => track.stop());
                
                // Process the recorded audio
                this.processRecordedAudio();
            });
            
            // Start recording
            this.recorder.start();
            this.isRecording = true;
            
            // Pulse animation for the record button
            if (this.hasMotion) {
                window.motion.animate(this.recordButton, {
                    scale: [1, 1.1, 1],
                    backgroundColor: ['var(--accent-color)', 'var(--error-color)', 'var(--accent-color)']
                }, {
                    duration: 1.5,
                    repeat: Infinity
                });
            }
            
            // Show recording status in the input field
            const placeholder = this.userInput.placeholder;
            this.userInput.placeholder = 'Recording...';
            this.userInput._originalPlaceholder = placeholder;
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showError('Could not access microphone. Please check your permissions.');
        }
    }
    
    /**
     * Stop audio recording
     */
    stopRecording() {
        if (!this.recorder) return;
        
        // Stop the recorder
        this.recorder.stop();
        this.isRecording = false;
        
        // Reset UI
        this.recordButton.classList.remove('recording');
        this.recordButton.setAttribute('aria-label', 'Record audio message');
        this.recordButton.title = 'Record audio message';
        
        // Reset placeholder
        if (this.userInput._originalPlaceholder) {
            this.userInput.placeholder = this.userInput._originalPlaceholder;
            delete this.userInput._originalPlaceholder;
        }
        
        // Stop animation
        if (this.hasMotion) {
            window.motion.stop(this.recordButton);
        }
    }
    
    /**
     * Process the recorded audio
     */
    processRecordedAudio() {
        if (this.audioChunks.length === 0) return;
        
        // Create a blob from the audio chunks
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Show processing indicator
        this.showProcessingIndicator();
        
        // Send to Whisper API for transcription
        chatAPI.transcribeAudio(
            audioBlob,
            (text) => {
                // Success - put text in input field
                this.hideProcessingIndicator();
                this.userInput.value = text;
                this.userInput.focus();
                this.userInput.dispatchEvent(new Event('input')); // Trigger auto-resize
            },
            (error) => {
                // Error
                this.hideProcessingIndicator();
                this.showError(error);
            }
        );
    }
    
    /**
     * Show a processing indicator in the input field
     */
    showProcessingIndicator() {
        const processingIndicator = document.createElement('div');
        processingIndicator.className = 'processing-indicator';
        processingIndicator.innerHTML = `
            <div class="processing-spinner"></div>
            <div class="processing-text">Transcribing audio...</div>
        `;
        
        // Add to input area
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
            inputArea.appendChild(processingIndicator);
            
            // Animate in
            if (this.hasMotion) {
                window.motion.animate(processingIndicator, {
                    opacity: [0, 1],
                    y: [20, 0]
                }, {
                    duration: 0.3,
                    easing: 'ease-out'
                });
            }
        }
    }
    
    /**
     * Hide the processing indicator
     */
    hideProcessingIndicator() {
        const processingIndicator = document.querySelector('.processing-indicator');
        if (!processingIndicator) return;
        
        // Animate out
        if (this.hasMotion) {
            window.motion.animate(processingIndicator, {
                opacity: [1, 0],
                y: [0, 20]
            }, {
                duration: 0.3,
                easing: 'ease-in',
                onComplete: () => processingIndicator.remove()
            });
        } else {
            processingIndicator.remove();
        }
    }

    /**
     * Initialize UI interactions
     */
    initializeUI() {
        try {
            // Auto-resize text area
            this.setupAutoResize();
            
            // Set up character count
            this.setupCharCount();
            
            // Set up buttons 
            this.setupButtons();
            
            // Set up suggestion chips
            this.setupSuggestionChips();
            
            // Set up markdown toolbar
            this.setupMarkdownToolbar();
            
            // Initialize markdown preview
            this.setupMarkdownPreview();
        } catch (error) {
            console.error('Error initializing UI:', error);
        }
    }
    
    /**
     * Set up auto-resizing textarea
     */
    setupAutoResize() {
        if (!this.userInput) {
            console.warn('User input element not found for auto-resize setup');
            return;
        }
        
        this.userInput.addEventListener('input', () => {
            // Reset height to auto to calculate proper scrollHeight
            this.userInput.style.height = 'auto';
            
            // Set height to scrollHeight, constrained by max-height in CSS
            this.userInput.style.height = `${Math.min(this.userInput.scrollHeight, 200)}px`;
            
            // Update character count
            this.updateCharCount();
        });
    }
    
    /**
     * Set up character count functionality
     */
    setupCharCount() {
        if (!this.userInput || !this.charCount) {
            console.warn('User input or character count element not found for char count setup');
            return;
        }
        
        // Initial count
        this.updateCharCount();
        
        // Update on input
        this.userInput.addEventListener('input', () => {
            this.updateCharCount();
        });
    }
    
    /**
     * Update character count display
     */
    updateCharCount() {
        if (!this.userInput || !this.charCount) {
            return;
        }
        
        const currentLength = this.userInput.value.length;
        const maxLength = 4000; // OpenAI's typical max length
        this.charCount.textContent = `${currentLength}/${maxLength}`;
        
        // Visual indicator when approaching limit
        if (currentLength > maxLength * 0.9) {
            this.charCount.style.color = 'var(--error)';
        } else {
            this.charCount.style.color = 'var(--text-secondary)';
        }
    }
    
    /**
     * Set up button event handlers
     */
    setupButtons() {
        // Emoji button
        if (this.emojiButton) {
            this.emojiButton.addEventListener('click', () => {
                // Simple emoji picker for demo purposes
                const emojis = ['😊', '👍', '🎉', '🤔', '👀', '❤️', '👋', '🙏', '🔥', '✨'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                // Insert emoji at cursor position
                const cursorPos = this.userInput.selectionStart;
                const textBefore = this.userInput.value.substring(0, cursorPos);
                const textAfter = this.userInput.value.substring(cursorPos);
                
                this.userInput.value = textBefore + randomEmoji + textAfter;
                this.userInput.focus();
                
                // Force textarea resize
                const event = new Event('input');
                this.userInput.dispatchEvent(event);
                
                // Set cursor position after emoji
                this.userInput.selectionStart = cursorPos + randomEmoji.length;
                this.userInput.selectionEnd = cursorPos + randomEmoji.length;
            });
        }
        
        // Clear button
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.userInput.value = '';
                this.userInput.style.height = 'auto';
                this.userInput.focus();
                this.updateCharCount();
            });
        }
    }
    
    /**
     * Set up suggestion chip functionality
     */
    setupSuggestionChips() {
        if (!this.inputSuggestions) return;
        
        // Show suggestions only when chat is empty
        this.checkSuggestionVisibility();
        
        // Set up click events for suggestions
        this.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.userInput.value = chip.textContent;
                this.userInput.focus();
                
                // Force textarea resize and update char count
                const event = new Event('input');
                this.userInput.dispatchEvent(event);
                
                // Hide suggestions after selection
                this.inputSuggestions.style.display = 'none';
            });
        });
    }
    
    /**
     * Check if suggestions should be visible
     */
    checkSuggestionVisibility() {
        // Only show suggestions when no messages and empty input
        if (this.chatMessages.querySelectorAll('.message').length === 0 && 
            this.emptyState && this.emptyState.style.display !== 'none') {
            this.inputSuggestions.style.display = 'flex';
        } else {
            this.inputSuggestions.style.display = 'none';
        }
    }

    /**
     * Set up markdown toolbar functionality
     */
    setupMarkdownToolbar() {
        if (!this.mdButtons || !this.userInput) return;
        
        this.mdButtons.forEach(button => {
            button.addEventListener('click', () => {
                const markdown = button.getAttribute('data-md');
                if (!markdown) return;
                
                const textarea = this.userInput;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                let insertText = '';
                
                // Handle different markdown types
                if (markdown === '**' || markdown === '*') {
                    // Bold/italic: apply to selection or insert placeholder
                    insertText = selectedText 
                        ? `${markdown}${selectedText}${markdown}` 
                        : `${markdown}text${markdown}`;
                } else if (markdown === '[](url)') {
                    // Link: apply to selection as link text or insert placeholder
                    insertText = selectedText 
                        ? `[${selectedText}](url)` 
                        : `[link text](url)`;
                } else if (markdown === '```\n\n```') {
                    // Code block: apply to selection or insert placeholder with cursor between
                    insertText = selectedText 
                        ? `\`\`\`\n${selectedText}\n\`\`\`` 
                        : `\`\`\`\n\n\`\`\``;
                } else {
                    // Lists, blockquotes, headers: apply at start of line
                    const beforeCursor = textarea.value.substring(0, start);
                    const afterCursor = textarea.value.substring(end);
                    
                    // Check if we're at the beginning of a line
                    const isStartOfLine = start === 0 || beforeCursor.endsWith('\n');
                    
                    if (isStartOfLine) {
                        insertText = `${markdown}${selectedText}`;
                    } else {
                        insertText = `\n${markdown}${selectedText}`;
                    }
                }
                
                // Insert the text
                textarea.focus();
                const newValue = textarea.value.substring(0, start) + insertText + textarea.value.substring(end);
                textarea.value = newValue;
                
                // Recalculate height and update preview
                const event = new Event('input');
                textarea.dispatchEvent(event);
                
                // Set cursor position
                if (markdown === '```\n\n```' && !selectedText) {
                    // Place cursor inside empty code block
                    textarea.selectionStart = start + 4;
                    textarea.selectionEnd = start + 4;
                } else if (markdown === '[](url)' && !selectedText) {
                    // Place cursor at "link text" for editing
                    textarea.selectionStart = start + 1;
                    textarea.selectionEnd = start + 10;
                } else {
                    // Place cursor after the inserted text
                    textarea.selectionStart = start + insertText.length;
                    textarea.selectionEnd = start + insertText.length;
                }
            });
        });
    }
    
    /**
     * Set up markdown preview functionality
     */
    setupMarkdownPreview() {
        if (!this.markdownPreview || !this.previewButton || !this.userInput) return;
        
        // Hide preview initially
        this.markdownPreview.style.display = 'none';
        
        // Toggle preview button
        this.previewButton.addEventListener('click', () => {
            const isVisible = this.markdownPreview.style.display !== 'none';
            
            if (isVisible) {
                // Switch back to edit mode
                this.markdownPreview.style.display = 'none';
                this.userInput.style.display = 'block';
                this.userInput.focus();
            } else {
                // Switch to preview mode, render markdown
                this.markdownPreview.innerHTML = this.formatMessage(this.userInput.value);
                this.markdownPreview.style.display = 'block';
                this.userInput.style.display = 'none';
            }
        });
        
        // Update preview on input
        this.userInput.addEventListener('input', () => {
            if (this.markdownPreview.style.display !== 'none') {
                this.markdownPreview.innerHTML = this.formatMessage(this.userInput.value);
            }
        });
    }

    /**
     * Format message text with markdown
     * @param {string} text - The message text
     * @returns {string} Formatted HTML
     */
    formatMessage(text) {
        if (!text) return '';
        
        // Check if marked is defined globally (window.marked) and not as a local variable
        if (typeof window.marked === 'undefined' || typeof marked === 'undefined') {
            // Create a simple fallback if marked.js failed to load
            console.warn('Marked.js not available in formatMessage - using fallback');
            window.marked = (text) => {
                return this.formatBasicMarkdown(text);
            };
            // Make it also available in the current scope
            marked = window.marked;
        }
        
        // Handle when a message starts with "markdown" or variations (case insensitive)
        const markdownStartRegex = /^\s*(markdown|markdown:)\s*\n([\s\S]*?)$/im;
        const markdownMatch = text.match(markdownStartRegex);
        
        if (markdownMatch) {
            // Process the content after "markdown" directly as markdown
            const content = markdownMatch[2];
            try {
                return this.sanitizeHTML(marked(content));
            } catch (error) {
                console.error('Error parsing markdown:', error);
                // If marked fails, fall back to basic formatting
                return this.formatBasicMarkdown(content);
            }
        }
        
        // Create a copy of the text for processing
        let processedText = text;
        
        // Store code blocks to prevent them from being processed as markdown
        const codeBlocks = [];
        let codeBlockCount = 0;
        
        // Extract code blocks and replace with placeholders
        processedText = processedText.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
            const placeholder = `CODE_BLOCK_PLACEHOLDER_${codeBlockCount}`;
            codeBlockCount++;
            
            // Special handling for markdown examples - render the markdown content
            if (language.toLowerCase() === 'markdown') {
                // Parse the markdown content inside the code block
                let parsedContent;
                if (typeof marked !== 'undefined') {
                    try {
                        parsedContent = this.sanitizeHTML(marked(code.trim()));
                    } catch (error) {
                        console.error('Error parsing markdown within code block:', error);
                        parsedContent = this.escapeHTML(code.trim());
                    }
                } else {
                    // Basic fallback if marked is not available
                    parsedContent = this.escapeHTML(code.trim());
                }
                codeBlocks.push(`<div class="rendered-markdown">${parsedContent}</div>`);
            } else {
                codeBlocks.push(`<pre><code class="language-${language}">${this.escapeHTML(code.trim())}</code></pre>`);
            }
            
            return placeholder;
        });
        
        // Use marked.js (either real or our fallback)
        try {
            // Process the text with marked (code blocks are now placeholders)
            processedText = this.sanitizeHTML(marked(processedText));
            
            // Restore code blocks
            for (let i = 0; i < codeBlockCount; i++) {
                processedText = processedText.replace(`CODE_BLOCK_PLACEHOLDER_${i}`, codeBlocks[i]);
            }
            
            return processedText;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            // Fall back to basic parsing
            return this.formatBasicMarkdown(text);
        }
    }
    
    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        // This is a very basic sanitizer
        // In production, use a library like DOMPurify
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Remove potentially dangerous attributes
        const elements = div.querySelectorAll('*');
        for (const el of elements) {
            // Remove event handlers and javascript: URLs
            for (const attr of el.attributes) {
                if (attr.name.startsWith('on') || 
                    (attr.name === 'href' && attr.value.toLowerCase().startsWith('javascript:'))) {
                    el.removeAttribute(attr.name);
                }
            }
            
            // If it's a link, add security attributes
            if (el.tagName === 'A' && el.getAttribute('href')) {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
        }
        
        return div.innerHTML;
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} html - String that might contain HTML
     * @returns {string} Escaped HTML string
     */
    escapeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Format timestamp for messages
     * @returns {string} Formatted time string
     */
    formatTimestamp() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    /**
     * Show a loading skeleton message while waiting for AI response
     * @returns {HTMLElement} The skeleton element
     */
    showLoadingSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'message-skeleton';
        this.chatMessages.appendChild(skeleton);
        this.scrollToBottom();
        return skeleton;
    }
    
    /**
     * Remove a loading skeleton
     * @param {HTMLElement} skeleton - The skeleton element to remove
     */
    removeLoadingSkeleton(skeleton) {
        if (skeleton && skeleton.parentNode) {
            skeleton.parentNode.removeChild(skeleton);
        }
    }

    /**
     * Apply basic markdown formatting as a fallback when marked.js is not available
     * @param {string} text - Text to format with markdown
     * @returns {string} HTML formatted text
     */
    formatBasicMarkdown(text) {
        if (!text) return '';
        
        let formattedText = text;
        
        // Handle code blocks with triple backticks and language
        formattedText = formattedText.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
            // Special handling for markdown examples
            if (language.toLowerCase() === 'markdown') {
                // Basic markdown parsing for the content inside
                let parsedContent = this.formatBasicMarkdown(code.trim());
                return `<div class="rendered-markdown">${parsedContent}</div>`;
            } else {
                return `<pre><code class="language-${language}">${this.escapeHTML(code.trim())}</code></pre>`;
            }
        });
        
        // Handle code blocks without language specification
        formattedText = formattedText.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${this.escapeHTML(code.trim())}</code></pre>`;
        });
        
        // Inline code
        formattedText = formattedText.replace(/`([^`]+)`/g, (match, code) => {
            return `<code>${this.escapeHTML(code)}</code>`;
        });
        
        // Bold
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Links
        formattedText = formattedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Headers
        formattedText = formattedText.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        formattedText = formattedText.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        formattedText = formattedText.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        
        // Line breaks
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        return formattedText;
    }

    /**
     * Show a notification
     * @param {string} message - The notification message
     * @param {string} type - The notification type (info, success, error)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to the DOM
        document.body.appendChild(notification);
        
        // Animate in
        if (this.hasMotion) {
            motion.animate(notification, {
                opacity: [0, 1],
                y: [20, 0]
            }, {
                duration: 0.3,
                easing: 'ease-out'
            });
        } else {
            notification.style.opacity = 1;
        }
        
        // Remove after delay
        setTimeout(() => {
            if (this.hasMotion) {
                motion.animate(notification, {
                    opacity: [1, 0],
                    y: [0, -20]
                }, {
                    duration: 0.3,
                    easing: 'ease-in',
                    onComplete: () => {
                        notification.remove();
                    }
                });
            } else {
                notification.style.opacity = 0;
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    /**
     * Display conversations in the sidebar
     * @param {Object} conversations - The conversations to display
     */
    displayConversations(conversations) {
        if (!this.conversationList) {
            console.warn('Conversation list element not found, skipping conversation display');
            return;
        }
        
        // Ensure we have valid conversations object
        if (!conversations || typeof conversations !== 'object') {
            console.warn('Invalid conversations object provided to displayConversations');
            return;
        }
        
        // Clear the list
        this.conversationList.innerHTML = '';
        
        // Sort by updated time, most recent first
        const sortedIds = Object.keys(conversations).sort((a, b) => {
            return new Date(conversations[b].updatedAt) - new Date(conversations[a].updatedAt);
        });
        
        // Generate the HTML for each conversation
        sortedIds.forEach(id => {
            const conv = conversations[id];
            const isActive = id === window.chatAPI.currentConversationId;
            
            const item = document.createElement('div');
            item.className = `conversation-item ${isActive ? 'active' : ''}`;
            item.setAttribute('data-id', id);
            
            // Create the title safely
            const safeTitle = conv.title ? this.escapeHTML(conv.title) : 'Untitled';
            
            // Create the conversation item content
            item.innerHTML = `
                <div class="conversation-info">
                    <div class="conversation-title">${safeTitle}</div>
                    <div class="conversation-date">${new Date(conv.updatedAt).toLocaleDateString()}</div>
                </div>
                <button class="delete-conversation-button" data-id="${id}" aria-label="Delete conversation">×</button>
            `;
            
            // Add to the list
            this.conversationList.appendChild(item);
            
            // Add click handler to select this conversation
            item.addEventListener('click', (e) => {
                // Ignore if clicked on the delete button
                if (e.target.closest('.delete-conversation-button')) return;
                
                window.chatAPI.setCurrentConversation(id);
                this.loadConversation(id);
                this.highlightCurrentConversation(id);
            });
            
            // Add delete button handler
            const deleteButton = item.querySelector('.delete-conversation-button');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                        this.deleteConversation(id);
                    }
                });
            }
        });
    }
    
    /**
     * Highlight the current conversation in the sidebar
     * @param {string} id - The ID of the conversation to highlight
     */
    highlightCurrentConversation(id) {
        if (!this.conversationList) return;
        
        // Remove active class from all items
        const items = this.conversationList.querySelectorAll('.conversation-item');
        items.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current item
        const currentItem = this.conversationList.querySelector(`.conversation-item[data-id="${id}"]`);
        if (currentItem) {
            currentItem.classList.add('active');
        }
    }
}

// Create and export a singleton instance
const chatUI = new ChatUI();

// Expose the instance globally for other modules
window.chatUI = chatUI; 