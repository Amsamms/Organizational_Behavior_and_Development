/**
 * Modern Interactive Mind Map with D3.js Force Simulation
 * Fully draggable, zoomable, and collapsible
 */

class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.g = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.expandedNodes = new Set(['root']);
        this.allItems = [];
        this.width = 0;
        this.height = 0;
        this.zoom = null;

        // Color schemes for different parts
        this.colorSchemes = {
            'Part 1': { primary: '#3498db', gradient: ['#3498db', '#2980b9'] },
            'Part 2': { primary: '#2ecc71', gradient: ['#2ecc71', '#27ae60'] },
            'Part 3': { primary: '#e67e22', gradient: ['#e67e22', '#d35400'] },
            'Part 4': { primary: '#9b59b6', gradient: ['#9b59b6', '#8e44ad'] },
            'root': { primary: '#1a1f2e', gradient: ['#2c3e50', '#1a1f2e'] }
        };
    }

    /**
     * Initialize the mind map
     */
    async init(courseData) {
        if (!this.container) {
            console.error('Mind map container not found');
            return;
        }

        try {
            // Get flattened content
            this.allItems = courseData.getFlattenedContent();

            // Set dimensions
            this.updateDimensions();

            // Create SVG
            this.createSVG();

            // Create gradient definitions
            this.createGradients();

            // Initialize data
            this.updateGraphData();

            // Create force simulation
            this.createSimulation();

            // Render
            this.render();

            // Add window resize listener
            window.addEventListener('resize', () => this.handleResize());

            console.log('✅ Modern mind map initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing mind map:', error);
        }
    }

    /**
     * Update container dimensions
     */
    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Create SVG element
     */
    createSVG() {
        // Clear existing SVG
        this.container.innerHTML = '';

        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', [0, 0, this.width, this.height])
            .style('background', 'radial-gradient(circle at center, #1a1f2e 0%, #0f1419 100%)');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Create main group
        this.g = this.svg.append('g');

        // Add glow filter
        const defs = this.svg.append('defs');
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');

        filter.append('feGaussianBlur')
            .attr('stdDeviation', '4')
            .attr('result', 'coloredBlur');

        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    /**
     * Create gradient definitions
     */
    createGradients() {
        const defs = this.svg.select('defs');

        Object.entries(this.colorSchemes).forEach(([key, scheme]) => {
            const gradient = defs.append('radialGradient')
                .attr('id', `gradient-${key.replace(/\s+/g, '-')}`)
                .attr('cx', '30%')
                .attr('cy', '30%');

            gradient.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', scheme.gradient[0])
                .attr('stop-opacity', 1);

            gradient.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', scheme.gradient[1])
                .attr('stop-opacity', 0.8);
        });
    }

    /**
     * Update graph data based on expanded nodes
     */
    updateGraphData() {
        // Filter visible items
        const visibleItems = this.allItems.filter(item => {
            if (item.id === 'root') return true;
            return this.expandedNodes.has(item.parent);
        });

        // Create nodes with enhanced data
        this.nodes = visibleItems.map(item => {
            const hasChildren = this.allItems.some(child => child.parent === item.id);
            const isExpanded = this.expandedNodes.has(item.id);

            return {
                id: item.id,
                label: item.label,
                type: item.type,
                level: item.level,
                color: item.color,
                parent: item.parent,
                hasChildren,
                isExpanded,
                data: item,
                radius: this.getNodeRadius(item),
                // Initialize position if new node
                x: item.x || this.width / 2,
                y: item.y || this.height / 2
            };
        });

        // Create links
        this.links = this.nodes
            .filter(node => node.parent)
            .map(node => ({
                source: node.parent,
                target: node.id,
                strength: this.getLinkStrength(node.level)
            }));
    }

    /**
     * Get node radius based on type and level
     */
    getNodeRadius(item) {
        const radiusMap = {
            'root': 60,
            'part': 45,
            'chapter': 35,
            'takeaway': 25
        };
        return radiusMap[item.type] || 25;
    }

    /**
     * Get link strength based on level
     */
    getLinkStrength(level) {
        return 1 / (level + 1);
    }

    /**
     * Create force simulation
     */
    createSimulation() {
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => {
                    const sourceNode = this.nodes.find(n => n.id === d.source.id);
                    const targetNode = this.nodes.find(n => n.id === d.target.id);
                    return (sourceNode?.radius || 30) + (targetNode?.radius || 30) + 100;
                })
                .strength(d => d.strength))
            .force('charge', d3.forceManyBody()
                .strength(d => d.type === 'root' ? -3000 : -800)
                .distanceMax(400))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.radius + 20)
                .strength(0.7))
            .force('x', d3.forceX(this.width / 2).strength(0.05))
            .force('y', d3.forceY(this.height / 2).strength(0.05))
            .alphaDecay(0.02)
            .velocityDecay(0.4);
    }

    /**
     * Render the graph
     */
    render() {
        // Render links
        const linkGroup = this.g.selectAll('.link-group').data([0]);
        const linkGroupEnter = linkGroup.enter().append('g').attr('class', 'link-group');
        const linkGroupMerge = linkGroupEnter.merge(linkGroup);

        const link = linkGroupMerge.selectAll('.link')
            .data(this.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

        link.exit()
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();

        const linkEnter = link.enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke', d => {
                const targetNode = this.nodes.find(n => n.id === (d.target.id || d.target));
                return targetNode?.color || '#3498db';
            })
            .style('stroke-width', d => {
                const targetNode = this.nodes.find(n => n.id === (d.target.id || d.target));
                return targetNode?.level === 1 ? 4 : targetNode?.level === 2 ? 3 : 2;
            })
            .style('stroke-opacity', 0.4)
            .style('opacity', 0);

        linkEnter.transition()
            .duration(500)
            .style('opacity', 1);

        const linkMerge = linkEnter.merge(link);

        // Render nodes
        const nodeGroup = this.g.selectAll('.node-group').data([0]);
        const nodeGroupEnter = nodeGroup.enter().append('g').attr('class', 'node-group');
        const nodeGroupMerge = nodeGroupEnter.merge(nodeGroup);

        const node = nodeGroupMerge.selectAll('.node')
            .data(this.nodes, d => d.id);

        node.exit()
            .transition()
            .duration(300)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(this.createDragBehavior());

        // Add circles with gradients
        nodeEnter.append('circle')
            .attr('class', 'node-circle')
            .attr('r', 0)
            .style('fill', d => {
                const partLabel = this.getPartLabel(d);
                return `url(#gradient-${partLabel.replace(/\s+/g, '-')})`;
            })
            .style('stroke', d => d.color || '#3498db')
            .style('stroke-width', d => d.type === 'root' ? 4 : 2)
            .style('filter', 'url(#glow)')
            .transition()
            .duration(500)
            .attr('r', d => d.radius);

        // Add labels
        nodeEnter.append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', d => d.radius > 40 ? 5 : 4)
            .style('fill', '#ffffff')
            .style('font-size', d => {
                if (d.type === 'root') return '18px';
                if (d.type === 'part') return '14px';
                if (d.type === 'chapter') return '12px';
                return '10px';
            })
            .style('font-weight', d => d.type === 'root' || d.type === 'part' ? 'bold' : '600')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .text(d => this.truncateLabel(d.label, d.radius))
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1);

        // Add expand/collapse indicator
        nodeEnter.filter(d => d.hasChildren)
            .append('text')
            .attr('class', 'node-indicator')
            .attr('text-anchor', 'middle')
            .attr('dy', d => d.radius + 15)
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .text(d => d.isExpanded ? '▼' : '▶')
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 0.8);

        const nodeMerge = nodeEnter.merge(node);

        // Update existing nodes
        nodeMerge.select('.node-circle')
            .transition()
            .duration(300)
            .attr('r', d => d.radius);

        nodeMerge.select('.node-label')
            .text(d => this.truncateLabel(d.label, d.radius));

        nodeMerge.select('.node-indicator')
            .text(d => d.isExpanded ? '▼' : '▶');

        // Add interactions
        nodeMerge
            .on('click', (event, d) => this.handleNodeClick(event, d))
            .on('mouseover', (event, d) => this.handleNodeHover(event, d, true))
            .on('mouseout', (event, d) => this.handleNodeHover(event, d, false));

        // Update simulation
        this.simulation.nodes(this.nodes);
        this.simulation.force('link').links(this.links);

        // Tick function
        this.simulation.on('tick', () => {
            linkMerge
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodeMerge
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Restart simulation
        this.simulation.alpha(0.3).restart();
    }

    /**
     * Get part label for a node
     */
    getPartLabel(node) {
        if (node.type === 'root') return 'root';

        // Find the part this node belongs to
        let current = node;
        while (current && current.type !== 'part') {
            current = this.nodes.find(n => n.id === current.parent);
        }

        return current ? current.label : 'root';
    }

    /**
     * Truncate label to fit in circle
     */
    truncateLabel(label, radius) {
        const maxChars = Math.floor(radius / 4);
        if (label.length <= maxChars) return label;

        // Split into words and try to fit
        const words = label.split(' ');
        if (words.length === 1) {
            return label.substring(0, maxChars - 2) + '..';
        }

        // Return first few words or abbreviation
        let result = '';
        for (const word of words) {
            if ((result + word).length <= maxChars) {
                result += (result ? ' ' : '') + word;
            } else {
                break;
            }
        }

        return result || words[0].substring(0, maxChars - 2) + '..';
    }

    /**
     * Create drag behavior
     */
    createDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    /**
     * Handle node click
     */
    handleNodeClick(event, node) {
        event.stopPropagation();

        console.log('Node clicked:', node);

        if (node.hasChildren) {
            if (node.isExpanded) {
                this.collapseNode(node.id);
            } else {
                this.expandNode(node.id);
            }
        }

        // Dispatch event
        const customEvent = new CustomEvent('mindmap:nodeClick', {
            detail: { node: node.data }
        });
        document.dispatchEvent(customEvent);

        // Load content if chapter
        if (node.data && node.data.chapter) {
            this.loadChapterContent(node.data);
        }
    }

    /**
     * Handle node hover
     */
    handleNodeHover(event, node, isHover) {
        const circle = d3.select(event.currentTarget).select('.node-circle');

        if (isHover) {
            circle
                .transition()
                .duration(200)
                .attr('r', node.radius * 1.15)
                .style('stroke-width', 4);

            // Show tooltip
            this.showTooltip(event, node);
        } else {
            circle
                .transition()
                .duration(200)
                .attr('r', node.radius)
                .style('stroke-width', node.type === 'root' ? 4 : 2);

            this.hideTooltip();
        }
    }

    /**
     * Show tooltip
     */
    showTooltip(event, node) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'mindmap-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', '#fff')
            .style('padding', '12px 16px')
            .style('border-radius', '8px')
            .style('font-size', '14px')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('max-width', '300px')
            .style('opacity', 0);

        let content = `<strong>${node.label}</strong>`;
        if (node.hasChildren) {
            const childCount = this.allItems.filter(item => item.parent === node.id).length;
            content += `<br><small>${childCount} item${childCount > 1 ? 's' : ''} inside</small>`;
        }
        if (node.data.description) {
            content += `<br><small style="opacity: 0.8">${node.data.description}</small>`;
        }

        tooltip.html(content);

        // Position tooltip
        const [x, y] = d3.pointer(event, document.body);
        tooltip
            .style('left', (x + 15) + 'px')
            .style('top', (y - 15) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        d3.selectAll('.mindmap-tooltip').remove();
    }

    /**
     * Expand node
     */
    expandNode(nodeId) {
        this.expandedNodes.add(nodeId);
        this.updateGraphData();
        this.render();
    }

    /**
     * Collapse node
     */
    collapseNode(nodeId) {
        const removeDescendants = (id) => {
            this.expandedNodes.delete(id);
            const children = this.allItems.filter(item => item.parent === id);
            children.forEach(child => removeDescendants(child.id));
        };

        removeDescendants(nodeId);
        this.updateGraphData();
        this.render();
    }

    /**
     * Load chapter content
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
        this.svg.transition()
            .duration(300)
            .call(this.zoom.scaleBy, 1.3);
    }

    zoomOut() {
        this.svg.transition()
            .duration(300)
            .call(this.zoom.scaleBy, 0.7);
    }

    resetZoom() {
        this.svg.transition()
            .duration(500)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * Export as image
     */
    async exportAsImage() {
        try {
            const svgElement = this.svg.node();
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);

            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;

            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'organizational-behavior-mindmap.png';
                    link.click();
                    URL.revokeObjectURL(url);
                });
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        } catch (error) {
            console.error('Error exporting mind map:', error);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.updateDimensions();
        this.svg.attr('viewBox', [0, 0, this.width, this.height]);
        this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
        this.simulation.alpha(0.3).restart();
    }
}

// Make MindMap globally available
window.MindMap = MindMap;
