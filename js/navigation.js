/**
 * Navigation Module
 * Manages nested navigation with collapsible sections
 */

class Navigation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.courseData = null;
    }

    /**
     * Initialize navigation
     * @param {Object} courseData - Course data object
     */
    async init(courseData) {
        this.courseData = courseData;

        if (!this.container) {
            console.error('Navigation container not found');
            return;
        }

        try {
            await this.render();
            this.attachEventListeners();
            console.log('✅ Navigation initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing navigation:', error);
        }
    }

    /**
     * Render navigation structure
     */
    async render() {
        const parts = this.courseData.getParts();
        const html = parts.map(part => this.renderPart(part)).join('');
        this.container.innerHTML = html;
    }

    /**
     * Render a course part
     * @param {Object} part - Part object
     * @returns {string} HTML string
     */
    renderPart(part) {
        const chapters = this.courseData.getChaptersByPart(part.part);

        return `
            <div class="nav-part" data-part="${part.part}">
                <div class="nav-part-header part-${part.part}" style="border-color: ${part.color}">
                    <span>${part.title}</span>
                    <i class="fas fa-chevron-right toggle-icon"></i>
                </div>
                <div class="nav-chapters">
                    ${chapters.map(ch => this.renderChapter(ch, part.color)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a chapter
     * @param {Object} chapter - Chapter object
     * @param {string} color - Part color
     * @returns {string} HTML string
     */
    renderChapter(chapter, color) {
        const hasSections = chapter.sections && chapter.sections.length > 0;

        return `
            <div class="nav-chapter" data-chapter="${chapter.chapter}">
                <div class="nav-chapter-header" data-color="${color}">
                    <span>Chapter ${chapter.chapter}: ${chapter.title}</span>
                    ${hasSections ? '<i class="fas fa-chevron-right toggle-icon"></i>' : ''}
                </div>
                ${hasSections ? this.renderSections(chapter.sections, chapter.chapter) : ''}
                ${this.renderKeyTakeaways(chapter, color)}
            </div>
        `;
    }

    /**
     * Render sections recursively
     * @param {Array} sections - Array of sections
     * @param {number} chapterNum - Chapter number
     * @param {number} level - Nesting level
     * @returns {string} HTML string
     */
    renderSections(sections, chapterNum, level = 0) {
        const indent = level * 1;

        return `
            <div class="nav-sections" style="padding-left: ${indent}rem;">
                ${sections.map(section => `
                    <div class="nav-section"
                         data-chapter="${chapterNum}"
                         data-section="${section.title}"
                         style="padding-left: ${level * 0.5}rem;">
                        <i class="fas fa-angle-right" style="font-size: 0.8rem; margin-right: 0.5rem;"></i>
                        ${section.title}
                    </div>
                    ${section.subsections && section.subsections.length > 0 ?
                        this.renderSections(section.subsections, chapterNum, level + 1) :
                        ''}
                `).join('')}
            </div>
        `;
    }

    /**
     * Render key takeaways as navigation items
     * @param {Object} chapter - Chapter object
     * @param {string} color - Part color
     * @returns {string} HTML string
     */
    renderKeyTakeaways(chapter, color) {
        if (!chapter.keyTakeaways || chapter.keyTakeaways.length === 0) {
            return '';
        }

        return `
            <div class="nav-sections">
                <div class="nav-section-header" style="padding: 0.5rem 1rem; font-weight: 500; color: ${color}; font-size: 0.85rem;">
                    <i class="fas fa-key"></i> Key Takeaways
                </div>
                ${chapter.keyTakeaways.slice(0, 5).map((takeaway, index) => `
                    <div class="nav-section nav-takeaway"
                         data-chapter="${chapter.chapter}"
                         data-takeaway="${index}"
                         title="${takeaway}">
                        <i class="fas fa-circle" style="font-size: 0.4rem; margin-right: 0.5rem; color: ${color};"></i>
                        ${this.truncateText(takeaway, 60)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Part header click - toggle chapters
        this.container.addEventListener('click', (e) => {
            const partHeader = e.target.closest('.nav-part-header');
            if (partHeader) {
                const part = partHeader.closest('.nav-part');
                this.togglePart(part);
            }
        });

        // Chapter header click - toggle sections
        this.container.addEventListener('click', (e) => {
            const chapterHeader = e.target.closest('.nav-chapter-header');
            if (chapterHeader && !e.target.closest('.nav-part-header')) {
                const chapter = chapterHeader.closest('.nav-chapter');
                const chapterNum = parseInt(chapter.dataset.chapter);

                // Toggle sections if they exist
                const hasSections = chapter.querySelector('.nav-sections');
                if (hasSections) {
                    this.toggleChapter(chapter);
                } else {
                    // Load chapter content directly
                    this.loadChapter(chapterNum);
                }
            }
        });

        // Section click - load section content
        this.container.addEventListener('click', (e) => {
            const section = e.target.closest('.nav-section');
            if (section && !e.target.closest('.nav-chapter-header') && !e.target.closest('.nav-part-header')) {
                const chapterNum = parseInt(section.dataset.chapter);
                const sectionTitle = section.dataset.section;
                const takeawayIndex = section.dataset.takeaway;

                if (takeawayIndex !== undefined) {
                    this.loadTakeaway(chapterNum, parseInt(takeawayIndex));
                } else if (sectionTitle) {
                    this.loadSection(chapterNum, sectionTitle);
                }
            }
        });

        // Collapse All button
        const collapseAllBtn = document.getElementById('collapseAll');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => this.collapseAll());
        }

        // Expand All button
        const expandAllBtn = document.getElementById('expandAll');
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => this.expandAll());
        }
    }

    /**
     * Toggle part expansion
     * @param {HTMLElement} partElement - Part element
     */
    togglePart(partElement) {
        partElement.classList.toggle('expanded');
    }

    /**
     * Toggle chapter expansion
     * @param {HTMLElement} chapterElement - Chapter element
     */
    toggleChapter(chapterElement) {
        chapterElement.classList.toggle('expanded');
    }

    /**
     * Collapse all sections
     */
    collapseAll() {
        const parts = this.container.querySelectorAll('.nav-part');
        parts.forEach(part => part.classList.remove('expanded'));

        const chapters = this.container.querySelectorAll('.nav-chapter');
        chapters.forEach(chapter => chapter.classList.remove('expanded'));
    }

    /**
     * Expand all sections
     */
    expandAll() {
        const parts = this.container.querySelectorAll('.nav-part');
        parts.forEach(part => part.classList.add('expanded'));

        const chapters = this.container.querySelectorAll('.nav-chapter');
        chapters.forEach(chapter => chapter.classList.add('expanded'));
    }

    /**
     * Load chapter content
     * @param {number} chapterNum - Chapter number
     */
    loadChapter(chapterNum) {
        const chapter = this.courseData.getChapter(chapterNum);
        if (!chapter) return;

        const event = new CustomEvent('content:loadChapter', {
            detail: { chapter }
        });
        document.dispatchEvent(event);
    }

    /**
     * Load section content
     * @param {number} chapterNum - Chapter number
     * @param {string} sectionTitle - Section title
     */
    loadSection(chapterNum, sectionTitle) {
        const chapter = this.courseData.getChapter(chapterNum);
        if (!chapter) return;

        const section = this.findSection(chapter.sections, sectionTitle);

        const event = new CustomEvent('content:loadSection', {
            detail: { chapter, section }
        });
        document.dispatchEvent(event);
    }

    /**
     * Load takeaway content
     * @param {number} chapterNum - Chapter number
     * @param {number} takeawayIndex - Takeaway index
     */
    loadTakeaway(chapterNum, takeawayIndex) {
        const chapter = this.courseData.getChapter(chapterNum);
        if (!chapter) return;

        const takeaway = chapter.keyTakeaways[takeawayIndex];

        const event = new CustomEvent('content:loadTakeaway', {
            detail: { chapter, takeaway, index: takeawayIndex }
        });
        document.dispatchEvent(event);
    }

    /**
     * Find section by title recursively
     * @param {Array} sections - Array of sections
     * @param {string} title - Section title
     * @returns {Object|null} Section object or null
     */
    findSection(sections, title) {
        if (!sections) return null;

        for (const section of sections) {
            if (section.title === title) {
                return section;
            }

            if (section.subsections) {
                const found = this.findSection(section.subsections, title);
                if (found) return found;
            }
        }

        return null;
    }

    /**
     * Highlight active navigation item
     * @param {number} chapterNum - Chapter number
     * @param {string} sectionTitle - Section title (optional)
     */
    highlightActive(chapterNum, sectionTitle = null) {
        // Remove previous active states
        const activeItems = this.container.querySelectorAll('.active');
        activeItems.forEach(item => item.classList.remove('active'));

        // Add active to chapter
        const chapterHeader = this.container.querySelector(
            `.nav-chapter[data-chapter="${chapterNum}"] .nav-chapter-header`
        );
        if (chapterHeader) {
            chapterHeader.classList.add('active');
        }

        // Add active to section if specified
        if (sectionTitle) {
            const section = this.container.querySelector(
                `.nav-section[data-chapter="${chapterNum}"][data-section="${sectionTitle}"]`
            );
            if (section) {
                section.classList.add('active');
            }
        }
    }

    /**
     * Truncate text
     * @param {string} text - Text to truncate
     * @param {number} length - Max length
     * @returns {string} Truncated text
     */
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
}

// Make Navigation globally available
window.Navigation = Navigation;
