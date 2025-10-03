/**
 * Main Application Module
 * Initializes and coordinates all modules
 */

class App {
    constructor() {
        this.contentData = window.ContentData;
        this.mindMap = null;
        this.navigation = null;
        this.search = null;
        this.bookmarks = [];
        this.currentView = 'mindmap'; // 'mindmap', 'content', 'both'

        // DOM elements
        this.mindMapPanel = document.getElementById('mindMapPanel');
        this.navigationPanel = document.getElementById('navigationPanel');
        this.contentPanel = document.getElementById('contentPanel');
        this.contentArea = document.getElementById('contentArea');
        this.contentTitle = document.getElementById('contentTitle');
        this.mainContent = document.querySelector('.main-content');

        // View toggle buttons
        this.toggleMindMapBtn = document.getElementById('toggleMindMap');
        this.toggleContentBtn = document.getElementById('toggleContent');
        this.toggleBothBtn = document.getElementById('toggleBoth');

        // Content controls
        this.bookmarkBtn = document.getElementById('bookmarkBtn');
        this.printBtn = document.getElementById('printBtn');
        this.shareBtn = document.getElementById('shareBtn');

        // Mind map controls
        this.resetZoomBtn = document.getElementById('resetZoom');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.exportMapBtn = document.getElementById('exportMap');

        // Bookmarks sidebar
        this.bookmarksSidebar = document.getElementById('bookmarksSidebar');
        this.closeBookmarksBtn = document.getElementById('closeBookmarks');
        this.bookmarksList = document.getElementById('bookmarksList');
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Organizational Behavior & Development Website...');

            // Load course data
            await this.contentData.load();

            // Update stats
            this.updateStats();

            // Initialize modules
            this.mindMap = new window.MindMap('mindMap');
            await this.mindMap.init(this.contentData);

            this.navigation = new window.Navigation('courseNav');
            await this.navigation.init(this.contentData);
            window.navigationInstance = this.navigation; // Make globally available for search

            this.search = new window.Search();
            await this.search.init(this.contentData);

            // Load bookmarks from localStorage
            this.loadBookmarks();

            // Attach event listeners
            this.attachEventListeners();

            // Set initial view
            this.setView('mindmap');

            console.log('✅ Application initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            this.showError(error);
        }
    }

    /**
     * Update statistics on welcome screen
     */
    updateStats() {
        const totalChapters = this.contentData.getChapters().length;
        const totalConcepts = this.contentData.getTotalConceptCount();

        const totalChaptersEl = document.getElementById('totalChapters');
        const totalConceptsEl = document.getElementById('totalConcepts');

        if (totalChaptersEl) totalChaptersEl.textContent = totalChapters;
        if (totalConceptsEl) totalConceptsEl.textContent = totalConcepts + '+';
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // View toggle buttons
        this.toggleMindMapBtn?.addEventListener('click', () => this.setView('mindmap'));
        this.toggleContentBtn?.addEventListener('click', () => this.setView('content'));
        this.toggleBothBtn?.addEventListener('click', () => this.setView('both'));

        // Mind map controls
        this.resetZoomBtn?.addEventListener('click', () => this.mindMap.resetZoom());
        this.zoomInBtn?.addEventListener('click', () => this.mindMap.zoomIn());
        this.zoomOutBtn?.addEventListener('click', () => this.mindMap.zoomOut());
        this.exportMapBtn?.addEventListener('click', () => this.mindMap.exportAsImage());

        // Content controls
        this.bookmarkBtn?.addEventListener('click', () => this.toggleBookmarksSidebar());
        this.printBtn?.addEventListener('click', () => this.printContent());
        this.shareBtn?.addEventListener('click', () => this.shareContent());

        // Bookmarks sidebar
        this.closeBookmarksBtn?.addEventListener('click', () => this.hideBookmarksSidebar());

        // Custom events from other modules
        document.addEventListener('content:loadChapter', (e) => {
            this.loadChapterContent(e.detail.chapter);
        });

        document.addEventListener('content:loadSection', (e) => {
            this.loadSectionContent(e.detail.chapter, e.detail.section);
        });

        document.addEventListener('content:loadTakeaway', (e) => {
            this.loadTakeawayContent(e.detail.chapter, e.detail.takeaway, e.detail.index);
        });

        // Window resize - adjust view
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Set view mode
     * @param {string} view - View mode: 'mindmap', 'content', 'both'
     */
    setView(view) {
        this.currentView = view;

        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));

        // Hide all panels first
        this.mindMapPanel.classList.add('hidden');
        this.navigationPanel.classList.add('hidden');
        this.contentPanel.classList.add('hidden');

        // Reset main content classes
        this.mainContent.classList.remove('split-view', 'content-view');

        switch (view) {
            case 'mindmap':
                this.mindMapPanel.classList.remove('hidden');
                this.toggleMindMapBtn.classList.add('active');
                break;

            case 'content':
                this.navigationPanel.classList.remove('hidden');
                this.contentPanel.classList.remove('hidden');
                this.mainContent.classList.add('content-view');
                this.toggleContentBtn.classList.add('active');
                break;

            case 'both':
                this.mindMapPanel.classList.remove('hidden');
                this.contentPanel.classList.remove('hidden');
                this.mainContent.classList.add('split-view');
                this.toggleBothBtn.classList.add('active');
                break;
        }
    }

    /**
     * Load chapter content
     * @param {Object} chapter - Chapter object
     */
    loadChapterContent(chapter) {
        // Switch to content view if in mindmap-only view
        if (this.currentView === 'mindmap') {
            this.setView('both');
        }

        this.contentTitle.innerHTML = `<i class="fas fa-book"></i> Chapter ${chapter.chapter}: ${chapter.title}`;

        const html = `
            <div class="chapter-content">
                <div class="chapter-header">
                    <h1 class="chapter-title">Chapter ${chapter.chapter}</h1>
                    <h2 class="chapter-subtitle">${chapter.title}</h2>
                    <div class="chapter-meta">
                        <span><i class="fas fa-file-pdf"></i> ${chapter.totalPages} pages</span>
                    </div>
                </div>

                ${chapter.overview ? `
                    <div class="chapter-section">
                        <h3><i class="fas fa-info-circle"></i> Overview</h3>
                        <p class="overview-text">${chapter.overview}</p>
                    </div>
                ` : ''}

                ${chapter.keyTakeaways && chapter.keyTakeaways.length > 0 ? `
                    <div class="chapter-section">
                        <h3><i class="fas fa-key"></i> Key Takeaways</h3>
                        <ul class="takeaways-list">
                            ${chapter.keyTakeaways.map((takeaway, index) => `
                                <li class="takeaway-item">
                                    <span class="takeaway-number">${index + 1}</span>
                                    <span class="takeaway-text">${takeaway}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${chapter.sections && chapter.sections.length > 0 ? `
                    <div class="chapter-section">
                        <h3><i class="fas fa-list"></i> Sections</h3>
                        ${this.renderSections(chapter.sections)}
                    </div>
                ` : ''}
            </div>
        `;

        this.contentArea.innerHTML = html;
        this.contentArea.scrollTop = 0;
    }

    /**
     * Render sections recursively
     * @param {Array} sections - Array of sections
     * @param {number} level - Nesting level
     * @returns {string} HTML string
     */
    renderSections(sections, level = 1) {
        return `
            <div class="sections-container level-${level}">
                ${sections.map(section => `
                    <div class="section-item">
                        <h${level + 3} class="section-title">
                            <i class="fas fa-angle-right"></i>
                            ${section.title}
                        </h${level + 3}>
                        ${section.content ? `<p class="section-content">${section.content}</p>` : ''}
                        ${section.concepts && section.concepts.length > 0 ? `
                            <div class="concepts-list">
                                ${section.concepts.map(concept => `
                                    <div class="concept-item">
                                        <div class="concept-name">${concept.name}</div>
                                        <div class="concept-definition">${concept.definition}</div>
                                        ${concept.examples && concept.examples.length > 0 ? `
                                            <div class="concept-examples">
                                                <strong>Examples:</strong>
                                                <ul>
                                                    ${concept.examples.map(ex => `<li>${ex}</li>`).join('')}
                                                </ul>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${section.subsections && section.subsections.length > 0 ?
                            this.renderSections(section.subsections, level + 1) : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Load section content
     * @param {Object} chapter - Chapter object
     * @param {Object} section - Section object
     */
    loadSectionContent(chapter, section) {
        if (this.currentView === 'mindmap') {
            this.setView('both');
        }

        this.contentTitle.innerHTML = `<i class="fas fa-folder"></i> ${section.title}`;

        const html = `
            <div class="section-content">
                <div class="breadcrumb">
                    <a href="#" data-chapter="${chapter.chapter}">Chapter ${chapter.chapter}: ${chapter.title}</a>
                    <span>/</span>
                    <span>${section.title}</span>
                </div>

                <h2>${section.title}</h2>
                ${section.content ? `<p class="section-text">${section.content}</p>` : ''}

                ${section.concepts && section.concepts.length > 0 ? `
                    <div class="concepts-section">
                        <h3>Concepts</h3>
                        ${section.concepts.map(concept => `
                            <div class="concept-card">
                                <h4>${concept.name}</h4>
                                <p>${concept.definition}</p>
                                ${concept.examples && concept.examples.length > 0 ? `
                                    <div class="examples">
                                        <strong>Examples:</strong>
                                        <ul>
                                            ${concept.examples.map(ex => `<li>${ex}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.contentArea.innerHTML = html;

        // Attach breadcrumb click handler
        const breadcrumbLink = this.contentArea.querySelector('.breadcrumb a');
        if (breadcrumbLink) {
            breadcrumbLink.addEventListener('click', (e) => {
                e.preventDefault();
                const chapterNum = parseInt(e.target.dataset.chapter);
                const ch = this.contentData.getChapter(chapterNum);
                if (ch) this.loadChapterContent(ch);
            });
        }
    }

    /**
     * Load takeaway content
     * @param {Object} chapter - Chapter object
     * @param {string} takeaway - Takeaway text
     * @param {number} index - Takeaway index
     */
    loadTakeawayContent(chapter, takeaway, index) {
        if (this.currentView === 'mindmap') {
            this.setView('both');
        }

        this.contentTitle.innerHTML = `<i class="fas fa-key"></i> Key Takeaway #${index + 1}`;

        const html = `
            <div class="takeaway-content">
                <div class="breadcrumb">
                    <a href="#" data-chapter="${chapter.chapter}">Chapter ${chapter.chapter}: ${chapter.title}</a>
                    <span>/</span>
                    <span>Key Takeaway #${index + 1}</span>
                </div>

                <div class="takeaway-card">
                    <div class="takeaway-badge">Key Takeaway #${index + 1}</div>
                    <p class="takeaway-main">${takeaway}</p>
                </div>
            </div>
        `;

        this.contentArea.innerHTML = html;

        const breadcrumbLink = this.contentArea.querySelector('.breadcrumb a');
        if (breadcrumbLink) {
            breadcrumbLink.addEventListener('click', (e) => {
                e.preventDefault();
                const chapterNum = parseInt(e.target.dataset.chapter);
                const ch = this.contentData.getChapter(chapterNum);
                if (ch) this.loadChapterContent(ch);
            });
        }
    }

    /**
     * Toggle bookmarks sidebar
     */
    toggleBookmarksSidebar() {
        this.bookmarksSidebar.classList.toggle('hidden');
        this.renderBookmarks();
    }

    /**
     * Hide bookmarks sidebar
     */
    hideBookmarksSidebar() {
        this.bookmarksSidebar.classList.add('hidden');
    }

    /**
     * Load bookmarks from localStorage
     */
    loadBookmarks() {
        const stored = localStorage.getItem('ob_bookmarks');
        if (stored) {
            this.bookmarks = JSON.parse(stored);
        }
    }

    /**
     * Save bookmarks to localStorage
     */
    saveBookmarks() {
        localStorage.setItem('ob_bookmarks', JSON.stringify(this.bookmarks));
    }

    /**
     * Render bookmarks list
     */
    renderBookmarks() {
        if (this.bookmarks.length === 0) {
            this.bookmarksList.innerHTML = '<p class="empty-message">No bookmarks yet. Click the bookmark icon to save sections.</p>';
            return;
        }

        const html = this.bookmarks.map((bookmark, index) => `
            <div class="bookmark-item" data-index="${index}">
                <div class="bookmark-content">
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-meta">Chapter ${bookmark.chapter}</div>
                </div>
                <button class="remove-bookmark" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        this.bookmarksList.innerHTML = html;

        // Attach click handlers
        this.bookmarksList.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.remove-bookmark')) {
                    const index = parseInt(item.dataset.index);
                    const bookmark = this.bookmarks[index];
                    const chapter = this.contentData.getChapter(bookmark.chapter);
                    if (chapter) {
                        this.loadChapterContent(chapter);
                        this.hideBookmarksSidebar();
                    }
                }
            });
        });

        this.bookmarksList.querySelectorAll('.remove-bookmark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeBookmark(index);
            });
        });
    }

    /**
     * Remove bookmark
     * @param {number} index - Bookmark index
     */
    removeBookmark(index) {
        this.bookmarks.splice(index, 1);
        this.saveBookmarks();
        this.renderBookmarks();
    }

    /**
     * Print current content
     */
    printContent() {
        window.print();
    }

    /**
     * Share content
     */
    shareContent() {
        if (navigator.share) {
            navigator.share({
                title: 'Organizational Behavior & Development',
                text: 'Check out this interactive course mind map!',
                url: window.location.href
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(err => console.error('Copy failed:', err));
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layout on small screens
        if (window.innerWidth < 768 && this.currentView === 'both') {
            this.setView('content');
        }
    }

    /**
     * Show error message
     * @param {Error} error - Error object
     */
    showError(error) {
        const html = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Oops! Something went wrong</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;

        this.contentArea.innerHTML = html;
    }
}

// Add content-specific styles
const contentStyles = `
    .chapter-content, .section-content, .takeaway-content {
        max-width: 900px;
        margin: 0 auto;
    }

    .chapter-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
    }

    .chapter-title {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--part2-color), var(--part4-color));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
    }

    .chapter-subtitle {
        font-size: 1.5rem;
        color: var(--text-primary);
        margin-bottom: 1rem;
    }

    .chapter-meta {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .chapter-section {
        margin-bottom: 2rem;
        background: var(--card-bg);
        padding: 1.5rem;
        border-radius: 12px;
        border-left: 4px solid var(--part1-color);
    }

    .chapter-section h3 {
        color: var(--part1-color);
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .overview-text {
        line-height: 1.8;
        font-size: 1.05rem;
        color: var(--text-secondary);
    }

    .takeaways-list {
        list-style: none;
        padding: 0;
    }

    .takeaway-item {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--hover-bg);
        border-radius: 8px;
        transition: transform var(--transition-fast);
    }

    .takeaway-item:hover {
        transform: translateX(4px);
    }

    .takeaway-number {
        background: var(--part2-color);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-weight: 600;
    }

    .takeaway-text {
        line-height: 1.6;
    }

    .breadcrumb {
        margin-bottom: 1.5rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .breadcrumb a {
        color: var(--part1-color);
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .concept-card, .concept-item {
        background: var(--hover-bg);
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        border-left: 3px solid var(--part3-color);
    }

    .concept-name, .concept-card h4 {
        color: var(--part3-color);
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .error-message {
        text-align: center;
        padding: 4rem 2rem;
    }

    .error-message i {
        font-size: 4rem;
        color: var(--part3-color);
        margin-bottom: 1rem;
    }

    .bookmark-item {
        background: var(--card-bg);
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background var(--transition-fast);
    }

    .bookmark-item:hover {
        background: var(--hover-bg);
    }

    .bookmark-title {
        font-weight: 500;
    }

    .bookmark-meta {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }

    .remove-bookmark {
        background: var(--hover-bg);
        border: none;
        color: var(--text-secondary);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
    }

    .remove-bookmark:hover {
        background: var(--part3-color);
        color: white;
    }
`;

// Inject content styles
const contentStyleSheet = document.createElement('style');
contentStyleSheet.textContent = contentStyles;
document.head.appendChild(contentStyleSheet);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
