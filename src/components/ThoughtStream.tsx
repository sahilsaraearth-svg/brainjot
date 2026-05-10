import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import type { Note } from '../types';
import { pickThoughtStreamNote } from '../store';

interface Props {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

export default function ThoughtStream({ notes, onSelectNote, onClose }: Props) {
  const [current, setCurrent] = useState<Note | null>(null);
  const [history, setHistory] = useState<Note[]>([]);
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const next = useCallback(() => {
    const note = pickThoughtStreamNote(notes, current?.id);
    if (note) {
      if (current) setHistory(h => [...h.slice(-9), current]);
      setCurrent(note);
      setAnimKey(k => k + 1);
    }
  }, [notes, current]);

  useEffect(() => {
    next();
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 18000);
    return () => clearInterval(timer);
  }, [next]);

  if (!current) return null;

  const daysAgo = Math.floor((Date.now() - new Date(current.updatedAt).getTime()) / 86400000);
  const ageLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 bg-background/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl shadow-2xl transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/20 via-transparent to-blue-500/10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-violet-400" />
          <span className="text-xs font-semibold text-foreground">Thought Stream</span>
          <span className="text-[10px] bg-violet-500/20 text-violet-300 rounded-full px-2 py-0.5">{ageLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={next} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <RefreshCw size={12} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div key={animKey} className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h3 className="text-sm font-semibold text-foreground mb-2 leading-tight">{current.title || 'Untitled'}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">{current.content || 'No content'}</p>

        {(current.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {(current.tags || []).slice(0, 5).map(t => (
              <span key={t} className="text-[9px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50">
        {/* History dots */}
        <div className="flex items-center gap-1">
          {history.slice(-5).map((h, i) => (
            <button
              key={h.id}
              onClick={() => { setCurrent(h); setAnimKey(k => k + 1); }}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-violet-400 transition-colors"
              style={{ opacity: 0.3 + (i / 5) * 0.7 }}
            />
          ))}
          <div className="w-2 h-2 rounded-full bg-violet-400" />
        </div>
        <button
          onClick={() => { onSelectNote(current.id); onClose(); }}
          className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
        >
          Open note <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}
