/**
 * Simple Vertical Mind Map
 * Clean, intuitive tree layout
 */

class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.g = null;
        this.allItems = [];
        this.expandedNodes = new Set(['root']);

        this.width = 0;
        this.height = 0;
        this.zoom = null;

        // Layout settings
        this.nodeWidth = 280;
        this.nodeHeight = 70;
        this.levelHeight = 150;
        this.siblingSpacing = 20;

        // Colors
        this.colors = {
            'Part 1': '#3498db',
            'Part 2': '#2ecc71',
            'Part 3': '#e67e22',
            'Part 4': '#9b59b6',
            'root': '#2c3e50'
        };
    }

    async init(courseData) {
        if (!this.container) {
            console.error('Mind map container not found');
            return;
        }

        try {
            this.allItems = courseData.getFlattenedContent();
            this.updateDimensions();
            this.createSVG();
            this.render();

            window.addEventListener('resize', () => this.handleResize());

            console.log('✅ Mind map initialized');
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
    }

    createSVG() {
        this.container.innerHTML = '';

        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('background', 'radial-gradient(circle at center, #1a1f2e 0%, #0f1419 100%)');

        // Zoom and pan
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 2])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Main group
        this.g = this.svg.append('g');
    }

    render() {
        // Get visible nodes
        const visibleNodes = this.getVisibleNodes();

        // Calculate positions
        const positioned = this.calculatePositions(visibleNodes);

        // Render links first
        this.renderLinks(positioned);

        // Then render nodes
        this.renderNodes(positioned);

        // Center view
        this.centerView(positioned);
    }

    getVisibleNodes() {
        return this.allItems.filter(item => {
            if (item.id === 'root') return true;
            return this.expandedNodes.has(item.parent);
        });
    }

    calculatePositions(nodes) {
        const positioned = [];
        const levels = {};

        // Group by level
        nodes.forEach(node => {
            if (!levels[node.level]) {
                levels[node.level] = [];
            }
            levels[node.level].push(node);
        });

        // Position each level
        let currentY = 50;

        Object.keys(levels).sort((a, b) => a - b).forEach(levelKey => {
            const levelNodes = levels[levelKey];
            const levelWidth = (this.nodeWidth + this.siblingSpacing) * levelNodes.length - this.siblingSpacing;
            let currentX = -levelWidth / 2;

            levelNodes.forEach(node => {
                positioned.push({
                    ...node,
                    x: currentX + this.nodeWidth / 2,
                    y: currentY,
                    hasChildren: this.allItems.some(item => item.parent === node.id),
                    isExpanded: this.expandedNodes.has(node.id)
                });

                currentX += this.nodeWidth + this.siblingSpacing;
            });

            currentY += this.levelHeight;
        });

        return positioned;
    }

    renderLinks(nodes) {
        const links = [];

        nodes.forEach(node => {
            if (node.parent) {
                const parent = nodes.find(n => n.id === node.parent);
                if (parent) {
                    links.push({ source: parent, target: node });
                }
            }
        });

        const link = this.g.selectAll('.link')
            .data(links, d => `${d.source.id}-${d.target.id}`);

        link.exit().remove();

        const linkEnter = link.enter()
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', d => this.getNodeColor(d.target))
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 0.4);

        linkEnter.merge(link)
            .attr('d', d => {
                const sx = d.source.x;
                const sy = d.source.y + this.nodeHeight / 2;
                const tx = d.target.x;
                const ty = d.target.y - this.nodeHeight / 2;

                const midY = (sy + ty) / 2;

                return `M ${sx},${sy}
                        C ${sx},${midY} ${tx},${midY} ${tx},${ty}`;
            });
    }

    renderNodes(nodes) {
        const node = this.g.selectAll('.node')
            .data(nodes, d => d.id);

        node.exit().remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.handleNodeClick(event, d));

        // Node background
        nodeEnter.append('rect')
            .attr('class', 'node-bg')
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('rx', 12)
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => this.lightenColor(this.getNodeColor(d)))
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 3)
                    .style('filter', 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 2)
                    .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))');
            });

        // Node text
        nodeEnter.append('text')
            .attr('class', 'node-text')
            .attr('x', this.nodeWidth / 2)
            .attr('y', this.nodeHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', '#ffffff')
            .style('font-size', d => {
                if (d.type === 'root') return '18px';
                if (d.type === 'part') return '16px';
                return '14px';
            })
            .style('font-weight', d => d.type === 'root' || d.type === 'part' ? '700' : '600')
            .style('pointer-events', 'none')
            .text(d => this.truncateText(d.label));

        // Expand/collapse button
        const btnGroup = nodeEnter.filter(d => d.hasChildren)
            .append('g')
            .attr('class', 'expand-btn');

        btnGroup.append('circle')
            .attr('cx', this.nodeWidth / 2)
            .attr('cy', this.nodeHeight + 15)
            .attr('r', 14)
            .attr('fill', '#ffffff')
            .attr('stroke', d => this.getNodeColor(d))
            .attr('stroke-width', 2);

        btnGroup.append('text')
            .attr('x', this.nodeWidth / 2)
            .attr('y', this.nodeHeight + 15)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', d => this.getNodeColor(d))
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => d.isExpanded ? '−' : '+');

        // Update positions
        nodeEnter.merge(node)
            .transition()
            .duration(500)
            .attr('transform', d => `translate(${d.x - this.nodeWidth / 2}, ${d.y - this.nodeHeight / 2})`);
    }

    handleNodeClick(event, node) {
        event.stopPropagation();

        if (node.hasChildren) {
            if (this.expandedNodes.has(node.id)) {
                this.collapseNode(node.id);
            } else {
                this.expandedNodes.add(node.id);
            }
            this.render();
        }

        // Load content
        if (node.chapter) {
            const customEvent = new CustomEvent('content:loadChapter', {
                detail: { chapter: node }
            });
            document.dispatchEvent(customEvent);
        }
    }

    collapseNode(nodeId) {
        const removeDescendants = (id) => {
            this.expandedNodes.delete(id);
            const children = this.allItems.filter(item => item.parent === id);
            children.forEach(child => removeDescendants(child.id));
        };

        removeDescendants(nodeId);
    }

    getNodeColor(node) {
        // Find the parent part
        let current = node;
        while (current && current.type !== 'part' && current.type !== 'root') {
            const parent = this.allItems.find(item => item.id === current.parent);
            if (!parent) break;
            current = parent;
        }

        if (current.type === 'part') {
            return this.colors[current.label] || '#3498db';
        }

        if (current.type === 'root') {
            return this.colors.root;
        }

        return node.color || '#3498db';
    }

    lightenColor(color) {
        const rgb = this.hexToRgb(color);
        return `rgb(${Math.min(255, rgb.r + 50)}, ${Math.min(255, rgb.g + 50)}, ${Math.min(255, rgb.b + 50)})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 52, g: 152, b: 219 };
    }

    truncateText(text) {
        const maxLength = 30;
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '..';
    }

    centerView(nodes) {
        if (nodes.length === 0) return;

        setTimeout(() => {
            const xs = nodes.map(n => n.x);
            const ys = nodes.map(n => n.y);

            const minX = Math.min(...xs) - this.nodeWidth / 2;
            const maxX = Math.max(...xs) + this.nodeWidth / 2;
            const minY = Math.min(...ys) - this.nodeHeight / 2;
            const maxY = Math.max(...ys) + this.nodeHeight / 2 + 30;

            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;

            const scale = Math.min(
                (this.width * 0.9) / contentWidth,
                (this.height * 0.9) / contentHeight,
                1.5
            );

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const translateX = this.width / 2 - centerX * scale;
            const translateY = this.height / 2 - centerY * scale;

            this.svg.transition()
                .duration(750)
                .call(
                    this.zoom.transform,
                    d3.zoomIdentity.translate(translateX, translateY).scale(scale)
                );
        }, 100);
    }

    // Controls
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
        const nodes = this.getVisibleNodes();
        const positioned = this.calculatePositions(nodes);
        this.centerView(positioned);
    }

    async exportAsImage() {
        try {
            const svgElement = this.svg.node();
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);

            const canvas = document.createElement('canvas');
            canvas.width = this.width * 2;
            canvas.height = this.height * 2;

            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'ob-mindmap.png';
                    link.click();
                    URL.revokeObjectURL(url);
                });
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        } catch (error) {
            console.error('Export error:', error);
        }
    }

    handleResize() {
        this.updateDimensions();
        this.render();
    }
}

window.MindMap = MindMap;
