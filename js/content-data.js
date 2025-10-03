/**
 * Content Data Module
 * Loads and manages course content from JSON file
 */

class ContentData {
    constructor() {
        this.courseData = null;
        this.loadingPromise = null;
    }

    /**
     * Load course content from JSON file
     * @returns {Promise<Object>} Course data
     */
    async load() {
        if (this.courseData) {
            return this.courseData;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = fetch('data/course-content.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.courseData = data;
                console.log('✅ Course content loaded successfully', data);
                return data;
            })
            .catch(error => {
                console.error('❌ Error loading course content:', error);
                throw error;
            });

        return this.loadingPromise;
    }

    /**
     * Get all course parts
     * @returns {Array} Array of course parts
     */
    getParts() {
        return this.courseData?.parts || [];
    }

    /**
     * Get all chapters
     * @returns {Array} Array of chapters
     */
    getChapters() {
        return this.courseData?.chapters || [];
    }

    /**
     * Get chapter by number
     * @param {number} chapterNum - Chapter number
     * @returns {Object|null} Chapter object or null
     */
    getChapter(chapterNum) {
        return this.courseData?.chapters.find(ch => ch.chapter === chapterNum) || null;
    }

    /**
     * Get part by number
     * @param {number} partNum - Part number
     * @returns {Object|null} Part object or null
     */
    getPart(partNum) {
        return this.courseData?.parts.find(p => p.part === partNum) || null;
    }

    /**
     * Get chapters for a specific part
     * @param {number} partNum - Part number
     * @returns {Array} Array of chapter objects
     */
    getChaptersByPart(partNum) {
        const part = this.getPart(partNum);
        if (!part) return [];

        return part.chapters.map(chNum => this.getChapter(chNum)).filter(Boolean);
    }

    /**
     * Search content across all chapters
     * @param {string} query - Search query
     * @returns {Array} Array of search results
     */
    search(query) {
        if (!query || !this.courseData) return [];

        const results = [];
        const lowerQuery = query.toLowerCase();

        this.courseData.chapters.forEach(chapter => {
            // Search in chapter title
            if (chapter.title.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'chapter',
                    chapter: chapter.chapter,
                    title: chapter.title,
                    match: chapter.title,
                    context: chapter.overview
                });
            }

            // Search in overview
            if (chapter.overview?.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'overview',
                    chapter: chapter.chapter,
                    title: chapter.title,
                    match: 'Overview',
                    context: this.getContextSnippet(chapter.overview, lowerQuery)
                });
            }

            // Search in key takeaways
            chapter.keyTakeaways?.forEach((takeaway, index) => {
                if (takeaway.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        type: 'takeaway',
                        chapter: chapter.chapter,
                        title: chapter.title,
                        match: `Key Takeaway #${index + 1}`,
                        context: takeaway
                    });
                }
            });

            // Search in sections (if available)
            if (chapter.sections) {
                this.searchSections(chapter.sections, chapter, lowerQuery, results);
            }
        });

        return results;
    }

    /**
     * Recursively search through sections
     * @param {Array} sections - Array of sections
     * @param {Object} chapter - Chapter object
     * @param {string} query - Search query (lowercase)
     * @param {Array} results - Results array to populate
     */
    searchSections(sections, chapter, query, results) {
        sections.forEach(section => {
            // Search in section title
            if (section.title?.toLowerCase().includes(query)) {
                results.push({
                    type: 'section',
                    chapter: chapter.chapter,
                    title: chapter.title,
                    match: section.title,
                    context: section.content || ''
                });
            }

            // Search in section content
            if (section.content?.toLowerCase().includes(query)) {
                results.push({
                    type: 'content',
                    chapter: chapter.chapter,
                    title: chapter.title,
                    match: section.title,
                    context: this.getContextSnippet(section.content, query)
                });
            }

            // Search in concepts
            section.concepts?.forEach(concept => {
                if (concept.name?.toLowerCase().includes(query) ||
                    concept.definition?.toLowerCase().includes(query)) {
                    results.push({
                        type: 'concept',
                        chapter: chapter.chapter,
                        title: chapter.title,
                        match: concept.name,
                        context: concept.definition
                    });
                }
            });

            // Recursively search subsections
            if (section.subsections && section.subsections.length > 0) {
                this.searchSections(section.subsections, chapter, query, results);
            }
        });
    }

    /**
     * Get context snippet around search query
     * @param {string} text - Full text
     * @param {string} query - Search query (lowercase)
     * @returns {string} Context snippet
     */
    getContextSnippet(text, query) {
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(query);

        if (index === -1) return text.substring(0, 150) + '...';

        const start = Math.max(0, index - 60);
        const end = Math.min(text.length, index + query.length + 90);

        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        return snippet;
    }

    /**
     * Get total count of concepts across all chapters
     * @returns {number} Total concept count
     */
    getTotalConceptCount() {
        let count = 0;

        this.courseData?.chapters.forEach(chapter => {
            // Count key takeaways
            count += chapter.keyTakeaways?.length || 0;

            // Count concepts in sections
            if (chapter.sections) {
                count += this.countSectionConcepts(chapter.sections);
            }
        });

        return count;
    }

    /**
     * Recursively count concepts in sections
     * @param {Array} sections - Array of sections
     * @returns {number} Concept count
     */
    countSectionConcepts(sections) {
        let count = 0;

        sections.forEach(section => {
            count += section.concepts?.length || 0;

            if (section.subsections) {
                count += this.countSectionConcepts(section.subsections);
            }
        });

        return count;
    }

    /**
     * Get course metadata
     * @returns {Object} Course metadata
     */
    getMetadata() {
        if (!this.courseData) return {};

        return {
            title: this.courseData.courseTitle,
            level: this.courseData.courseLevel,
            university: this.courseData.university,
            instructor: this.courseData.instructor,
            date: this.courseData.date
        };
    }

    /**
     * Get flattened list of all content items for mind map
     * @returns {Array} Array of content items with hierarchy info
     */
    getFlattenedContent() {
        const items = [];

        // Add root with explicit level for vis.js hierarchical layout
        items.push({
            id: 'root',
            label: this.courseData.courseTitle,
            type: 'root',
            level: 0,
            hierarchyLevel: 0  // Explicit level for vis.js
        });

        // Add parts and chapters
        this.courseData.parts.forEach(part => {
            const partId = `part-${part.part}`;
            items.push({
                id: partId,
                label: part.title,
                type: 'part',
                level: 1,
                hierarchyLevel: 1,  // Explicit level for vis.js
                parent: 'root',
                color: part.color,
                partNumber: part.part
            });

            // Add chapters in this part
            const chapters = this.getChaptersByPart(part.part);
            chapters.forEach(chapter => {
                const chapterId = `chapter-${chapter.chapter}`;
                items.push({
                    id: chapterId,
                    label: `Ch ${chapter.chapter}: ${chapter.title}`,
                    type: 'chapter',
                    level: 2,
                    parent: partId,
                    color: part.color,
                    chapterNumber: chapter.chapter,
                    data: chapter
                });

                // Add main topics from key takeaways (first 5)
                chapter.keyTakeaways?.slice(0, 5).forEach((takeaway, index) => {
                    items.push({
                        id: `${chapterId}-takeaway-${index}`,
                        label: takeaway.substring(0, 60) + (takeaway.length > 60 ? '...' : ''),
                        type: 'takeaway',
                        level: 3,
                        parent: chapterId,
                        color: part.color
                    });
                });
            });
        });

        return items;
    }
}

// Create and export singleton instance
const contentData = new ContentData();

// Make it globally available
window.ContentData = contentData;
