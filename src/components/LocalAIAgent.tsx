import { useState, useRef, useCallback } from 'react';
import { Bot, Send, X, Sparkles, Tag, Link2, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Note } from '../types';
import { semanticSearch, tokenize, extractTags } from '../store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  relatedNotes?: Note[];
}

interface Props {
  notes: Note[];
  currentNote?: Note;
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

function generateResponse(query: string, notes: Note[], currentNote?: Note): { content: string; suggestions: string[]; relatedNotes: Note[] } {
  const q = query.toLowerCase().trim();

  // Command routing
  if (q.startsWith('summarize') || q.includes('summarize this')) {
    if (currentNote?.content) {
      const sentences = currentNote.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const top = sentences.slice(0, 3).map(s => s.trim()).join('. ');
      return {
        content: `**Summary of "${currentNote.title}":**\n\n${top || currentNote.content.slice(0, 300)}`,
        suggestions: ['Find related notes', 'Extract tags', 'What are the key ideas?'],
        relatedNotes: [],
      };
    }
    return { content: 'Open a note first, then I can summarize it for you.', suggestions: [], relatedNotes: [] };
  }

  if (q.includes('tag') || q.includes('label')) {
    if (currentNote) {
      const tags = extractTags(currentNote.content, currentNote.title);
      return {
        content: `Suggested tags for **"${currentNote.title}"**:\n\n${tags.map(t => `• #${t}`).join('\n')}`,
        suggestions: ['Find related notes', 'Summarize this note'],
        relatedNotes: [],
      };
    }
    return { content: 'Open a note first.', suggestions: [], relatedNotes: [] };
  }

  if (q.includes('connect') || q.includes('related') || q.includes('similar')) {
    const target = currentNote || notes[0];
    if (!target) return { content: 'No notes to connect yet.', suggestions: [], relatedNotes: [] };
    const related = semanticSearch(notes, `${target.title} ${target.content}`).filter(n => n.id !== target.id).slice(0, 5);
    return {
      content: related.length > 0
        ? `Found **${related.length} related notes** to "${target.title}":`
        : 'No strong connections found yet. Write more to build your knowledge graph.',
      suggestions: ['Summarize this note', 'What topics do I write about?'],
      relatedNotes: related,
    };
  }

  if (q.includes('what do i write about') || q.includes('my topics') || q.includes('knowledge base')) {
    const allTags: Record<string, number> = {};
    notes.forEach(n => (n.tags || []).forEach(t => { allTags[t] = (allTags[t] || 0) + 1; }));
    const topTopics = Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const types = ['text', 'voice', 'analytics', 'canvas', 'flashcard'].map(t => ({
      type: t, count: notes.filter(n => n.type === t).length,
    })).filter(x => x.count > 0);

    return {
      content: `**Your Knowledge Base:**\n\n${notes.length} total notes\n\n**Top topics:**\n${topTopics.map(([t, c]) => `• #${t} (${c})`).join('\n') || 'No tags yet'}\n\n**Note types:**\n${types.map(x => `• ${x.type}: ${x.count}`).join('\n')}`,
      suggestions: ['Find related notes', 'What should I write next?'],
      relatedNotes: [],
    };
  }

  if (q.includes('organize') || q.includes('messy') || q.includes('untitled')) {
    const untitled = notes.filter(n => !n.title || n.title === 'Untitled');
    const empty = notes.filter(n => !n.content || n.content.length < 20);
    return {
      content: `**Organization Check:**\n\n• ${untitled.length} untitled notes — consider naming them\n• ${empty.length} empty/sparse notes — add content or delete\n• ${notes.filter(n => !(n.tags?.length)).length} notes without tags — adding tags improves connections\n\nOverall your brain looks **${notes.length < 10 ? 'just starting out' : notes.length < 50 ? 'growing well' : 'richly connected'}** 🧠`,
      suggestions: ['What do I write about?', 'Find related notes'],
      relatedNotes: untitled.slice(0, 3),
    };
  }

  if (q.includes('write next') || q.includes('suggest') || q.includes('idea')) {
    const recentTokens = notes.slice(0, 5).flatMap(n => tokenize(`${n.title} ${n.content}`));
    const freq: Record<string, number> = {};
    recentTokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

    return {
      content: `Based on your recent notes, consider exploring:\n\n${top.map(t => `• Deep dive into **${t}**`).join('\n')}\n\nOr start a new note on a topic you've been thinking about but haven't written down yet.`,
      suggestions: ['What do I write about?', 'Summarize this note'],
      relatedNotes: [],
    };
  }

  // Semantic search fallback
  const results = semanticSearch(notes, query).slice(0, 4);
  if (results.length > 0) {
    return {
      content: `Found **${results.length} notes** matching "${query}":`,
      suggestions: ['Summarize this note', 'Find related notes', 'What do I write about?'],
      relatedNotes: results,
    };
  }

  return {
    content: `I couldn't find anything specific for "${query}" in your notes. Try asking me to:\n\n• **Summarize** this note\n• Find **related** notes\n• **Tag** this note\n• Check what **topics** you cover\n• Help you **organize** messy notes`,
    suggestions: ['What do I write about?', 'Organize my notes', 'Find related notes'],
    relatedNotes: [],
  };
}

export default function LocalAIAgent({ notes, currentNote, onSelectNote, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `I'm your local AI agent — I work entirely offline from your notes. I can **summarize**, **find connections**, **suggest tags**, **organize**, and **answer questions** from your knowledge base.\n\nWhat would you like to explore?`,
      suggestions: ['What do I write about?', 'Find related notes', 'Organize my notes', 'Summarize this note'],
      relatedNotes: [],
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = useCallback((query?: string) => {
    const q = query || input.trim();
    if (!q) return;
    setInput('');

    const userMsg: Message = { id: Date.now() + 'u', role: 'user', content: q };
    const { content, suggestions, relatedNotes } = generateResponse(q, notes, currentNote);
    const assistantMsg: Message = {
      id: Date.now() + 'a',
      role: 'assistant',
      content,
      suggestions,
      relatedNotes,
    };

    setMessages(m => [...m, userMsg, assistantMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [input, notes, currentNote]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot size={15} className="text-violet-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-background" />
          </div>
          <span className="text-sm font-semibold">Local AI Agent</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 rounded-full px-2 py-0.5">offline</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><X size={12} /></button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={11} className="text-violet-400" />
                    <span className="text-[10px] text-muted-foreground font-medium">Brain Agent</span>
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-muted/50 text-foreground border border-border/50'
                }`}>
                  {/* Simple markdown bold */}
                  {msg.content.split(/\*\*(.+?)\*\*/g).map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : <span key={i}>{part}</span>
                  )}
                </div>

                {/* Related notes */}
                {msg.relatedNotes && msg.relatedNotes.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.relatedNotes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => onSelectNote(n.id)}
                        className="flex items-center gap-2 w-full text-left rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:border-violet-500/30 hover:bg-muted/50 transition-colors"
                      >
                        <FileText size={11} className="text-violet-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">{n.title || 'Untitled'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{n.content?.slice(0, 60) || 'Empty'}</p>
                        </div>
                        <Link2 size={10} className="text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-[10px] bg-background border border-border rounded-full px-2.5 py-1 hover:border-violet-500/40 hover:text-violet-300 transition-colors text-muted-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border shrink-0">
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl border border-border px-3 py-2">
          <Tag size={12} className="text-muted-foreground shrink-0" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about your notes…"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className="p-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={11} className="text-white" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground/30 text-center mt-1.5">100% local · no data leaves your device</p>
      </div>
    </div>
  );
}
