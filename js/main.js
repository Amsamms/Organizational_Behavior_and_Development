/**
 * Main Application - Modern Redesign
 * Clean, mobile-first approach
 */

class App {
    constructor() {
        this.contentData = window.ContentData;
        this.mindMap = null;
        this.navigation = null;
        this.search = null;

        // DOM Elements
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebar = document.getElementById('sidebar');
        this.closeSidebar = document.getElementById('closeSidebar');
        this.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

        this.searchToggle = document.getElementById('searchToggle');
        this.searchBar = document.getElementById('searchBar');
        this.closeSearch = document.getElementById('closeSearch');
        this.searchInput = document.getElementById('searchInput');

        this.mindmapSection = document.getElementById('mindmapSection');
        this.contentPanel = document.getElementById('contentPanel');
        this.contentBody = document.getElementById('contentBody');
        this.contentTitle = document.getElementById('contentTitle');

        this.backToMap = document.getElementById('backToMap');
        this.quickGuide = document.getElementById('quickGuide');
        this.closeGuide = document.getElementById('closeGuide');

        // Controls
        this.resetZoomBtn = document.getElementById('resetZoom');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.exportMapBtn = document.getElementById('exportMap');

        this.bookmarkBtn = document.getElementById('bookmarkBtn');
        this.shareBtn = document.getElementById('shareBtn');
    }

    async init() {
        try {
            console.log('🚀 Initializing OB Mind Map...');

            // Load content data
            await this.contentData.load();

            // Initialize modules
            this.mindMap = new window.MindMap('mindMap');
            await this.mindMap.init(this.contentData);

            this.navigation = new window.Navigation('navTree');
            await this.navigation.init(this.contentData);

            this.search = new window.Search();
            await this.search.init(this.contentData);

            // Attach event listeners
            this.attachEventListeners();

            // Check if first visit
            this.checkFirstVisit();

            console.log('✅ App initialized');
        } catch (error) {
            console.error('❌ Error:', error);
            this.showError(error);
        }
    }

    attachEventListeners() {
        // Mobile menu
        this.menuToggle?.addEventListener('click', () => this.toggleSidebar());
        this.closeSidebar?.addEventListener('click', () => this.hideSidebar());
        this.mobileMenuOverlay?.addEventListener('click', () => this.hideSidebar());

        // Search
        this.searchToggle?.addEventListener('click', () => this.toggleSearch());
        this.closeSearch?.addEventListener('click', () => this.hideSearch());

        // Quick guide
        this.closeGuide?.addEventListener('click', () => this.hideQuickGuide());

        // Mind map controls
        this.resetZoomBtn?.addEventListener('click', () => this.mindMap?.resetZoom());
        this.zoomInBtn?.addEventListener('click', () => this.mindMap?.zoomIn());
        this.zoomOutBtn?.addEventListener('click', () => this.mindMap?.zoomOut());
        this.exportMapBtn?.addEventListener('click', () => this.mindMap?.exportAsImage());

        // Content controls
        this.backToMap?.addEventListener('click', () => this.showMindMap());
        this.shareBtn?.addEventListener('click', () => this.shareContent());

        // Custom events
        document.addEventListener('content:loadChapter', (e) => {
            this.loadChapterContent(e.detail.chapter);
        });

        document.addEventListener('nav:itemClick', (e) => {
            this.hideSidebar();
        });

        // Close sidebar when clicking nav items on mobile
        this.sidebar?.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                if (window.innerWidth < 768) {
                    this.hideSidebar();
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSidebar();
                this.hideSearch();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleSearch();
            }
        });
    }

    // Sidebar
    toggleSidebar() {
        this.sidebar?.classList.toggle('active');
        this.mobileMenuOverlay?.classList.toggle('active');
    }

    hideSidebar() {
        this.sidebar?.classList.remove('active');
        this.mobileMenuOverlay?.classList.remove('active');
    }

    // Search
    toggleSearch() {
        this.searchBar?.classList.toggle('active');
        if (this.searchBar?.classList.contains('active')) {
            this.searchInput?.focus();
        }
    }

    hideSearch() {
        this.searchBar?.classList.remove('active');
    }

    // Quick Guide
    checkFirstVisit() {
        const visited = localStorage.getItem('ob_visited');
        if (!visited && this.quickGuide) {
            this.quickGuide.classList.remove('hidden');
            localStorage.setItem('ob_visited', 'true');
        } else {
            this.hideQuickGuide();
        }
    }

    hideQuickGuide() {
        this.quickGuide?.classList.add('hidden');
    }

    // Views
    showMindMap() {
        this.contentPanel?.classList.remove('active');
        this.mindmapSection?.classList.remove('hidden');
    }

    showContent() {
        this.mindmapSection?.classList.add('hidden');
        this.contentPanel?.classList.add('active');
    }

    // Content Loading
    loadChapterContent(chapter) {
        this.showContent();

        this.contentTitle.textContent = `Chapter ${chapter.chapter}: ${chapter.title}`;

        const html = `
            <div class="chapter-view">
                <div class="chapter-header">
                    <div class="chapter-badge">Chapter ${chapter.chapter}</div>
                    <h1 class="chapter-title">${chapter.title}</h1>
                    ${chapter.overview ? `
                        <p class="chapter-overview">${chapter.overview}</p>
                    ` : ''}
                </div>

                ${chapter.keyTakeaways && chapter.keyTakeaways.length > 0 ? `
                    <div class="section-block">
                        <h2 class="section-heading">
                            <i class="fas fa-key"></i>
                            Key Takeaways
                        </h2>
                        <div class="takeaways-grid">
                            ${chapter.keyTakeaways.map((t, i) => `
                                <div class="takeaway-card">
                                    <div class="takeaway-number">${i + 1}</div>
                                    <p>${t}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${chapter.sections && chapter.sections.length > 0 ? `
                    <div class="section-block">
                        <h2 class="section-heading">
                            <i class="fas fa-list"></i>
                            Topics
                        </h2>
                        <div class="topics-list">
                            ${chapter.sections.map(s => `
                                <div class="topic-item">
                                    <h3>${s.title}</h3>
                                    ${s.content ? `<p>${s.content}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        this.contentBody.innerHTML = html;
        this.contentBody.scrollTop = 0;
    }

    // Share
    shareContent() {
        if (navigator.share) {
            navigator.share({
                title: 'OB Mind Map',
                text: 'Organizational Behavior & Development Course',
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Link copied!'))
                .catch(() => {});
        }
    }

    // Error
    showError(error) {
        if (this.contentBody) {
            this.contentBody.innerHTML = `
                <div class="error-view">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Oops!</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="control-btn">
                        Reload
                    </button>
                </div>
            `;
        }
    }
}

// Inject content styles
const styles = `
    .chapter-view {
        max-width: 900px;
        margin: 0 auto;
    }

    .chapter-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .chapter-badge {
        display: inline-block;
        background: var(--primary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .chapter-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .chapter-overview {
        font-size: 1.1rem;
        color: var(--text-secondary);
        line-height: 1.8;
        max-width: 700px;
        margin: 0 auto;
    }

    .section-block {
        margin-bottom: 3rem;
    }

    .section-heading {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--primary);
    }

    .takeaways-grid {
        display: grid;
        gap: 1rem;
    }

    .takeaway-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
        transition: var(--transition);
    }

    .takeaway-card:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
    }

    .takeaway-number {
        width: 36px;
        height: 36px;
        background: var(--secondary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        flex-shrink: 0;
    }

    .takeaway-card p {
        margin: 0;
        line-height: 1.6;
        color: var(--text-secondary);
    }

    .topics-list {
        display: grid;
        gap: 1rem;
    }

    .topic-item {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-left: 4px solid var(--accent);
        border-radius: 8px;
        padding: 1.5rem;
    }

    .topic-item h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        font-size: 1.1rem;
    }

    .topic-item p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
    }

    .error-view {
        text-align: center;
        padding: 4rem 2rem;
    }

    .error-view i {
        font-size: 4rem;
        color: var(--accent);
        margin-bottom: 1rem;
    }

    .error-view h2 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .error-view button {
        margin-top: 1.5rem;
        padding: 0.75rem 2rem;
        width: auto;
    }

    @media (min-width: 768px) {
        .takeaways-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .chapter-title {
            font-size: 3rem;
        }
    }

    @media (max-width: 480px) {
        .chapter-title {
            font-size: 1.75rem;
        }

        .section-heading {
            font-size: 1.25rem;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
