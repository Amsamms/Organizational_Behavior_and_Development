/**
 * Search Module
 * Handles search functionality across all course content
 */

class Search {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.clearBtn = document.getElementById('clearSearch');
        this.searchResults = document.getElementById('searchResults');
        this.searchResultsList = document.getElementById('searchResultsList');
        this.closeSearchBtn = document.getElementById('closeSearch');
        this.courseData = null;
        this.debounceTimer = null;
    }

    /**
     * Initialize search functionality
     * @param {Object} courseData - Course data object
     */
    async init(courseData) {
        this.courseData = courseData;

        if (!this.searchInput) {
            console.error('Search input not found');
            return;
        }

        try {
            this.attachEventListeners();
            console.log('✅ Search initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing search:', error);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search input with debounce
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Clear previous timer
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            // Debounce search
            this.debounceTimer = setTimeout(() => {
                if (query.length >= 2) {
                    this.performSearch(query);
                } else {
                    this.hideResults();
                }
            }, 300);
        });

        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Close search results
        if (this.closeSearchBtn) {
            this.closeSearchBtn.addEventListener('click', () => {
                this.hideResults();
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.searchResults.classList.contains('hidden')) {
                this.hideResults();
            }
        });

        // Close on overlay click
        if (this.searchResults) {
            this.searchResults.addEventListener('click', (e) => {
                if (e.target === this.searchResults) {
                    this.hideResults();
                }
            });
        }
    }

    /**
     * Perform search
     * @param {string} query - Search query
     */
    performSearch(query) {
        const results = this.courseData.search(query);

        if (results.length === 0) {
            this.showNoResults(query);
        } else {
            this.showResults(results, query);
        }
    }

    /**
     * Show search results
     * @param {Array} results - Search results
     * @param {string} query - Search query
     */
    showResults(results, query) {
        // Limit results to top 50
        const limitedResults = results.slice(0, 50);

        const html = `
            <div class="search-summary">
                Found <strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} for "<strong>${this.escapeHtml(query)}</strong>"
                ${results.length > 50 ? ` (showing first 50)` : ''}
            </div>
            ${limitedResults.map(result => this.renderSearchResult(result, query)).join('')}
        `;

        this.searchResultsList.innerHTML = html;
        this.searchResults.classList.remove('hidden');

        // Attach click handlers to results
        this.attachResultClickHandlers();
    }

    /**
     * Show no results message
     * @param {string} query - Search query
     */
    showNoResults(query) {
        const html = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No results found</h3>
                <p>No matches found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                <p style="color: var(--text-secondary); margin-top: 1rem;">Try different keywords or check spelling</p>
            </div>
        `;

        this.searchResultsList.innerHTML = html;
        this.searchResults.classList.remove('hidden');
    }

    /**
     * Render a single search result
     * @param {Object} result - Search result object
     * @param {string} query - Search query
     * @returns {string} HTML string
     */
    renderSearchResult(result, query) {
        const typeIcons = {
            chapter: 'fa-book',
            overview: 'fa-info-circle',
            takeaway: 'fa-key',
            section: 'fa-folder',
            content: 'fa-file-alt',
            concept: 'fa-lightbulb'
        };

        const typeLabels = {
            chapter: 'Chapter',
            overview: 'Overview',
            takeaway: 'Key Takeaway',
            section: 'Section',
            content: 'Content',
            concept: 'Concept'
        };

        const icon = typeIcons[result.type] || 'fa-circle';
        const label = typeLabels[result.type] || result.type;

        // Highlight query in context
        const highlightedContext = this.highlightQuery(result.context, query);

        return `
            <div class="search-result-item"
                 data-chapter="${result.chapter}"
                 data-type="${result.type}">
                <div class="result-header">
                    <span class="result-type">
                        <i class="fas ${icon}"></i>
                        ${label}
                    </span>
                    <span class="result-chapter">Chapter ${result.chapter}: ${result.title}</span>
                </div>
                <div class="result-match">
                    <strong>${this.escapeHtml(result.match)}</strong>
                </div>
                ${result.context ? `
                    <div class="result-context">
                        ${highlightedContext}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Highlight query in text
     * @param {string} text - Text to highlight
     * @param {string} query - Query to highlight
     * @returns {string} HTML with highlighted query
     */
    highlightQuery(text, query) {
        if (!text || !query) return this.escapeHtml(text);

        const escapedText = this.escapeHtml(text);
        const escapedQuery = this.escapeHtml(query);

        // Case-insensitive highlighting
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return escapedText.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Attach click handlers to search results
     */
    attachResultClickHandlers() {
        const resultItems = this.searchResultsList.querySelectorAll('.search-result-item');

        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const chapterNum = parseInt(item.dataset.chapter);
                const chapter = this.courseData.getChapter(chapterNum);

                if (chapter) {
                    // Load chapter content
                    const event = new CustomEvent('content:loadChapter', {
                        detail: { chapter }
                    });
                    document.dispatchEvent(event);

                    // Hide search results
                    this.hideResults();

                    // Highlight in navigation
                    if (window.navigationInstance) {
                        window.navigationInstance.highlightActive(chapterNum);
                    }
                }
            });
        });
    }

    /**
     * Hide search results
     */
    hideResults() {
        if (this.searchResults) {
            this.searchResults.classList.add('hidden');
        }
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.searchInput.value = '';
        this.hideResults();
        this.searchInput.focus();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS for search-specific styles
const searchStyles = `
    .search-summary {
        padding: 1rem;
        background: var(--card-bg);
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.95rem;
        color: var(--text-secondary);
    }

    .search-summary strong {
        color: var(--text-primary);
    }

    .no-results {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--text-secondary);
    }

    .no-results h3 {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
    }

    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
    }

    .result-type {
        color: var(--part1-color);
        font-weight: 500;
    }

    .result-type i {
        margin-right: 0.3rem;
    }

    .result-chapter {
        color: var(--text-secondary);
        font-size: 0.8rem;
    }

    .result-match {
        margin-bottom: 0.5rem;
        font-size: 1rem;
        color: var(--text-primary);
    }

    .result-context {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .result-context mark {
        background: var(--part2-color);
        color: white;
        padding: 2px 4px;
        border-radius: 3px;
    }

    .nav-chapter-header.active,
    .nav-section.active {
        background: var(--hover-bg);
        border-left-color: var(--part1-color);
    }
`;

// Inject search styles
const searchStyleSheet = document.createElement('style');
searchStyleSheet.textContent = searchStyles;
document.head.appendChild(searchStyleSheet);

// Make Search globally available
window.Search = Search;
