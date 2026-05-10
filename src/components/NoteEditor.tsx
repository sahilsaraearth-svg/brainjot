import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
  Mic,
  FileText,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Note, Section } from '../types';

interface NoteEditorProps {
  note: Note | null;
  onUpdate: (note: Note) => void;
}

function typeIcon(type: Note['type']) {
  if (type === 'voice') return <Mic size={14} className="text-blue-500" />;
  if (type === 'analytics') return <BarChart2 size={14} className="text-green-500" />;
  return <FileText size={14} className="text-muted-foreground" />;
}

export default function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<{ sectionId: string; index: number; value: string } | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingTitle(false);
    setEditingSummary(false);
    setAddingSection(false);
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground gap-3">
        <FileText size={40} className="opacity-30" />
        <p className="text-sm">Select a note or create one</p>
      </div>
    );
  }

  function patch(partial: Partial<Note>) {
    if (!note) return;
    onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() });
  }

  function commitTitle() {
    const t = titleDraft.trim();
    if (t) patch({ title: t });
    setEditingTitle(false);
  }

  function commitSummary() {
    patch({ aiSummary: summaryDraft });
    setEditingSummary(false);
  }

  function toggleSection(id: string) {
    patch({
      sections: note!.sections.map((s) =>
        s.id === id ? { ...s, collapsed: !s.collapsed } : s
      ),
    });
  }

  function deleteSection(id: string) {
    patch({ sections: note!.sections.filter((s) => s.id !== id) });
  }

  function addSection() {
    const title = newSectionTitle.trim();
    if (!title) return;
    const s: Section = {
      id: crypto.randomUUID(),
      title,
      items: [],
      collapsed: false,
    };
    patch({ sections: [...note!.sections, s] });
    setNewSectionTitle('');
    setAddingSection(false);
  }

  function addItem(sectionId: string) {
    const text = (newItemText[sectionId] || '').trim();
    if (!text) return;
    patch({
      sections: note!.sections.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, text] } : s
      ),
    });
    setNewItemText((prev) => ({ ...prev, [sectionId]: '' }));
  }

  function deleteItem(sectionId: string, index: number) {
    patch({
      sections: note!.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((_, i) => i !== index) }
          : s
      ),
    });
  }

  function commitEditItem() {
    if (!editingItem) return;
    const { sectionId, index, value } = editingItem;
    patch({
      sections: note!.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it, i) => (i === index ? value : it)) }
          : s
      ),
    });
    setEditingItem(null);
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border shrink-0">
        {typeIcon(note.type)}
        {editingTitle ? (
          <Input
            ref={titleRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="h-7 text-base font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 shadow-none"
            autoFocus
          />
        ) : (
          <h1
            className="flex-1 text-base font-semibold text-foreground cursor-text hover:text-foreground/80 truncate"
            onClick={() => {
              setTitleDraft(note.title);
              setEditingTitle(true);
            }}
          >
            {note.title || 'Untitled'}
          </h1>
        )}
        <Badge variant="outline" className="text-[10px] shrink-0">
          {new Date(note.updatedAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          })}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-6 max-w-3xl">
          {/* Main content */}
          <div>
            <Textarea
              placeholder="Write something…"
              value={note.content}
              onChange={(e) => patch({ content: e.target.value })}
              className="min-h-[120px] resize-none border-0 bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 shadow-none"
            />
          </div>

          {/* AI Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Summary
              </span>
              {!editingSummary && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSummaryDraft(note.aiSummary || '');
                    setEditingSummary(true);
                  }}
                >
                  <Pencil size={11} />
                </Button>
              )}
              {editingSummary && (
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground"
                    onClick={() => setEditingSummary(false)}
                  >
                    <X size={11} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={commitSummary}
                  >
                    <Check size={11} />
                  </Button>
                </div>
              )}
            </div>
            {editingSummary ? (
              <Textarea
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                placeholder="Add a summary…"
                className="min-h-[80px] resize-none text-sm bg-muted/40 border border-border rounded-md"
                autoFocus
              />
            ) : (
              <p
                className="text-sm text-muted-foreground italic cursor-text hover:text-foreground/70 transition-colors min-h-[2rem]"
                onClick={() => {
                  setSummaryDraft(note.aiSummary || '');
                  setEditingSummary(true);
                }}
              >
                {note.aiSummary || 'Click to add a summary…'}
              </p>
            )}
          </div>

          <Separator />

          {/* Sections */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sections
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => setAddingSection(true)}
              >
                <Plus size={12} />
              </Button>
            </div>

            {addingSection && (
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Section title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addSection();
                    if (e.key === 'Escape') setAddingSection(false);
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={addSection} disabled={!newSectionTitle.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingSection(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {note.sections.length === 0 && !addingSection && (
              <p className="text-sm text-muted-foreground">No sections yet</p>
            )}

            <div className="space-y-3">
              {note.sections.map((section) => (
                <div key={section.id} className="rounded-lg border border-border bg-card">
                  {/* Section header */}
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {section.collapsed ? (
                        <ChevronRight size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                    <span className="flex-1 text-sm font-medium">{section.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>

                  {/* Section items */}
                  {!section.collapsed && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {section.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 group">
                          {editingItem?.sectionId === section.id &&
                          editingItem.index === idx ? (
                            <>
                              <Input
                                value={editingItem.value}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEditItem();
                                  if (e.key === 'Escape') setEditingItem(null);
                                }}
                                className="h-7 text-sm flex-1"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={commitEditItem}
                              >
                                <Check size={11} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setEditingItem(null)}
                              >
                                <X size={11} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                              <span
                                className="flex-1 text-sm cursor-text"
                                onDoubleClick={() =>
                                  setEditingItem({
                                    sectionId: section.id,
                                    index: idx,
                                    value: item,
                                  })
                                }
                              >
                                {item}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() =>
                                    setEditingItem({
                                      sectionId: section.id,
                                      index: idx,
                                      value: item,
                                    })
                                  }
                                >
                                  <Pencil size={10} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteItem(section.id, idx)}
                                >
                                  <Trash2 size={10} />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add item */}
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Add item…"
                          value={newItemText[section.id] || ''}
                          onChange={(e) =>
                            setNewItemText((prev) => ({
                              ...prev,
                              [section.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addItem(section.id);
                          }}
                          className="h-7 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => addItem(section.id)}
                          disabled={!(newItemText[section.id] || '').trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transcript */}
          {note.transcript.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mic size={13} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Transcript
                  </span>
                </div>
                <div className="space-y-3">
                  {note.transcript.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div
                        className="w-2 shrink-0 rounded-full mt-1"
                        style={{ backgroundColor: entry.speakerColor, minHeight: '1rem' }}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: entry.speakerColor }}
                          >
                            {entry.speaker}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
