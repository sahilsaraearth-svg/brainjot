import { useState, useMemo } from 'react';
import { Code2, Users, BookOpen, Lightbulb, Book, Zap, ChevronDown, ChevronUp, Copy, Check, Plus, X } from 'lucide-react';
import type { Note, ContentContext, ActionItem, Flashcard } from '../types';
import { extractActionItems, generateFlashcards } from '../store';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  note: Note;
  onUpdateNote: (updates: Partial<Note>) => void;
}

const CONTEXT_ICONS: Record<ContentContext, React.ReactNode> = {
  code: <Code2 size={13} className="text-emerald-400" />,
  meeting: <Users size={13} className="text-blue-400" />,
  study: <BookOpen size={13} className="text-yellow-400" />,
  idea: <Lightbulb size={13} className="text-pink-400" />,
  journal: <Book size={13} className="text-orange-400" />,
  general: <Zap size={13} className="text-violet-400" />,
};

const CONTEXT_LABELS: Record<ContentContext, string> = {
  code: 'Code Workspace',
  meeting: 'Meeting Notes',
  study: 'Study Mode',
  idea: 'Idea Board',
  journal: 'Journal',
  general: 'Smart Workspace',
};

function CodePanel({ content }: { content: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const blocks = useMemo(() => {
    const regex = /```(\w*)\n?([\s\S]*?)```/g;
    const result: { lang: string; code: string }[] = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
      result.push({ lang: m[1] || 'code', code: m[2].trim() });
    }
    return result;
  }, [content]);

  if (blocks.length === 0) return (
    <p className="text-xs text-muted-foreground px-3 py-2">No code blocks detected. Wrap code in ``` to extract.</p>
  );

  return (
    <div className="space-y-2 p-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-lg bg-black/40 border border-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/20">
            <span className="text-[10px] text-muted-foreground font-mono">{b.lang}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(b.code); setCopied(`${i}`); setTimeout(() => setCopied(null), 2000); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === `${i}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>
          <pre className="text-[11px] text-emerald-300 font-mono p-3 overflow-x-auto leading-relaxed max-h-32">{b.code}</pre>
        </div>
      ))}
    </div>
  );
}

function MeetingPanel({ note, onUpdateNote }: { note: Note; onUpdateNote: (u: Partial<Note>) => void }) {
  const extracted = useMemo(() => extractActionItems(note.content), [note.content]);
  const actionItems = note.actionItems || [];

  const addItem = (text: string) => {
    const newItem: ActionItem = { id: uuidv4(), text, done: false };
    onUpdateNote({ actionItems: [...actionItems, newItem] });
  };

  const toggleItem = (id: string) => {
    onUpdateNote({ actionItems: actionItems.map(a => a.id === id ? { ...a, done: !a.done } : a) });
  };

  const removeItem = (id: string) => {
    onUpdateNote({ actionItems: actionItems.filter(a => a.id !== id) });
  };

  return (
    <div className="p-3 space-y-3">
      {extracted.length > 0 && actionItems.length === 0 && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-[11px] text-blue-300 font-medium mb-2">Auto-detected action items:</p>
          {extracted.map((item, i) => (
            <button
              key={i}
              onClick={() => addItem(item)}
              className="flex items-center gap-2 w-full text-left text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
            >
              <Plus size={10} className="text-blue-400 shrink-0" /> {item}
            </button>
          ))}
        </div>
      )}
      {actionItems.length > 0 && (
        <div className="space-y-1.5">
          {actionItems.map(item => (
            <div key={item.id} className="flex items-start gap-2 group">
              <button onClick={() => toggleItem(item.id)} className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${item.done ? 'bg-blue-500 border-blue-500' : 'border-border'}`}>
                {item.done && <Check size={9} className="text-white" />}
              </button>
              <span className={`text-xs flex-1 ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.text}</span>
              <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {actionItems.length === 0 && extracted.length === 0 && (
        <p className="text-xs text-muted-foreground">Write meeting notes with keywords like "action item", "todo", or "deadline" to auto-extract tasks.</p>
      )}
    </div>
  );
}

function StudyPanel({ note, onUpdateNote }: { note: Note; onUpdateNote: (u: Partial<Note>) => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flashcards = note.flashcards || [];

  const generated = useMemo(() => generateFlashcards(note.content), [note.content]);

  const addGenerated = () => {
    const newCards: Flashcard[] = generated.map(g => ({ id: uuidv4(), front: g.front, back: g.back, confidence: 0 }));
    onUpdateNote({ flashcards: [...flashcards, ...newCards] });
  };

  const rate = (confidence: 0 | 1 | 2 | 3) => {
    const updated = flashcards.map((c, i) => i === currentIdx ? { ...c, confidence } : c);
    onUpdateNote({ flashcards: updated });
    setFlipped(false);
    setCurrentIdx(i => (i + 1) % flashcards.length);
  };

  if (flashcards.length === 0) {
    return (
      <div className="p-3">
        {generated.length > 0 ? (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <p className="text-[11px] text-yellow-300 font-medium mb-2">{generated.length} flashcards detected from your notes</p>
            <button onClick={addGenerated} className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded px-3 py-1.5 transition-colors">
              Generate Flashcards
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Write "Term: Definition" or "Term is Definition" patterns to auto-generate flashcards.</p>
        )}
      </div>
    );
  }

  const card = flashcards[currentIdx % flashcards.length];
  const confidenceColors = ['bg-red-500/20 text-red-300', 'bg-orange-500/20 text-orange-300', 'bg-yellow-500/20 text-yellow-300', 'bg-emerald-500/20 text-emerald-300'];

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{currentIdx + 1} / {flashcards.length}</span>
        <div className="flex gap-1">
          {flashcards.map((c, i) => (
            <div key={c.id} className={`w-2 h-2 rounded-full ${i === currentIdx % flashcards.length ? 'bg-yellow-400' : confidenceColors[c.confidence].split(' ')[0]}`} />
          ))}
        </div>
      </div>

      <button
        onClick={() => setFlipped(f => !f)}
        className="w-full rounded-xl border border-border bg-muted/30 p-4 min-h-[80px] text-center transition-all hover:border-yellow-500/30 cursor-pointer"
      >
        <p className="text-xs text-muted-foreground mb-1">{flipped ? 'Answer' : 'Question'}</p>
        <p className="text-sm font-medium text-foreground">{flipped ? card.back : card.front}</p>
        {!flipped && <p className="text-[10px] text-muted-foreground/40 mt-2">Click to reveal</p>}
      </button>

      {flipped && (
        <div className="flex gap-2">
          {(['Again', 'Hard', 'Good', 'Easy'] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => rate(i as 0 | 1 | 2 | 3)}
              className={`flex-1 text-[10px] rounded py-1.5 transition-colors ${confidenceColors[i]}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaPanel({ note }: { note: Note; onUpdateNote?: (u: Partial<Note>) => void }) {
  const words = note.content.trim().split(/\s+/).filter(Boolean);
  const keyPhrases = useMemo(() => {
    const lines = note.content.split('\n').filter(l => l.trim().length > 5);
    return lines.slice(0, 8).map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  }, [note.content]);

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-pink-500/10 border border-pink-500/20 p-2 text-center">
          <div className="text-sm font-bold text-pink-300">{words.length}</div>
          <div className="text-[9px] text-muted-foreground">words</div>
        </div>
        <div className="rounded-lg bg-pink-500/10 border border-pink-500/20 p-2 text-center">
          <div className="text-sm font-bold text-pink-300">{note.content.split('\n').filter(Boolean).length}</div>
          <div className="text-[9px] text-muted-foreground">lines</div>
        </div>
        <div className="rounded-lg bg-pink-500/10 border border-pink-500/20 p-2 text-center">
          <div className="text-sm font-bold text-pink-300">{(note.links || []).length}</div>
          <div className="text-[9px] text-muted-foreground">connected</div>
        </div>
      </div>
      {keyPhrases.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Key ideas extracted:</p>
          <div className="flex flex-wrap gap-1.5">
            {keyPhrases.map((phrase, i) => (
              <span key={i} className="text-[10px] bg-pink-500/15 text-pink-300 rounded-full px-2.5 py-1 max-w-[140px] truncate">{phrase}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContextualWorkspace({ note, onUpdateNote }: Props) {
  const [expanded, setExpanded] = useState(true);
  const ctx = note.contentContext || 'general';

  if (!note.content || note.content.length < 30) return null;

  return (
    <div className="border-t border-border shrink-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        {CONTEXT_ICONS[ctx]}
        <span className="text-xs font-medium text-foreground flex-1">{CONTEXT_LABELS[ctx]}</span>
        {expanded ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronUp size={12} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          {ctx === 'code' && <CodePanel content={note.content} />}
          {ctx === 'meeting' && <MeetingPanel note={note} onUpdateNote={onUpdateNote} />}
          {ctx === 'study' && <StudyPanel note={note} onUpdateNote={onUpdateNote} />}
          {ctx === 'idea' && <IdeaPanel note={note} onUpdateNote={onUpdateNote} />}
          {(ctx === 'journal' || ctx === 'general') && (
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/40 p-2 text-center">
                  <div className="text-sm font-bold text-foreground">{note.content.trim().split(/\s+/).filter(Boolean).length}</div>
                  <div className="text-[9px] text-muted-foreground">words</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2 text-center">
                  <div className="text-sm font-bold text-foreground">{Math.ceil(note.content.trim().split(/\s+/).filter(Boolean).length / 200)}</div>
                  <div className="text-[9px] text-muted-foreground">min read</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
