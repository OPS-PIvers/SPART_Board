import React, { useRef, useState, useMemo } from 'react';
import { useDashboard } from '@/context/useDashboard';
import {
  WidgetComponentProps,
  ConceptWebConfig,
  ConceptNode,
  ConceptEdge,
} from '@/types';
import { Trash2 } from 'lucide-react';

export const ConceptWebWidget: React.FC<WidgetComponentProps> = ({
  widget,
  isStudentView,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ConceptWebConfig;
  const nodes = useMemo(() => config.nodes ?? [], [config.nodes]);
  const edges = useMemo(() => config.edges ?? [], [config.edges]);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- LOCAL DRAG STATE (Nodes) ---
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeNodePos, setActiveNodePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // --- LOCAL DRAW LINE STATE (Edges) ---
  const [drawingFromId, setDrawingFromId] = useState<string | null>(null);
  const [drawingLineEnd, setDrawingLineEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Node dimensions to center lines
  const NODE_WIDTH = 120;
  const NODE_HEIGHT = 80;

  const handleAddNode = () => {
    if (isStudentView) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 300;

    // Add some random offset so they don't stack perfectly perfectly
    const offset = Math.random() * 40 - 20;

    const newNode: ConceptNode = {
      id: crypto.randomUUID(),
      text: '',
      x: centerX - NODE_WIDTH / 2 + offset,
      y: centerY - NODE_HEIGHT / 2 + offset,
      bgColor: '#fdf0d5',
    };

    updateWidget(widget.id, {
      config: {
        ...config,
        nodes: [...nodes, newNode],
      },
    });
  };

  const handleNodeTextChange = (id: string, text: string) => {
    if (isStudentView) return;
    const updated = nodes.map((n) => (n.id === id ? { ...n, text } : n));
    updateWidget(widget.id, { config: { ...config, nodes: updated } });
  };

  const handleDeleteNode = (id: string) => {
    if (isStudentView) return;
    const remainingNodes = nodes.filter((n) => n.id !== id);
    const remainingEdges = edges.filter(
      (e) => e.sourceNodeId !== id && e.targetNodeId !== id
    );
    updateWidget(widget.id, {
      config: { ...config, nodes: remainingNodes, edges: remainingEdges },
    });
  };

  // --- DRAG NODE HANDLERS ---
  const handleNodePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    node: ConceptNode
  ) => {
    if (isStudentView) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName.toLowerCase() === 'textarea' ||
      target.closest('button') ||
      target.closest('.handle')
    ) {
      return;
    }
    e.stopPropagation();
    target.setPointerCapture(e.pointerId);
    setActiveNodeId(node.id);
    setActiveNodePos({ x: node.x, y: node.y });
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeNodeId || isStudentView || !activeNodePos) return;
    e.stopPropagation();
    setActiveNodePos((prev) =>
      prev ? { x: prev.x + e.movementX, y: prev.y + e.movementY } : null
    );
  };

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeNodeId || isStudentView || !activeNodePos) return;
    e.stopPropagation();
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    const updated = nodes.map((n) =>
      n.id === activeNodeId
        ? { ...n, x: activeNodePos.x, y: activeNodePos.y }
        : n
    );
    updateWidget(widget.id, { config: { ...config, nodes: updated } });

    setActiveNodeId(null);
    setActiveNodePos(null);
  };

  // --- DRAW EDGE HANDLERS ---
  const handleHandlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (isStudentView) return;
    e.stopPropagation();
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDrawingFromId(nodeId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDrawingLineEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingFromId || isStudentView) return;
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDrawingLineEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingFromId || isStudentView) return;
    e.stopPropagation();
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    // Hide the drawing elements and handles temporarily to let elementFromPoint find the node beneath
    const droppedOn = document.elementFromPoint(e.clientX, e.clientY);
    const targetNodeElement = droppedOn?.closest(
      '[data-node-id]'
    ) as HTMLElement | null;

    if (targetNodeElement) {
      const targetNodeId = targetNodeElement.getAttribute('data-node-id');
      if (targetNodeId && targetNodeId !== drawingFromId) {
        const exists = edges.some(
          (edge) =>
            edge.sourceNodeId === drawingFromId &&
            edge.targetNodeId === targetNodeId
        );
        if (!exists) {
          const newEdge: ConceptEdge = {
            id: crypto.randomUUID(),
            sourceNodeId: drawingFromId,
            targetNodeId,
            lineStyle: 'solid',
          };
          updateWidget(widget.id, {
            config: { ...config, edges: [...edges, newEdge] },
          });
        }
      }
    }

    setDrawingFromId(null);
    setDrawingLineEnd(null);
  };

  const displayNodes = useMemo(() => {
    return nodes.map((n) => {
      if (n.id === activeNodeId && activeNodePos) {
        return { ...n, x: activeNodePos.x, y: activeNodePos.y };
      }
      return n;
    });
  }, [nodes, activeNodeId, activeNodePos]);

  const sourceDrawNode = useMemo(() => {
    if (!drawingFromId) return null;
    return displayNodes.find((n) => n.id === drawingFromId);
  }, [drawingFromId, displayNodes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-50 rounded-xl select-none"
      style={{
        fontFamily: config.fontFamily === 'sans' ? 'sans-serif' : 'inherit',
      }}
    >
      {!isStudentView && (
        <button
          className="absolute top-2 left-2 z-20 px-3 py-1 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 pointer-events-auto"
          onClick={handleAddNode}
        >
          + Add Node
        </button>
      )}

      <svg className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const source = displayNodes.find((n) => n.id === edge.sourceNodeId);
          const target = displayNodes.find((n) => n.id === edge.targetNodeId);
          if (!source || !target) return null;

          const x1 = source.x + NODE_WIDTH / 2;
          const y1 = source.y + NODE_HEIGHT / 2;
          const x2 = target.x + NODE_WIDTH / 2;
          const y2 = target.y + NODE_HEIGHT / 2;

          return (
            <path
              key={edge.id}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke="#94a3b8"
              strokeWidth="3"
              strokeDasharray={edge.lineStyle === 'dashed' ? '5,5' : 'none'}
              markerEnd="url(#arrowhead)"
              className="pointer-events-auto cursor-pointer"
            />
          );
        })}

        {sourceDrawNode && drawingLineEnd && (
          <path
            d={`M ${sourceDrawNode.x + NODE_WIDTH / 2} ${sourceDrawNode.y + NODE_HEIGHT / 2} L ${drawingLineEnd.x} ${drawingLineEnd.y}`}
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="5,5"
            markerEnd="url(#arrowhead)"
            className="opacity-50 pointer-events-none"
          />
        )}
      </svg>

      {displayNodes.map((node) => (
        <div
          key={node.id}
          data-node-id={node.id}
          onPointerDown={(e) => handleNodePointerDown(e, node)}
          onPointerMove={handleNodePointerMove}
          onPointerUp={handleNodePointerUp}
          onPointerCancel={handleNodePointerUp}
          className="absolute z-10 flex flex-col items-center justify-center shadow-sm border border-slate-300 rounded-lg cursor-grab active:cursor-grabbing p-2 group"
          style={{
            left: node.x,
            top: node.y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            backgroundColor: node.bgColor,
            fontFamily: config.fontFamily ?? 'inherit',
          }}
        >
          <textarea
            className="w-full h-full text-center bg-transparent border-none resize-none focus:outline-none focus:ring-1 focus:ring-slate-400 rounded p-1 text-sm font-medium text-slate-800"
            value={node.text}
            onChange={(e) => handleNodeTextChange(node.id, e.target.value)}
            placeholder="Idea..."
            readOnly={isStudentView}
          />

          {!isStudentView && (
            <>
              <button
                className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 text-rose-500 rounded-full opacity-0 hover:bg-rose-50 hover:text-rose-600 transition-opacity focus:opacity-100 group-hover:opacity-100"
                onClick={() => handleDeleteNode(node.id)}
                title="Delete Node"
              >
                <Trash2 size={12} />
              </button>

              <div
                className="handle absolute -bottom-2 p-1 bg-white border border-slate-300 rounded-full cursor-crosshair text-slate-400 hover:text-indigo-500 hover:border-indigo-400 transition-colors shadow-sm"
                onPointerDown={(e) => handleHandlePointerDown(e, node.id)}
                onPointerMove={handleHandlePointerMove}
                onPointerUp={handleHandlePointerUp}
                onPointerCancel={handleHandlePointerUp}
                title="Drag to connect"
              >
                <div className="w-2 h-2 rounded-full bg-current pointer-events-none" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
