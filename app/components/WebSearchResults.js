/**
 * Web Search Results Component
 * Displays search results from the OpenAI Responses API's web search tool
 */

class WebSearchResults {
    /**
     * Create the web search results component
     * @param {Array} results - The web search results
     * @returns {HTMLElement} - The web search results element
     */
    static create(results) {
        if (!results || results.length === 0) return null;

        // Create container
        const container = document.createElement('div');
        container.className = 'web-search-results';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'web-search-header';
        
        const icon = document.createElement('div');
        icon.className = 'web-search-icon';
        icon.textContent = '🔍';
        
        const title = document.createElement('h3');
        title.textContent = 'Web Search Results';
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-results-btn';
        toggleButton.setAttribute('aria-label', 'Toggle search results');
        toggleButton.textContent = '↑';
        
        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(toggleButton);
        
        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-container';
        
        // Add results
        results.forEach(result => {
            const resultElement = this.createResultItem(result);
            resultsContainer.appendChild(resultElement);
        });
        
        // Add elements to container
        container.appendChild(header);
        container.appendChild(resultsContainer);
        
        // Add toggle functionality
        toggleButton.addEventListener('click', () => {
            const isCollapsed = container.classList.contains('collapsed');
            container.classList.toggle('collapsed');
            toggleButton.textContent = isCollapsed ? '↑' : '↓';
            toggleButton.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
        });
        
        return container;
    }
    
    /**
     * Create a single search result item
     * @param {Object} result - The search result data
     * @returns {HTMLElement} - The result item element
     */
    static createResultItem(result) {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result';
        
        const title = document.createElement('h4');
        const titleLink = document.createElement('a');
        titleLink.href = result.url;
        titleLink.textContent = result.title;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        title.appendChild(titleLink);
        
        const meta = document.createElement('div');
        meta.className = 'result-meta';
        
        // Extract domain from URL
        let domain = '';
        try {
            domain = new URL(result.url).hostname;
        } catch (e) {
            domain = result.url;
        }
        
        meta.textContent = domain;
        
        const snippet = document.createElement('p');
        snippet.className = 'result-snippet';
        snippet.textContent = result.snippet;
        
        resultElement.appendChild(title);
        resultElement.appendChild(meta);
        resultElement.appendChild(snippet);
        
        return resultElement;
    }
    
    /**
     * Format citations for display in the AI response
     * @param {Array} citations - Citation data
     * @returns {string} - HTML string with formatted citations
     */
    static formatCitations(citations) {
        if (!citations || citations.length === 0) return '';
        
        let html = '<div class="sources"><h4>Sources:</h4><ol>';
        
        citations.forEach((citation, index) => {
            html += `<li><a href="${citation.url}" target="_blank" rel="noopener noreferrer">${citation.title || citation.url}</a></li>`;
        });
        
        html += '</ol></div>';
        return html;
    }
    
    /**
     * Apply citation superscripts to text
     * @param {string} text - Original text content
     * @param {Array} citations - Citation data
     * @returns {string} - Text with citation superscripts added
     */
    static applyCitationReferences(text, citations) {
        if (!citations || citations.length === 0) return text;
        
        let result = text;
        const citationMap = {};
        
        citations.forEach((citation, index) => {
            const num = index + 1;
            citationMap[citation.url] = num;
        });
        
        citations.forEach((citation, index) => {
            const num = index + 1;
            const citationText = citation.text;
            
            if (citationText && result.includes(citationText)) {
                const superscript = `<sup data-citation="${num}">[${num}]</sup>`;
                result = result.replace(
                    new RegExp(`${escapeRegExp(citationText)}(?!<\/sup>)$`), 
                    `${citationText}${superscript}`
                );
            }
        });
        
        return result;
    }
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Expose the component globally
window.WebSearchResults = WebSearchResults; 