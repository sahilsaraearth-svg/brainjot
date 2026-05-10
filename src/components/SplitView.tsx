import { useState, useEffect } from 'react';
import { X, Plus, Link2, Unlink } from 'lucide-react';
import type { Note } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  notes: Note[];
  primaryNoteId: string | null;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onClose: () => void;
}

function MiniEditor({ note, onUpdate }: { note: Note; onUpdate: (content: string, title: string) => void }) {
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);

  useEffect(() => {
    setContent(note.content);
    setTitle(note.title);
  }, [note.id]);

  return (
    <div className="flex flex-col h-full">
      <input
        value={title}
        onChange={e => { setTitle(e.target.value); onUpdate(content, e.target.value); }}
        className="px-4 py-3 text-sm font-semibold bg-transparent border-0 outline-none text-foreground border-b border-border placeholder:text-muted-foreground/30 shrink-0"
        placeholder="Untitled"
      />
      <textarea
        value={content}
        onChange={e => { setContent(e.target.value); onUpdate(e.target.value, title); }}
        className="flex-1 resize-none border-0 bg-transparent p-4 text-sm text-foreground outline-none leading-relaxed placeholder:text-muted-foreground/30"
        placeholder="Write something…"
      />
    </div>
  );
}

export default function SplitView({ notes, primaryNoteId, onUpdateNote, onClose }: Props) {
  const [leftId, setLeftId] = useState(primaryNoteId);
  const [rightId, setRightId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState<'left' | 'right' | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const leftNote = notes.find(n => n.id === leftId);
  const rightNote = notes.find(n => n.id === rightId);

  const commonTags = leftNote && rightNote
    ? (leftNote.tags || []).filter(t => (rightNote.tags || []).includes(t))
    : [];

  const sharedLinks = leftNote && rightNote
    ? (leftNote.links || []).filter(l => l.targetId === rightNote.id).length > 0
    : false;

  const filtered = notes.filter(n =>
    n.id !== leftId && n.id !== rightId &&
    (n.title.toLowerCase().includes(searchQ.toLowerCase()) || n.content.toLowerCase().includes(searchQ.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          <span className="text-sm font-semibold">Split Thinking</span>
          {(commonTags.length > 0 || sharedLinks) && (
            <div className="flex items-center gap-1.5 ml-2">
              <Link2 size={11} className="text-violet-400" />
              {sharedLinks && <span className="text-[10px] text-violet-400">linked</span>}
              {commonTags.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] bg-violet-500/20 text-violet-300 rounded-full px-1.5 py-0.5">{t}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><X size={12} /></button>
      </div>

      {/* Panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden relative">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 bg-muted/10 shrink-0">
            <span className="text-[10px] text-muted-foreground flex-1 truncate">{leftNote?.title || 'No note selected'}</span>
            <button onClick={() => setShowPicker('left')} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              <Plus size={10} /> Change
            </button>
          </div>
          {leftNote ? (
            <MiniEditor
              note={leftNote}
              onUpdate={(content, title) => onUpdateNote(leftNote.id, { content, title, updatedAt: new Date().toISOString() })}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <button onClick={() => setShowPicker('left')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Select a note →
              </button>
            </div>
          )}
        </div>

        {/* Connection indicator */}
        {leftNote && rightNote && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${sharedLinks || commonTags.length > 0 ? 'border-violet-500/60 bg-violet-500/20' : 'border-border bg-background'}`}>
              {sharedLinks || commonTags.length > 0 ? <Link2 size={12} className="text-violet-400" /> : <Unlink size={12} className="text-muted-foreground" />}
            </div>
          </div>
        )}

        {/* Right pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 bg-muted/10 shrink-0">
            <span className="text-[10px] text-muted-foreground flex-1 truncate">{rightNote?.title || 'No note selected'}</span>
            <button onClick={() => setShowPicker('right')} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              <Plus size={10} /> {rightNote ? 'Change' : 'Add'}
            </button>
          </div>
          {rightNote ? (
            <MiniEditor
              note={rightNote}
              onUpdate={(content, title) => onUpdateNote(rightNote.id, { content, title, updatedAt: new Date().toISOString() })}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <div className="text-2xl opacity-10 mb-2">⊕</div>
                <button onClick={() => setShowPicker('right')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Add a second note to compare
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note picker overlay */}
      {showPicker && (
        <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search notes…"
              className="flex-1 bg-muted/40 rounded-lg px-3 py-1.5 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/40"
            />
            <button onClick={() => setShowPicker(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {filtered.slice(0, 20).map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (showPicker === 'left') setLeftId(n.id);
                    else setRightId(n.id);
                    setShowPicker(null);
                    setSearchQ('');
                  }}
                  className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-muted/50 border border-transparent hover:border-border transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{n.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{n.content || 'Empty'}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
