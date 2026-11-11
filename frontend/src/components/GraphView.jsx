/**
 * Interactive 2D Force Graph component using react-force-graph-2d.
 * Features strict editorial styling, muted community colors, floating pure white panel,
 * and subtle typography.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const COMMUNITY_PALETTE = [
  '#7A1620', // Oxblood
  '#2A2A2A', // Dark ash
  '#6B6B6B', // Mid ash
  '#A3A3A3', // Light ash
  '#9C5A5F', // Rosewood
  '#4A4A4A', // Slate
  '#BDB6AC', // Warm parchment
  '#3B2A2C', // Deep bronze
];

export default function GraphView({
  data = { nodes: [], links: [] },
  selectedNode = null,
  onNodeClick,
  height = 500,
  width,
}) {
  const fgRef = useRef();

  // Get color for community index
  const getNodeColor = useCallback(
    (node) => {
      if (selectedNode && selectedNode.id === node.id) {
        return '#7A1620';
      }
      const commId = node.community !== undefined && node.community >= 0 ? node.community : 0;
      return COMMUNITY_PALETTE[commId % COMMUNITY_PALETTE.length];
    },
    [selectedNode]
  );

  // Auto zoom-to-fit on initial graph load
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 40);
      }, 300);
    }
  }, [data]);

  // Center on selected node
  useEffect(() => {
    if (fgRef.current && selectedNode && selectedNode.x !== undefined) {
      fgRef.current.centerAt(selectedNode.x, selectedNode.y, 400);
      fgRef.current.zoom(2.5, 400);
    }
  }, [selectedNode]);

  // Custom node drawing: clean solid circle with crisp serif/sans label on zoom/hover
  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const radius = isSelected ? 6.5 : 4.5;
      const color = getNodeColor(node);

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();

      // Outer ring for selected node
      if (isSelected) {
        ctx.strokeStyle = '#7A1620';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI, false);
        ctx.stroke();
      }

      // Draw label when zoomed in or selected
      const showLabel = globalScale > 1.2 || isSelected;
      if (showLabel) {
        const label = node.label || node.id;
        const fontSize = Math.max(10 / globalScale, 3.5);
        ctx.font = `${isSelected ? '600' : '500'} ${fontSize}px "Manrope", sans-serif`;
        ctx.fillStyle = '#0E0E0E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, node.x, node.y + radius + 2);
      }
    },
    [selectedNode, getNodeColor]
  );

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#FFFFFF',
        border: '1px solid #D3D0CA',
        boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
        borderRadius: 'var(--radius-xs)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={width}
        height={height}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        linkColor={() => '#D3D0CA'}
        linkWidth={1}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#A3A3A3'}
        cooldownTicks={100}
        onNodeClick={(node) => {
          if (onNodeClick) onNodeClick(node);
        }}
        enableNodeDrag={true}
        enableZoomInteraction={true}
      />
    </div>
  );
}
