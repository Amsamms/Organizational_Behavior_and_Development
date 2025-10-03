/**
 * Clean Hierarchical Mind Map
 * Simple tree layout with intuitive interactions
 */

class MindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.g = null;
        this.tree = null;
        this.root = null;
        this.allItems = [];

        this.width = 0;
        this.height = 0;
        this.zoom = null;

        // Node dimensions
        this.nodeWidth = 200;
        this.nodeHeight = 60;
        this.horizontalSpacing = 250;
        this.verticalSpacing = 120;

        // Colors
        this.colors = {
            'Part 1': '#3498db',
            'Part 2': '#2ecc71',
            'Part 3': '#e67e22',
            'Part 4': '#9b59b6',
            'root': '#1a1f2e'
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
            this.buildTree();
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

        // Zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 2])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Main group
        this.g = this.svg.append('g');

        // Add arrow marker for links
        const defs = this.svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#4a5568');
    }

    buildTree() {
        // Convert flat items to hierarchy
        const hierarchyData = this.buildHierarchy(this.allItems);

        // Create D3 hierarchy
        this.root = d3.hierarchy(hierarchyData);

        // Create tree layout
        this.tree = d3.tree()
            .nodeSize([this.horizontalSpacing, this.verticalSpacing])
            .separation((a, b) => {
                return a.parent === b.parent ? 1 : 1.2;
            });

        this.tree(this.root);
    }

    buildHierarchy(items) {
        const root = items.find(item => item.id === 'root');

        const buildChildren = (parentId) => {
            return items
                .filter(item => item.parent === parentId)
                .map(item => ({
                    ...item,
                    children: buildChildren(item.id)
                }));
        };

        return {
            ...root,
            children: buildChildren('root')
        };
    }

    render() {
        // Get nodes and links
        const nodes = this.root.descendants();
        const links = this.root.links();

        // Center the tree
        const centerX = this.width / 2;
        const centerY = 80;

        // Render links
        const link = this.g.selectAll('.link')
            .data(links, d => d.target.data.id);

        link.exit().remove();

        const linkEnter = link.enter()
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', d => this.getColor(d.target.data))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.3);

        linkEnter.merge(link)
            .attr('d', d => {
                const sourceX = d.source.x + centerX;
                const sourceY = d.source.y + centerY + this.nodeHeight / 2;
                const targetX = d.target.x + centerX;
                const targetY = d.target.y + centerY - this.nodeHeight / 2;

                return `M ${sourceX},${sourceY}
                        C ${sourceX},${(sourceY + targetY) / 2}
                          ${targetX},${(sourceY + targetY) / 2}
                          ${targetX},${targetY}`;
            });

        // Render nodes
        const node = this.g.selectAll('.node')
            .data(nodes, d => d.data.id);

        node.exit().remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x + centerX},${d.y + centerY})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.handleNodeClick(event, d));

        // Add node rectangle
        nodeEnter.append('rect')
            .attr('class', 'node-rect')
            .attr('x', -this.nodeWidth / 2)
            .attr('y', -this.nodeHeight / 2)
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('rx', 8)
            .attr('fill', d => this.getColor(d.data))
            .attr('stroke', d => this.lightenColor(this.getColor(d.data)))
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 3)
                    .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 2)
                    .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))');
            });

        // Add text label
        nodeEnter.append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', '#ffffff')
            .style('font-size', d => {
                if (d.data.type === 'root') return '16px';
                if (d.data.type === 'part') return '14px';
                return '12px';
            })
            .style('font-weight', d => d.data.type === 'root' || d.data.type === 'part' ? '600' : '500')
            .style('pointer-events', 'none')
            .text(d => this.truncateText(d.data.label, d.data.type));

        // Add expand/collapse indicator
        nodeEnter.filter(d => d.children || d._children)
            .append('circle')
            .attr('class', 'expand-indicator')
            .attr('cx', this.nodeWidth / 2 - 15)
            .attr('cy', 0)
            .attr('r', 10)
            .attr('fill', '#ffffff')
            .attr('stroke', d => this.getColor(d.data))
            .attr('stroke-width', 2);

        nodeEnter.filter(d => d.children || d._children)
            .append('text')
            .attr('class', 'expand-icon')
            .attr('x', this.nodeWidth / 2 - 15)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', d => this.getColor(d.data))
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => d.children ? '−' : '+');

        // Update existing nodes
        node.merge(nodeEnter)
            .transition()
            .duration(500)
            .attr('transform', d => `translate(${d.x + centerX},${d.y + centerY})`);

        // Initial zoom to fit
        setTimeout(() => {
            this.fitToScreen();
        }, 100);
    }

    handleNodeClick(event, d) {
        event.stopPropagation();

        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }

        this.tree(this.root);
        this.render();

        // Dispatch event for content loading
        if (d.data.chapter) {
            const customEvent = new CustomEvent('content:loadChapter', {
                detail: { chapter: d.data }
            });
            document.dispatchEvent(customEvent);
        }
    }

    getColor(data) {
        // Find parent part
        let current = data;
        while (current && current.type !== 'part' && current.type !== 'root') {
            const parent = this.allItems.find(item => item.id === current.parent);
            if (!parent) break;
            current = parent;
        }

        if (current.type === 'part') {
            return this.colors[current.label] || '#3498db';
        }

        return data.color || '#3498db';
    }

    lightenColor(color) {
        const rgb = this.hexToRgb(color);
        return `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 52, g: 152, b: 219 };
    }

    truncateText(text, type) {
        const maxLength = type === 'root' ? 20 : type === 'part' ? 18 : 22;
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '..';
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
        this.fitToScreen();
    }

    fitToScreen() {
        const bounds = this.g.node().getBBox();
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;

        if (fullWidth === 0 || fullHeight === 0) return;

        const scale = 0.9 / Math.max(fullWidth / this.width, fullHeight / this.height);
        const translate = [
            this.width / 2 - scale * midX,
            this.height / 2 - scale * midY
        ];

        this.svg.transition()
            .duration(750)
            .call(
                this.zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
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
        this.svg.attr('viewBox', [0, 0, this.width, this.height]);
        this.render();
    }
}

window.MindMap = MindMap;
