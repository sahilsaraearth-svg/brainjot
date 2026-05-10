import { useEffect, useRef, useState, useCallback } from 'react';
import type { Note } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  tags: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}

const TYPE_COLORS: Record<string, string> = {
  text: '#a78bfa',
  voice: '#60a5fa',
  analytics: '#34d399',
  canvas: '#f472b6',
  flashcard: '#fbbf24',
};

function truncate(s: string, n = 18) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function MemoryGraph({ notes, selectedNoteId, onSelectNote }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animRef = useRef<number>(0);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ nodeId: string | null; offsetX: number; offsetY: number; isPanning: boolean; startX: number; startY: number }>({
    nodeId: null, offsetX: 0, offsetY: 0, isPanning: false, startX: 0, startY: 0,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; note: Note } | null>(null);

  // Build graph from notes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    nodesRef.current = notes.map((n, i) => {
      const angle = (i / notes.length) * Math.PI * 2;
      const r = Math.min(W, H) * 0.3;
      const existing = nodesRef.current.find(e => e.id === n.id);
      return {
        id: n.id,
        label: n.title || 'Untitled',
        type: n.type,
        x: existing?.x ?? (W / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 60),
        y: existing?.y ?? (H / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 60),
        vx: 0,
        vy: 0,
        radius: Math.max(18, Math.min(30, 18 + (n.content?.length || 0) / 200)),
        color: TYPE_COLORS[n.type] || '#a78bfa',
        tags: n.tags || [],
      };
    });

    edgesRef.current = [];
    notes.forEach(n => {
      (n.links || []).forEach(link => {
        if (link.strength > 0.08 && notes.find(x => x.id === link.targetId)) {
          edgesRef.current.push({ source: n.id, target: link.targetId, strength: link.strength });
        }
      });
    });
  }, [notes]);

  // Force simulation + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function tick() {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const W = canvas!.width;
      const H = canvas!.height;

      // Forces
      const K = 120;
      nodes.forEach((a, i) => {
        // repulsion
        nodes.forEach((b, j) => {
          if (i >= j) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const force = -K * K / dist;
          const fx = (dx / dist) * force * 0.01;
          const fy = (dy / dist) * force * 0.01;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        });
        // gravity toward center
        a.vx += (W / 2 - a.x) * 0.0008;
        a.vy += (H / 2 - a.y) * 0.0008;
      });

      // Spring forces from edges
      edges.forEach(e => {
        const src = nodes.find(n => n.id === e.source);
        const tgt = nodes.find(n => n.id === e.target);
        if (!src || !tgt) return;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const idealDist = 160 - e.strength * 60;
        const force = (dist - idealDist) * 0.03 * e.strength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        src.vx += fx; src.vy += fy;
        tgt.vx -= fx; tgt.vy -= fy;
      });

      // Integrate
      nodes.forEach(n => {
        if (dragRef.current.nodeId === n.id) { n.vx = 0; n.vy = 0; return; }
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(n.radius, Math.min(W - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(H - n.radius, n.y));
      });

      // Draw
      const t = transformRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      // Background grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      const gridSize = 40;
      for (let gx = 0; gx < W / t.scale; gx += gridSize) {
        for (let gy = 0; gy < H / t.scale; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Edges
      edges.forEach(e => {
        const src = nodes.find(n => n.id === e.source);
        const tgt = nodes.find(n => n.id === e.target);
        if (!src || !tgt) return;
        const isHighlighted = src.id === selectedNoteId || tgt.id === selectedNoteId || src.id === hoveredId || tgt.id === hoveredId;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isHighlighted
          ? `rgba(167,139,250,${0.4 + e.strength * 0.4})`
          : `rgba(255,255,255,${0.04 + e.strength * 0.08})`;
        ctx.lineWidth = isHighlighted ? 1.5 : 0.8;
        ctx.stroke();
      });

      // Nodes
      nodes.forEach(n => {
        const isSelected = n.id === selectedNoteId;
        const isHovered = n.id === hoveredId;
        const alpha = (selectedNoteId && !isSelected && !notes.find(x => x.id === selectedNoteId)?.links?.find(l => l.targetId === n.id))
          ? 0.35 : 1;

        // Glow
        if (isSelected || isHovered) {
          const grd = ctx.createRadialGradient(n.x, n.y, n.radius, n.x, n.y, n.radius * 2.5);
          grd.addColorStop(0, n.color + '60');
          grd.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Node circle
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        const fill = ctx.createRadialGradient(n.x - n.radius * 0.3, n.y - n.radius * 0.3, 0, n.x, n.y, n.radius);
        fill.addColorStop(0, n.color + 'ee');
        fill.addColorStop(1, n.color + '88');
        ctx.fillStyle = fill;
        ctx.fill();
        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        ctx.globalAlpha = alpha * (isHovered || isSelected ? 1 : 0.75);
        ctx.font = `${isSelected ? 600 : 400} ${Math.max(10, n.radius * 0.55)}px Geist Variable, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(truncate(n.label, 14), n.x, n.y + n.radius + 11);
        ctx.globalAlpha = 1;
      });

      ctx.restore();
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [notes, selectedNoteId, hoveredId]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      const ctx = canvas.getContext('2d')!;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    });
    ro.observe(canvas.parentElement!);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  const screenToGraph = useCallback((sx: number, sy: number) => {
    const t = transformRef.current;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (sx - rect.left - t.x) / t.scale,
      y: (sy - rect.top - t.y) / t.scale,
    };
  }, []);

  const hitTest = useCallback((gx: number, gy: number) => {
    return nodesRef.current.find(n => {
      const dx = n.x - gx;
      const dy = n.y - gy;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    const hit = hitTest(x, y);
    if (hit) {
      dragRef.current = { nodeId: hit.id, offsetX: hit.x - x, offsetY: hit.y - y, isPanning: false, startX: e.clientX, startY: e.clientY };
    } else {
      const t = transformRef.current;
      dragRef.current = { nodeId: null, offsetX: t.x, offsetY: t.y, isPanning: true, startX: e.clientX, startY: e.clientY };
    }
  }, [screenToGraph, hitTest]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    const hit = hitTest(x, y);
    setHoveredId(hit?.id ?? null);

    if (hit) {
      const note = notes.find(n => n.id === hit.id);
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      setTooltip(note ? { x: e.clientX - rect.left, y: e.clientY - rect.top - 60, note } : null);
    } else {
      setTooltip(null);
    }

    const d = dragRef.current;
    if (d.nodeId) {
      const node = nodesRef.current.find(n => n.id === d.nodeId);
      if (node) { node.x = x + d.offsetX; node.y = y + d.offsetY; }
    } else if (d.isPanning) {
      transformRef.current.x = d.offsetX + (e.clientX - d.startX);
      transformRef.current.y = d.offsetY + (e.clientY - d.startY);
    }
  }, [screenToGraph, hitTest, notes]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (d.nodeId) {
      const dist = Math.sqrt((e.clientX - d.startX) ** 2 + (e.clientY - d.startY) ** 2);
      if (dist < 5) onSelectNote(d.nodeId);
    }
    dragRef.current = { nodeId: null, offsetX: 0, offsetY: 0, isPanning: false, startX: 0, startY: 0 };
  }, [onSelectNote]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const t = transformRef.current;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, t.scale * factor));
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    transformRef.current = {
      scale: newScale,
      x: mx - (mx - t.x) * (newScale / t.scale),
      y: my - (my - t.y) * (newScale / t.scale),
    };
  }, []);

  const zoom = (dir: 1 | -1) => {
    const t = transformRef.current;
    const factor = dir > 0 ? 1.25 : 0.8;
    transformRef.current.scale = Math.max(0.3, Math.min(3, t.scale * factor));
  };

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden select-none">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 h-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm font-semibold text-foreground">Memory Graph</span>
          <span className="text-xs text-muted-foreground">{notes.length} nodes · {edgesRef.current.length} connections</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => zoom(1)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><ZoomIn size={13} /></button>
          <button onClick={() => zoom(-1)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><ZoomOut size={13} /></button>
          <button onClick={resetView} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Maximize2 size={13} /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-background/70 backdrop-blur rounded-lg px-3 py-1.5 border border-border">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <div className="text-4xl mb-3 opacity-20">◎</div>
            <p className="text-sm text-muted-foreground">Create notes to see your memory graph</p>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-popover border border-border rounded-lg p-3 shadow-xl max-w-[200px]"
          style={{ left: tooltip.x + 12, top: tooltip.y }}
        >
          <p className="text-xs font-semibold text-foreground mb-1">{tooltip.note.title || 'Untitled'}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-3">{tooltip.note.content || 'No content'}</p>
          {(tooltip.note.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(tooltip.note.tags || []).slice(0, 4).map(t => (
                <span key={t} className="text-[9px] bg-violet-500/20 text-violet-300 rounded px-1.5 py-0.5">{t}</span>
              ))}
            </div>
          )}
          <p className="text-[9px] text-muted-foreground/50 mt-1.5">Click to open</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full mt-10 cursor-grab active:cursor-grabbing"
        style={{ height: 'calc(100% - 40px)', marginTop: 40 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setHoveredId(null); setTooltip(null); dragRef.current.nodeId = null; dragRef.current.isPanning = false; }}
        onWheel={handleWheel}
      />
    </div>
  );
}
