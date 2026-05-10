import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Mic, FileText, BarChart2,
  Sparkles, MessageSquare, FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Note, Section, AppData } from '../types';
import { updateNote } from '../store';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  note: Note | null;
  data: AppData;
  onDataChange: (d: AppData) => void;
}

const typeIcon: Record<string, React.ElementType> = {
  voice: Mic,
  text: FileText,
  analytics: BarChart2,
};

const typeBadge: Record<string, string> = {
  voice: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  text: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  analytics: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export default function NoteEditor({ note, data, onDataChange }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when note changes
  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setAiSummary(note.aiSummary ?? '');
    setSections(note.sections);
  }, [note?.id]);

  const save = useCallback((
    t: string, c: string, ai: string, secs: Section[]
  ) => {
    if (!note) return;
    const updated: Note = {
      ...note,
      title: t,
      content: c,
      aiSummary: ai,
      sections: secs,
    };
    onDataChange(updateNote(data, updated));
  }, [note, data, onDataChange]);

  function scheduleSave(t: string, c: string, ai: string, secs: Section[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(t, c, ai, secs), 600);
  }

  function handleTitle(val: string) {
    setTitle(val);
    scheduleSave(val, content, aiSummary, sections);
  }

  function handleContent(val: string) {
    setContent(val);
    scheduleSave(title, val, aiSummary, sections);
  }

  function handleAiSummary(val: string) {
    setAiSummary(val);
    scheduleSave(title, content, val, sections);
  }

  // ---- Section CRUD ----
  function addSection() {
    const sec: Section = { id: uuidv4(), title: 'New Section', items: [], collapsed: false };
    const newSecs = [...sections, sec];
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  function updateSectionTitle(id: string, val: string) {
    const newSecs = sections.map(s => s.id === id ? { ...s, title: val } : s);
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  function toggleSection(id: string) {
    const newSecs = sections.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s);
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  function deleteSection(id: string) {
    const newSecs = sections.filter(s => s.id !== id);
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  function addItem(sectionId: string) {
    const newSecs = sections.map(s =>
      s.id === sectionId ? { ...s, items: [...s.items, ''] } : s
    );
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  function updateItem(sectionId: string, idx: number, val: string) {
    const newSecs = sections.map(s =>
      s.id === sectionId
        ? { ...s, items: s.items.map((item, i) => i === idx ? val : item) }
        : s
    );
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  function deleteItem(sectionId: string, idx: number) {
    const newSecs = sections.map(s =>
      s.id === sectionId
        ? { ...s, items: s.items.filter((_, i) => i !== idx) }
        : s
    );
    setSections(newSecs);
    scheduleSave(title, content, aiSummary, newSecs);
  }

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
        <FileText className="h-12 w-12 opacity-20 mb-3" />
        <p className="text-sm">Select a note or create one</p>
      </div>
    );
  }

  const TypeIcon = typeIcon[note.type] ?? FileText;
  const folder = data.folders.find(f => f.id === note.folderId);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Note header */}
      <div className="px-6 pt-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="secondary"
            className={`text-xs font-medium capitalize gap-1 ${typeBadge[note.type]}`}
          >
            <TypeIcon className="h-3 w-3" />
            {note.type}
          </Badge>
          {folder && (
            <Badge variant="outline" className="text-xs gap-1">
              <FolderOpen className="h-3 w-3" style={{ color: folder.color ?? 'currentColor' }} />
              {folder.name}
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        {/* Editable title */}
        <input
          value={title}
          onChange={e => handleTitle(e.target.value)}
          className="w-full text-xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          placeholder="Untitled Note"
        />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

        {/* Main content */}
        <div>
          <Textarea
            value={content}
            onChange={e => handleContent(e.target.value)}
            placeholder="Write your note here…"
            className="min-h-[120px] resize-none bg-muted/30 border-muted text-sm leading-relaxed"
          />
        </div>

        {/* AI Summary */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</span>
          </div>
          <Textarea
            value={aiSummary}
            onChange={e => handleAiSummary(e.target.value)}
            placeholder="AI-generated summary will appear here…"
            className="min-h-[80px] resize-none bg-transparent border-0 p-0 text-sm focus-visible:ring-0 text-foreground"
          />
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sections</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={addSection}>
              <Plus className="h-3 w-3" />
              Add Section
            </Button>
          </div>

          {sections.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No sections yet — add one above</p>
          )}

          <div className="space-y-2">
            {sections.map(section => (
              <div key={section.id} className="rounded-md border border-border bg-card overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-1 px-3 py-2 bg-muted/30">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-0.5 rounded hover:bg-muted transition-colors"
                  >
                    {section.collapsed
                      ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </button>
                  <input
                    value={section.title}
                    onChange={e => updateSectionTitle(section.id, e.target.value)}
                    className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-foreground"
                    placeholder="Section title"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Section
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Items */}
                {!section.collapsed && (
                  <div className="px-3 py-2 space-y-1">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                        <input
                          value={item}
                          onChange={e => updateItem(section.id, idx, e.target.value)}
                          className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                          placeholder="Item text"
                        />
                        <button
                          onClick={() => deleteItem(section.id, idx)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addItem(section.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add item
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transcript */}
        {note.transcript && note.transcript.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transcript</span>
            </div>
            <div className="space-y-3">
              {note.transcript.map(entry => (
                <div key={entry.id} className="flex gap-3">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: entry.speakerColor }}
                  >
                    {entry.speaker[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-foreground">{entry.speaker}</span>
                      <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
