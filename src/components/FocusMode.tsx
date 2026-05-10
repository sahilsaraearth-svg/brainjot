import { useEffect, useRef, useState } from 'react';
import { Minimize2 } from 'lucide-react';
import type { Note } from '../types';

interface Props {
  note: Note;
  onUpdate: (content: string) => void;
  onExit: () => void;
}

// Ambient particle system
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; color: string; life: number; maxLife: number;
    }

    const particles: Particle[] = [];
    const colors = ['#a78bfa', '#60a5fa', '#c084fc', '#818cf8', '#38bdf8'];

    function spawn() {
      particles.push({
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.2),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 400 + 200,
      });
    }

    for (let i = 0; i < 40; i++) {
      spawn();
      particles[i].y = Math.random() * canvas.height;
      particles[i].life = Math.random() * particles[i].maxLife;
    }

    let frame: number;
    function tick() {
      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

      if (Math.random() < 0.15) spawn();
      if (particles.length > 80) particles.splice(0, 1);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeFrac = p.life / p.maxLife;
        const fadeAlpha = lifeFrac < 0.1 ? lifeFrac * 10 : lifeFrac > 0.8 ? (1 - lifeFrac) * 5 : 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * fadeAlpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      });

      frame = requestAnimationFrame(tick);
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    frame = requestAnimationFrame(tick);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function FocusMode({ note, onUpdate, onExit }: Props) {
  const [content, setContent] = useState(note.content);
  const [showUI, setShowUI] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowUI(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  useEffect(() => {
    const handler = (_e: MouseEvent) => {
      setShowUI(true);
      clearTimeout(hideTimer.current!);
      hideTimer.current = setTimeout(() => setShowUI(false), 3000) as unknown as number;
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onUpdate(content);
        onExit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [content, onUpdate, onExit]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <ParticleCanvas />

      {/* UI overlay */}
      <div className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 transition-opacity duration-700 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-sm font-medium text-white/40">{note.title}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">{wordCount} words</span>
          <button onClick={() => { onUpdate(content); onExit(); }} className="text-white/40 hover:text-white/80 transition-colors">
            <Minimize2 size={15} />
          </button>
        </div>
      </div>

      {/* Writing area */}
      <div className="relative z-10 w-full max-w-2xl px-8">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value); setShowUI(true); }}
          onBlur={() => onUpdate(content)}
          className="w-full bg-transparent text-white/90 text-lg leading-relaxed resize-none outline-none border-0 min-h-[60vh] placeholder:text-white/15 selection:bg-violet-500/40 caret-violet-400"
          placeholder="Write freely…"
          style={{ fontFamily: 'Geist Variable, sans-serif' }}
          spellCheck={false}
        />
      </div>

      {/* Hint */}
      <div className={`absolute bottom-6 left-0 right-0 text-center transition-opacity duration-700 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[11px] text-white/20">Press Esc to exit focus mode</span>
      </div>
    </div>
  );
}
