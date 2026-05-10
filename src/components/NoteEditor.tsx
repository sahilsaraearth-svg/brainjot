import { useState, useRef } from 'react';
import {
  Plus, ChevronDown, ChevronRight, Trash2, Pencil,
  Check, X, Mic, FileText, BarChart2, Sparkles,
  StopCircle, Play, Pause, PlusCircle, MicOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Note, Section, VoiceRecording, AnalyticsChart, AnalyticsDataPoint } from '../types';

interface NoteEditorProps {
  note: Note | null;
  onUpdate: (note: Note) => void;
}

function typeIcon(type: Note['type']) {
  if (type === 'voice') return <Mic size={14} className="text-blue-500" />;
  if (type === 'analytics') return <BarChart2 size={14} className="text-emerald-500" />;
  return <FileText size={14} className="text-muted-foreground" />;
}

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

// ─── Voice Panel ────────────────────────────────────────────────────────────
function VoicePanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [recording, setRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function patch(partial: Partial<Note>) {
    onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const rec: VoiceRecording = {
          id: crypto.randomUUID(),
          label: `Recording ${(note.recordings?.length ?? 0) + 1}`,
          durationSec: elapsed,
          createdAt: new Date().toISOString(),
          dataUrl: url,
        };
        patch({ recordings: [...(note.recordings ?? []), rec] });
        stream.getTracks().forEach(t => t.stop());
        setElapsed(0);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  function togglePlay(rec: VoiceRecording) {
    if (!rec.dataUrl) return;
    if (playingId === rec.id) {
      audioRefs.current[rec.id]?.pause();
      setPlayingId(null);
    } else {
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      if (!audioRefs.current[rec.id]) {
        const a = new Audio(rec.dataUrl);
        a.onended = () => setPlayingId(null);
        audioRefs.current[rec.id] = a;
      }
      audioRefs.current[rec.id].play();
      setPlayingId(rec.id);
    }
  }

  function deleteRec(id: string) {
    patch({ recordings: note.recordings?.filter(r => r.id !== id) });
  }

  function renameRec(id: string, label: string) {
    patch({ recordings: note.recordings?.map(r => r.id === id ? { ...r, label } : r) });
  }

  return (
    <div className="space-y-4">
      {/* Recorder */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
        {recording ? (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-muted-foreground flex-1">
              Recording… {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
            <Button size="sm" variant="destructive" onClick={stopRecording}>
              <StopCircle size={14} className="mr-1" /> Stop
            </Button>
          </>
        ) : (
          <>
            <MicOff size={15} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1">Ready to record</span>
            <Button size="sm" onClick={startRecording}>
              <Mic size={14} className="mr-1" /> Record
            </Button>
          </>
        )}
      </div>

      {/* Recordings list */}
      {(note.recordings ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No recordings yet. Hit Record above.</p>
      ) : (
        <div className="space-y-2">
          {(note.recordings ?? []).map((rec) => (
            <RecordingRow
              key={rec.id}
              rec={rec}
              playing={playingId === rec.id}
              onTogglePlay={() => togglePlay(rec)}
              onDelete={() => deleteRec(rec.id)}
              onRename={(label) => renameRec(rec.id, label)}
            />
          ))}
        </div>
      )}

      {/* Transcript */}
      {note.transcript.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Transcript</p>
            <div className="space-y-3">
              {note.transcript.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: entry.speakerColor, minHeight: '1rem' }} />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: entry.speakerColor }}>{entry.speaker}</span>
                      <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
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
  );
}

function RecordingRow({ rec, playing, onTogglePlay, onDelete, onRename }: {
  rec: VoiceRecording;
  playing: boolean;
  onTogglePlay: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rec.label);

  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted/30 group">
      <button
        onClick={onTogglePlay}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary shrink-0"
      >
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onRename(draft); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onRename(draft); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
            className="h-6 text-xs px-1 border-0 border-b rounded-none focus-visible:ring-0"
            autoFocus
          />
        ) : (
          <p className="text-sm font-medium truncate cursor-text" onDoubleClick={() => setEditing(true)}>{rec.label}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          {Math.floor(rec.durationSec / 60)}:{String(rec.durationSec % 60).padStart(2, '0')} · {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
          <Pencil size={11} />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 size={11} />
        </Button>
      </div>
    </div>
  );
}

// ─── Analytics Panel ─────────────────────────────────────────────────────────
function AnalyticsPanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [addingChart, setAddingChart] = useState(false);
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [csvInput, setCsvInput] = useState('');
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [newPointLabel, setNewPointLabel] = useState('');
  const [newPointValue, setNewPointValue] = useState('');

  function patch(partial: Partial<Note>) {
    onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() });
  }

  function parseCSV(raw: string): AnalyticsDataPoint[] {
    return raw.trim().split('\n').map(line => {
      const [label, val] = line.split(',');
      return { label: (label || '').trim(), value: parseFloat(val) || 0 };
    }).filter(p => p.label);
  }

  function addChart() {
    if (!chartTitle.trim()) return;
    const chart: AnalyticsChart = {
      id: crypto.randomUUID(),
      title: chartTitle.trim(),
      type: chartType,
      data: csvInput.trim() ? parseCSV(csvInput) : [{ label: 'A', value: 10 }, { label: 'B', value: 20 }, { label: 'C', value: 15 }],
    };
    patch({ charts: [...(note.charts ?? []), chart] });
    setChartTitle(''); setCsvInput(''); setAddingChart(false);
  }

  function deleteChart(id: string) {
    patch({ charts: note.charts?.filter(c => c.id !== id) });
  }

  function addPoint(chartId: string) {
    if (!newPointLabel.trim()) return;
    patch({
      charts: note.charts?.map(c => c.id === chartId
        ? { ...c, data: [...c.data, { label: newPointLabel.trim(), value: parseFloat(newPointValue) || 0 }] }
        : c
      )
    });
    setNewPointLabel(''); setNewPointValue('');
  }

  function deletePoint(chartId: string, idx: number) {
    patch({
      charts: note.charts?.map(c => c.id === chartId
        ? { ...c, data: c.data.filter((_, i) => i !== idx) }
        : c
      )
    });
  }

  const charts = note.charts ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground flex-1">{charts.length} chart{charts.length !== 1 ? 's' : ''}</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingChart(true)}>
          <PlusCircle size={12} className="mr-1" /> Add Chart
        </Button>
      </div>

      {/* Add chart form */}
      {addingChart && (
        <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
          <Input placeholder="Chart title" value={chartTitle} onChange={e => setChartTitle(e.target.value)} className="h-8 text-sm" autoFocus />
          <div className="flex gap-2">
            {(['bar', 'line', 'pie'] as const).map(t => (
              <button key={t} onClick={() => setChartType(t)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${chartType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}>
                {t}
              </button>
            ))}
          </div>
          <Textarea
            placeholder={"Paste CSV data:\nLabel,Value\nQ1,120\nQ2,180"}
            value={csvInput} onChange={e => setCsvInput(e.target.value)}
            className="h-24 text-xs font-mono resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addChart} disabled={!chartTitle.trim()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingChart(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {charts.length === 0 && !addingChart && (
        <div className="flex flex-col items-center justify-center h-40 gap-3 text-center border border-dashed border-border rounded-lg">
          <BarChart2 size={28} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No charts yet</p>
        </div>
      )}

      {charts.map(chart => (
        <div key={chart.id} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <span className="flex-1 text-sm font-medium">{chart.title}</span>
            <Badge variant="secondary" className="text-[10px]">{chart.type}</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingChartId(editingChartId === chart.id ? null : chart.id)}>
              <Pencil size={11} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteChart(chart.id)}>
              <Trash2 size={11} />
            </Button>
          </div>

          {/* Chart render */}
          <div className="p-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'bar' ? (
                <BarChart data={chart.data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : chart.type === 'line' ? (
                <LineChart data={chart.data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie data={chart.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Edit data points */}
          {editingChartId === chart.id && (
            <div className="border-t border-border px-3 py-2 space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Data Points</p>
              {chart.data.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <span className="flex-1 text-xs truncate">{pt.label}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{pt.value}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deletePoint(chart.id, idx)}>
                    <X size={10} />
                  </Button>
                </div>
              ))}
              <div className="flex gap-1.5 mt-2">
                <Input placeholder="Label" value={newPointLabel} onChange={e => setNewPointLabel(e.target.value)} className="h-7 text-xs flex-1" />
                <Input placeholder="Value" value={newPointValue} onChange={e => setNewPointValue(e.target.value)} className="h-7 text-xs w-20" type="number" />
                <Button size="sm" className="h-7 text-xs" onClick={() => addPoint(chart.id)} disabled={!newPointLabel.trim()}>Add</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sections Panel ───────────────────────────────────────────────────────────
function SectionsPanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<{ sectionId: string; index: number; value: string } | null>(null);

  function patch(partial: Partial<Note>) {
    onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() });
  }

  function addSection() {
    const title = newSectionTitle.trim();
    if (!title) return;
    const s: Section = { id: crypto.randomUUID(), title, items: [], collapsed: false };
    patch({ sections: [...note.sections, s] });
    setNewSectionTitle(''); setAddingSection(false);
  }

  function deleteSection(id: string) { patch({ sections: note.sections.filter(s => s.id !== id) }); }
  function toggleSection(id: string) { patch({ sections: note.sections.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s) }); }

  function addItem(sectionId: string) {
    const text = (newItemText[sectionId] || '').trim();
    if (!text) return;
    patch({ sections: note.sections.map(s => s.id === sectionId ? { ...s, items: [...s.items, text] } : s) });
    setNewItemText(prev => ({ ...prev, [sectionId]: '' }));
  }

  function deleteItem(sectionId: string, index: number) {
    patch({ sections: note.sections.map(s => s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== index) } : s) });
  }

  function commitEditItem() {
    if (!editingItem) return;
    const { sectionId, index, value } = editingItem;
    patch({ sections: note.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map((it, i) => i === index ? value : it) } : s) });
    setEditingItem(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground flex-1">{note.sections.length} section{note.sections.length !== 1 ? 's' : ''}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setAddingSection(true)}>
          <Plus size={13} />
        </Button>
      </div>

      {addingSection && (
        <div className="flex gap-2">
          <Input placeholder="Section title" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSection(); if (e.key === 'Escape') setAddingSection(false); }}
            className="h-8 text-sm" autoFocus />
          <Button size="sm" onClick={addSection} disabled={!newSectionTitle.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingSection(false)}>Cancel</Button>
        </div>
      )}

      {note.sections.length === 0 && !addingSection && (
        <p className="text-sm text-muted-foreground">No sections. Click + to add one.</p>
      )}

      {note.sections.map(section => (
        <div key={section.id} className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <button onClick={() => toggleSection(section.id)} className="text-muted-foreground hover:text-foreground">
              {section.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <span className="flex-1 text-sm font-medium">{section.title}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteSection(section.id)}>
              <Trash2 size={11} />
            </Button>
          </div>
          {!section.collapsed && (
            <div className="px-3 pb-3 space-y-1.5">
              {section.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  {editingItem?.sectionId === section.id && editingItem.index === idx ? (
                    <>
                      <Input value={editingItem.value} onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') commitEditItem(); if (e.key === 'Escape') setEditingItem(null); }}
                        className="h-7 text-sm flex-1" autoFocus />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={commitEditItem}><Check size={11} /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingItem(null)}><X size={11} /></Button>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span className="flex-1 text-sm" onDoubleClick={() => setEditingItem({ sectionId: section.id, index: idx, value: item })}>{item}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => setEditingItem({ sectionId: section.id, index: idx, value: item })}><Pencil size={10} /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteItem(section.id, idx)}><Trash2 size={10} /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input placeholder="Add item…" value={newItemText[section.id] || ''}
                  onChange={e => setNewItemText(prev => ({ ...prev, [section.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') addItem(section.id); }}
                  className="h-7 text-sm" />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addItem(section.id)} disabled={!(newItemText[section.id] || '').trim()}>Add</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground gap-3">
        <FileText size={36} className="opacity-20" />
        <p className="text-sm">Select a note or create one</p>
        <p className="text-xs text-muted-foreground/50">Right-click anywhere on a note for more options</p>
      </div>
    );
  }

  function patch(partial: Partial<Note>) {
    onUpdate({ ...note!, ...partial, updatedAt: new Date().toISOString() });
  }

  function commitTitle() {
    const t = titleDraft.trim();
    if (t) patch({ title: t });
    setEditingTitle(false);
  }

  const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;

  // ── Title bar (shared across all types) ──────────────────────────────────
  const titleBar = (
    <div className="flex items-center gap-2 px-5 h-11 border-b border-border shrink-0 cursor-default">
      {typeIcon(note.type)}
      {editingTitle ? (
        <input
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
          className="flex-1 bg-transparent text-base font-semibold text-foreground outline-none border-b border-border"
          autoFocus
        />
      ) : (
        <h1
          className="flex-1 text-base font-semibold text-foreground cursor-text truncate"
          onDoubleClick={() => { setTitleDraft(note.title); setEditingTitle(true); }}
        >
          {note.title || 'Untitled'}
        </h1>
      )}

      {/* Plus menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
            <Plus size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => patch({ showAiSummary: true })}>
            <Sparkles size={13} className="mr-2 text-violet-500" /> Add AI Summary
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch({ showSections: true })}>
            <Plus size={13} className="mr-2 text-blue-500" /> Add Sections
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Badge variant="outline" className="text-[10px] shrink-0">
        {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </Badge>
    </div>
  );

  // ── Context menu content (shared) ────────────────────────────────────────
  const contextMenuContent = (
    <ContextMenuContent className="w-52">
      <ContextMenuItem onClick={() => { setTitleDraft(note.title); setEditingTitle(true); }}>
        <Pencil size={13} className="mr-2" /> Rename Note
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => patch({ showAiSummary: !note.showAiSummary })}>
        <Sparkles size={13} className="mr-2 text-violet-500" />
        {note.showAiSummary ? 'Hide AI Summary' : 'Show AI Summary'}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => patch({ showSections: !note.showSections })}>
        <Plus size={13} className="mr-2 text-blue-500" />
        {note.showSections ? 'Hide Sections' : 'Show Sections'}
      </ContextMenuItem>
    </ContextMenuContent>
  );

  // ── TEXT note: full-height textarea, no box ───────────────────────────────
  if (note.type === 'text') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}

            {/* Writing area — fills all remaining height */}
            <textarea
              placeholder="Start writing…"
              value={note.content}
              onChange={e => patch({ content: e.target.value })}
              className="flex-1 w-full resize-none border-0 bg-transparent p-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              style={{ fontFamily: 'inherit' }}
            />

            {/* AI Summary + Sections as overlay panel at bottom when enabled */}
            {(note.showAiSummary || note.showSections) && (
              <div className="border-t border-border shrink-0">
                <ScrollArea className="max-h-72">
                  <div className="px-5 py-4 space-y-5">
                    {note.showAiSummary && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={13} className="text-violet-500" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive"
                            onClick={() => patch({ showAiSummary: false })}>
                            <X size={11} />
                          </Button>
                        </div>
                        {editingSummary ? (
                          <div className="space-y-2">
                            <Textarea
                              value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)}
                              placeholder="Write your summary…"
                              className="min-h-[80px] resize-none text-sm bg-muted/40 border border-border rounded-md"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs" onClick={() => { patch({ aiSummary: summaryDraft }); setEditingSummary(false); }}>Save</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingSummary(false)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic cursor-text hover:text-foreground/70 transition-colors min-h-[2rem] p-2 rounded hover:bg-muted/30"
                            onClick={() => { setSummaryDraft(note.aiSummary || ''); setEditingSummary(true); }}>
                            {note.aiSummary || 'Click to write a summary…'}
                          </p>
                        )}
                      </div>
                    )}

                    {note.showAiSummary && note.showSections && <Separator />}

                    {note.showSections && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Sections</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={() => patch({ showSections: false })}>
                            <X size={11} />
                          </Button>
                        </div>
                        <SectionsPanel note={note} onUpdate={onUpdate} />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Word count bar */}
            <div className="px-5 py-1 border-t border-border/50 shrink-0">
              <span className="text-[10px] text-muted-foreground/40">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── VOICE note: recorder only, no textarea ────────────────────────────────
  if (note.type === 'voice') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 max-w-3xl space-y-5">
                <VoicePanel note={note} onUpdate={onUpdate} />

                {note.showAiSummary && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={13} className="text-violet-500" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive"
                          onClick={() => patch({ showAiSummary: false })}>
                          <X size={11} />
                        </Button>
                      </div>
                      {editingSummary ? (
                        <div className="space-y-2">
                          <Textarea
                            value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)}
                            placeholder="Write your summary…"
                            className="min-h-[80px] resize-none text-sm bg-muted/40 border border-border rounded-md"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs" onClick={() => { patch({ aiSummary: summaryDraft }); setEditingSummary(false); }}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingSummary(false)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic cursor-text hover:text-foreground/70 transition-colors min-h-[2rem] p-2 rounded hover:bg-muted/30"
                          onClick={() => { setSummaryDraft(note.aiSummary || ''); setEditingSummary(true); }}>
                          {note.aiSummary || 'Click to write a summary…'}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {note.showSections && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Sections</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive"
                          onClick={() => patch({ showSections: false })}>
                          <X size={11} />
                        </Button>
                      </div>
                      <SectionsPanel note={note} onUpdate={onUpdate} />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── ANALYTICS note: charts only, no textarea ──────────────────────────────
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
          {titleBar}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 max-w-3xl space-y-5">
              <AnalyticsPanel note={note} onUpdate={onUpdate} />

              {note.showAiSummary && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} className="text-violet-500" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => patch({ showAiSummary: false })}>
                        <X size={11} />
                      </Button>
                    </div>
                    {editingSummary ? (
                      <div className="space-y-2">
                        <Textarea
                          value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)}
                          placeholder="Write your summary…"
                          className="min-h-[80px] resize-none text-sm bg-muted/40 border border-border rounded-md"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => { patch({ aiSummary: summaryDraft }); setEditingSummary(false); }}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingSummary(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic cursor-text hover:text-foreground/70 transition-colors min-h-[2rem] p-2 rounded hover:bg-muted/30"
                        onClick={() => { setSummaryDraft(note.aiSummary || ''); setEditingSummary(true); }}>
                        {note.aiSummary || 'Click to write a summary…'}
                      </p>
                    )}
                  </div>
                </>
              )}

              {note.showSections && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Sections</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => patch({ showSections: false })}>
                        <X size={11} />
                      </Button>
                    </div>
                    <SectionsPanel note={note} onUpdate={onUpdate} />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </ContextMenuTrigger>
      {contextMenuContent}
    </ContextMenu>
  );
}
