/**
 * Mind Map Module
 * Creates interactive mind map visualization using vis.js
 */

class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.network = null;
        this.nodes = null;
        this.edges = null;
        this.expandedNodes = new Set(['root']); // Track which nodes are expanded
        this.allItems = []; // Store all content items
    }

    /**
     * Initialize and render the mind map
     * @param {Object} courseData - Course data object
     */
    async init(courseData) {
        if (!this.container) {
            console.error('Mind map container not found');
            return;
        }

        try {
            // Get flattened content
            this.allItems = courseData.getFlattenedContent();

            // Create nodes and edges (initially showing only root + parts)
            this.createNodesAndEdges();

            // Configure network options
            const options = this.getNetworkOptions();

            // Create network
            this.network = new vis.Network(this.container, {
                nodes: this.nodes,
                edges: this.edges
            }, options);

            // Wait for stabilization before fitting
            this.network.once('stabilizationIterationsDone', () => {
                this.network.fit({ animation: { duration: 1000 } });
            });

            // Fallback fit after timeout
            setTimeout(() => {
                this.network.fit({ animation: { duration: 1000 } });
            }, 1000);

            // Add event listeners
            this.attachEventListeners();

            console.log('✅ Mind map initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing mind map:', error);
        }
    }

    /**
     * Create nodes and edges from content items
     * Only shows nodes whose parents are expanded
     */
    createNodesAndEdges() {
        const nodesArray = [];
        const edgesArray = [];

        // Get visible items (root + children of expanded nodes)
        const visibleItems = this.allItems.filter(item => {
            if (item.id === 'root') return true;
            return this.expandedNodes.has(item.parent);
        });

        visibleItems.forEach(item => {
            // Check if this node has children
            const hasChildren = this.allItems.some(child => child.parent === item.id);
            const isExpanded = this.expandedNodes.has(item.id);

            // Add expand/collapse indicator to label
            let label = item.label;
            if (hasChildren) {
                label = isExpanded ? `▼ ${label}` : `▶ ${label}`;
            }

            // Create node
            const node = {
                id: item.id,
                label: label,
                level: item.level,
                color: this.getNodeColor(item),
                font: this.getNodeFont(item),
                shape: this.getNodeShape(item),
                size: this.getNodeSize(item),
                data: item // Store original item data
            };

            nodesArray.push(node);

            // Create edge to parent
            if (item.parent && visibleItems.some(v => v.id === item.parent)) {
                const edge = {
                    from: item.parent,
                    to: item.id,
                    color: {
                        color: item.color || '#3c4251',
                        opacity: 0.6
                    },
                    width: this.getEdgeWidth(item.level),
                    smooth: {
                        type: 'cubicBezier',
                        roundness: 0.5
                    }
                };

                edgesArray.push(edge);
            }
        });

        if (this.nodes) {
            this.nodes.clear();
            this.nodes.add(nodesArray);
            this.edges.clear();
            this.edges.add(edgesArray);
        } else {
            this.nodes = new vis.DataSet(nodesArray);
            this.edges = new vis.DataSet(edgesArray);
        }
    }

    /**
     * Get node color based on item type
     * @param {Object} item - Content item
     * @returns {Object} Color configuration
     */
    getNodeColor(item) {
        const baseColor = item.color || '#3498db';

        const colorConfig = {
            root: {
                background: '#1a1f2e',
                border: baseColor,
                highlight: {
                    background: '#242936',
                    border: baseColor
                }
            },
            part: {
                background: baseColor,
                border: this.lightenColor(baseColor, 20),
                highlight: {
                    background: this.lightenColor(baseColor, 10),
                    border: this.lightenColor(baseColor, 30)
                }
            },
            chapter: {
                background: this.adjustAlpha(baseColor, 0.8),
                border: baseColor,
                highlight: {
                    background: baseColor,
                    border: this.lightenColor(baseColor, 20)
                }
            },
            takeaway: {
                background: this.adjustAlpha(baseColor, 0.3),
                border: this.adjustAlpha(baseColor, 0.6),
                highlight: {
                    background: this.adjustAlpha(baseColor, 0.5),
                    border: baseColor
                }
            }
        };

        return colorConfig[item.type] || colorConfig.takeaway;
    }

    /**
     * Get node font configuration
     * @param {Object} item - Content item
     * @returns {Object} Font configuration
     */
    getNodeFont(item) {
        const fontSizes = {
            root: 32,
            part: 24,
            chapter: 18,
            takeaway: 14
        };

        const fontWeights = {
            root: 'bold',
            part: 'bold',
            chapter: '600',
            takeaway: 'normal'
        };

        return {
            size: fontSizes[item.type] || 14,
            color: item.type === 'root' || item.type === 'part' ? '#ffffff' : '#e8eaed',
            face: 'Inter, sans-serif',
            bold: fontWeights[item.type]
        };
    }

    /**
     * Get node shape based on item type
     * @param {Object} item - Content item
     * @returns {string} Shape type
     */
    getNodeShape(item) {
        const shapes = {
            root: 'box',
            part: 'box',
            chapter: 'ellipse',
            takeaway: 'ellipse'
        };

        return shapes[item.type] || 'ellipse';
    }

    /**
     * Get node size based on item type
     * @param {Object} item - Content item
     * @returns {number} Node size
     */
    getNodeSize(item) {
        const sizes = {
            root: 50,
            part: 40,
            chapter: 30,
            takeaway: 20
        };

        return sizes[item.type] || 20;
    }

    /**
     * Get edge width based on level
     * @param {number} level - Hierarchy level
     * @returns {number} Edge width
     */
    getEdgeWidth(level) {
        const widths = {
            1: 4,
            2: 3,
            3: 2
        };

        return widths[level] || 1;
    }

    /**
     * Get network configuration options
     * @returns {Object} vis.js options
     */
    getNetworkOptions() {
        return {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'UD',
                    sortMethod: 'directed',
                    levelSeparation: 200,
                    nodeSpacing: 200,
                    treeSpacing: 300,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true
                }
            },
            physics: {
                enabled: true,
                hierarchicalRepulsion: {
                    centralGravity: 0.0,
                    springLength: 100,
                    springConstant: 0.01,
                    nodeDistance: 120,
                    damping: 0.09
                },
                solver: 'hierarchicalRepulsion',
                stabilization: {
                    enabled: true,
                    iterations: 1000
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true,
                navigationButtons: false,
                keyboard: {
                    enabled: true,
                    bindToWindow: false
                }
            },
            nodes: {
                borderWidth: 2,
                borderWidthSelected: 4,
                margin: 10,
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 0, 0, 0.5)',
                    size: 10,
                    x: 0,
                    y: 3
                }
            },
            edges: {
                arrows: {
                    to: {
                        enabled: false
                    }
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 0, 0, 0.3)',
                    size: 5,
                    x: 0,
                    y: 2
                }
            }
        };
    }

    /**
     * Attach event listeners to network
     */
    attachEventListeners() {
        // Click event
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = this.nodes.get(nodeId);
                this.onNodeClick(node);
            }
        });

        // Double click to focus
        this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.network.focus(nodeId, {
                    scale: 1.5,
                    animation: {
                        duration: 1000,
                        easingFunction: 'easeInOutQuad'
                    }
                });
            }
        });

        // Hover effects
        this.network.on('hoverNode', () => {
            this.container.style.cursor = 'pointer';
        });

        this.network.on('blurNode', () => {
            this.container.style.cursor = 'default';
        });
    }

    /**
     * Handle node click event
     * @param {Object} node - Clicked node
     */
    onNodeClick(node) {
        console.log('Node clicked:', node);

        // Check if this node has children
        const hasChildren = this.allItems.some(item => item.parent === node.id);

        if (hasChildren) {
            // Toggle expansion
            if (this.expandedNodes.has(node.id)) {
                this.collapseNode(node.id);
            } else {
                this.expandNode(node.id);
            }
        }

        // Dispatch custom event for other modules to handle
        const event = new CustomEvent('mindmap:nodeClick', {
            detail: { node }
        });
        document.dispatchEvent(event);

        // If it's a chapter node, load its content
        if (node.data && node.data.chapter) {
            this.loadChapterContent(node.data);
        }
    }

    /**
     * Expand a node to show its children
     * @param {string} nodeId - Node ID to expand
     */
    expandNode(nodeId) {
        this.expandedNodes.add(nodeId);
        this.createNodesAndEdges();

        // Smooth animation after expansion
        setTimeout(() => {
            this.network.fit({
                animation: {
                    duration: 500,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }, 100);
    }

    /**
     * Collapse a node to hide its children
     * @param {string} nodeId - Node ID to collapse
     */
    collapseNode(nodeId) {
        // Remove this node and all its descendants from expanded set
        const removeDescendants = (id) => {
            this.expandedNodes.delete(id);
            const children = this.allItems.filter(item => item.parent === id);
            children.forEach(child => removeDescendants(child.id));
        };

        removeDescendants(nodeId);
        this.createNodesAndEdges();

        // Smooth animation after collapse
        setTimeout(() => {
            this.network.fit({
                animation: {
                    duration: 500,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }, 100);
    }

    /**
     * Load chapter content in content panel
     * @param {Object} chapter - Chapter data
     */
    loadChapterContent(chapter) {
        const event = new CustomEvent('content:loadChapter', {
            detail: { chapter }
        });
        document.dispatchEvent(event);
    }

    /**
     * Zoom controls
     */
    zoomIn() {
        const scale = this.network.getScale();
        this.network.moveTo({
            scale: scale * 1.2,
            animation: { duration: 300 }
        });
    }

    zoomOut() {
        const scale = this.network.getScale();
        this.network.moveTo({
            scale: scale * 0.8,
            animation: { duration: 300 }
        });
    }

    resetZoom() {
        this.network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    }

    /**
     * Export mind map as image
     */
    async exportAsImage() {
        try {
            const canvas = this.container.querySelector('canvas');
            if (!canvas) {
                console.error('Canvas not found');
                return;
            }

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'organizational-behavior-mindmap.png';
                link.click();
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error('Error exporting mind map:', error);
        }
    }

    /**
     * Utility: Lighten color
     * @param {string} color - Hex color
     * @param {number} percent - Lighten percentage
     * @returns {string} Lightened color
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * Utility: Adjust color alpha
     * @param {string} color - Hex color
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color
     */
    adjustAlpha(color, alpha) {
        const num = parseInt(color.replace('#', ''), 16);
        const R = (num >> 16);
        const G = (num >> 8 & 0x00FF);
        const B = (num & 0x0000FF);
        return `rgba(${R}, ${G}, ${B}, ${alpha})`;
    }
}

// Make MindMap globally available
window.MindMap = MindMap;
