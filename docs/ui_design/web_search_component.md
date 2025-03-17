# Web Search Results Component Design

## Overview

The Web Search Results component displays search results from the OpenAI Responses API's built-in web search tool. It shows search results, citations, and integrates them into the chat interface.

## Visual Design

```
┌──────────────────────────────────────────────────────────┐
│ AI Response with Web Search Results                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ According to the latest information, the new JavaScript  │
│ framework Vue.js 4.0 has been released with several key  │
│ features including improved performance and a new        │
│ composition API[1].                                      │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🔍 Web Search Results                             ↑ │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 1. Vue.js 4.0 Released: What's New                  │  │
│ │    vue.org - March 15, 2025                         │  │
│ │    Vue.js 4.0 introduces the Composition API...     │  │
│ │                                                     │  │
│ │ 2. Performance Benchmarks: Vue 4 vs React 19        │  │
│ │    jsreport.com - March 16, 2025                    │  │
│ │    The latest benchmarks show Vue 4 outperforms...  │  │
│ │                                                     │  │
│ │ 3. Vue 4.0 Migration Guide                          │  │
│ │    vuejs.dev/guide - March 14, 2025                 │  │
│ │    This guide helps you migrate from Vue 3.x to...  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ The benchmarks show a 25% performance improvement[2]     │
│ over previous versions, and migration from Vue 3.x       │
│ requires minimal code changes[3].                        │
│                                                          │
│ Sources:                                                 │
│ [1] vue.org/blog/vue-4-released                          │
│ [2] jsreport.com/vue-4-vs-react-performance              │
│ [3] vuejs.dev/guide/migration/                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Component Structure

```html
<div class="message ai-message">
  <div class="message-content">
    <p>According to the latest information, the new JavaScript framework Vue.js 4.0 has been released with several key features including improved performance and a new composition API<sup data-citation="1">1</sup>.</p>
    
    <div class="web-search-results">
      <div class="web-search-header">
        <div class="web-search-icon">🔍</div>
        <h3>Web Search Results</h3>
        <button class="toggle-results-btn" aria-label="Toggle search results">↑</button>
      </div>
      
      <div class="search-results-container">
        <div class="search-result">
          <h4>Vue.js 4.0 Released: What's New</h4>
          <div class="result-meta">vue.org - March 15, 2025</div>
          <p class="result-snippet">Vue.js 4.0 introduces the Composition API...</p>
        </div>
        
        <!-- Additional search results -->
      </div>
    </div>
    
    <p>The benchmarks show a 25% performance improvement<sup data-citation="2">2</sup> over previous versions, and migration from Vue 3.x requires minimal code changes<sup data-citation="3">3</sup>.</p>
    
    <div class="sources">
      <h4>Sources:</h4>
      <ol>
        <li><a href="https://vue.org/blog/vue-4-released" target="_blank" rel="noopener noreferrer">vue.org/blog/vue-4-released</a></li>
        <li><a href="https://jsreport.com/vue-4-vs-react-performance" target="_blank" rel="noopener noreferrer">jsreport.com/vue-4-vs-react-performance</a></li>
        <li><a href="https://vuejs.dev/guide/migration/" target="_blank" rel="noopener noreferrer">vuejs.dev/guide/migration/</a></li>
      </ol>
    </div>
  </div>
  
  <div class="message-footer">
    <span class="timestamp">2:45 PM</span>
  </div>
</div>
```

## CSS Styles

```css
.web-search-results {
  background-color: var(--background-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  margin: var(--spacing-md) 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.web-search-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--background-accent);
  cursor: pointer;
}

.web-search-icon {
  margin-right: var(--spacing-sm);
  font-size: 1.2rem;
}

.toggle-results-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.web-search-results.collapsed .toggle-results-btn {
  transform: rotate(180deg);
}

.search-results-container {
  padding: var(--spacing-md);
  max-height: 300px;
  overflow-y: auto;
}

.web-search-results.collapsed .search-results-container {
  display: none;
}

.search-result {
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: var(--spacing-md);
}

.search-result:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.search-result h4 {
  margin: 0 0 var(--spacing-xs);
  color: var(--primary);
}

.result-meta {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.result-snippet {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.sources {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
  font-size: 0.9rem;
}

.sources h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.95rem;
}

.sources ol {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.sources li {
  margin-bottom: var(--spacing-xs);
}

.sources a {
  color: var(--primary);
  text-decoration: none;
}

.sources a:hover {
  text-decoration: underline;
}

sup[data-citation] {
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
}

sup[data-citation]:hover {
  text-decoration: underline;
}
```

## JavaScript Functionality

```javascript
class WebSearchResults {
  constructor() {
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Toggle search results expansion
    document.addEventListener('click', (e) => {
      if (e.target.matches('.web-search-header, .web-search-header *')) {
        const resultsContainer = e.target.closest('.web-search-results');
        if (resultsContainer) {
          resultsContainer.classList.toggle('collapsed');
        }
      }
      
      // Handle citation clicks
      if (e.target.matches('sup[data-citation]')) {
        const citationIndex = e.target.getAttribute('data-citation');
        const sourcesElement = e.target.closest('.message-content').querySelector('.sources');
        
        if (sourcesElement) {
          sourcesElement.scrollIntoView({ behavior: 'smooth' });
          const citationElement = sourcesElement.querySelector(`li:nth-child(${citationIndex})`);
          
          if (citationElement) {
            citationElement.style.backgroundColor = 'var(--highlight-color)';
            setTimeout(() => {
              citationElement.style.backgroundColor = '';
            }, 2000);
          }
        }
      }
    });
  }
  
  /**
   * Create a web search results section from API response
   * @param {Array} annotations - The annotations from the API response
   * @return {HTMLElement} The created web search results element
   */
  createWebSearchResultsElement(annotations) {
    if (!annotations || annotations.length === 0) {
      return null;
    }
    
    const webSearchResults = document.createElement('div');
    webSearchResults.className = 'web-search-results';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'web-search-header';
    header.innerHTML = `
      <div class="web-search-icon">🔍</div>
      <h3>Web Search Results</h3>
      <button class="toggle-results-btn" aria-label="Toggle search results">↑</button>
    `;
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-container';
    
    // Add each result
    annotations.forEach(annotation => {
      if (annotation.type === 'url_citation') {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result';
        resultElement.innerHTML = `
          <h4>${annotation.title}</h4>
          <div class="result-meta">${this.extractDomain(annotation.url)} - ${this.formatDate(annotation.date)}</div>
          <p class="result-snippet">${annotation.snippet || 'Click to view source'}</p>
        `;
        resultsContainer.appendChild(resultElement);
      }
    });
    
    webSearchResults.appendChild(header);
    webSearchResults.appendChild(resultsContainer);
    
    return webSearchResults;
  }
  
  /**
   * Extract domain from URL
   * @param {string} url - The URL to extract domain from
   * @return {string} The extracted domain
   */
  extractDomain(url) {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  }
  
  /**
   * Format date for display
   * @param {string|Date} date - The date to format
   * @return {string} The formatted date
   */
  formatDate(date) {
    if (!date) {
      return '';
    }
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  }
}
```

## Accessibility Considerations

1. Ensure proper ARIA attributes for expandable/collapsible sections
2. Maintain sufficient color contrast for all text elements
3. Provide keyboard navigation for search results
4. Include proper focus management when toggling results visibility
5. Ensure link text is descriptive and provides context

## Mobile Responsiveness

1. Adjust padding and margins for smaller screens
2. Limit maximum height of search results on mobile
3. Ensure touch targets are large enough (at least 44x44px)
4. Consider vertical space constraints when displaying results

## Integration with Existing UI

This component should be integrated into the chat interface as part of the AI message rendering process. When the Responses API returns annotations with `url_citation` type, the web search results component should be rendered within the message content.

The implementation will require:

1. Updates to the `formatMessage` method in `ui.js`
2. Addition of the `WebSearchResults` class
3. New CSS styles in the existing stylesheets
4. Event handlers for interactivity 