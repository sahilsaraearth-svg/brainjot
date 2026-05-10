import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, ChevronDown, ChevronRight, Trash2, Pencil,
  Check, X, Mic, FileText, BarChart2, Sparkles,
  StopCircle, Play, Pause, PlusCircle, MicOff,
  Maximize2, History, Network, Tag, Layers, BookOpen,
  Link2, Focus,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Note, Section, VoiceRecording, AnalyticsChart, AnalyticsDataPoint, NoteVersion } from '../types';
import { saveVersion, extractTags } from '../store';
import ContextualWorkspace from './ContextualWorkspace';
import IdeaEvolution from './IdeaEvolution';

interface NoteEditorProps {
  note: Note | null;
  notes: Note[];
  onUpdate: (note: Note) => void;
  onFocusMode: () => void;
  onSelectNote: (id: string) => void;
}

function typeIcon(type: Note['type']) {
  if (type === 'voice') return <Mic size={14} className="text-blue-400" />;
  if (type === 'analytics') return <BarChart2 size={14} className="text-emerald-400" />;
  if (type === 'canvas') return <Layers size={14} className="text-pink-400" />;
  if (type === 'flashcard') return <BookOpen size={14} className="text-yellow-400" />;
  return <FileText size={14} className="text-muted-foreground" />;
}

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

// ─── Voice Panel ─────────────────────────────────────────────────────────────
function VoicePanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [recording, setRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function patch(partial: Partial<Note>) { onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() }); }

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
    } catch { alert('Microphone access denied'); }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  function togglePlay(rec: VoiceRecording) {
    if (!rec.dataUrl) return;
    if (playingId === rec.id) {
      audioRefs.current[rec.id]?.pause(); setPlayingId(null);
    } else {
      if (playingId && audioRefs.current[playingId]) audioRefs.current[playingId].pause();
      if (!audioRefs.current[rec.id]) {
        const a = new Audio(rec.dataUrl); a.onended = () => setPlayingId(null); audioRefs.current[rec.id] = a;
      }
      audioRefs.current[rec.id].play(); setPlayingId(rec.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-blue-500/5">
        {recording ? (
          <>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-1 rounded-full bg-blue-400 animate-pulse" style={{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground flex-1">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
            <Button size="sm" variant="destructive" onClick={stopRecording}>
              <StopCircle size={14} className="mr-1" /> Stop
            </Button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MicOff size={14} className="text-blue-400" />
            </div>
            <span className="text-sm text-muted-foreground flex-1">Ready to record</span>
            <Button size="sm" onClick={startRecording} className="bg-blue-600 hover:bg-blue-500">
              <Mic size={14} className="mr-1" /> Record
            </Button>
          </>
        )}
      </div>

      {(note.recordings ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 rounded-xl border border-dashed border-border">
          <Mic size={24} className="text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">No recordings yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(note.recordings ?? []).map((rec) => (
            <RecordingRow key={rec.id} rec={rec} playing={playingId === rec.id} onTogglePlay={() => togglePlay(rec)}
              onDelete={() => patch({ recordings: note.recordings?.filter(r => r.id !== rec.id) })}
              onRename={(label) => patch({ recordings: note.recordings?.map(r => r.id === rec.id ? { ...r, label } : r) })}
            />
          ))}
        </div>
      )}

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
  rec: VoiceRecording; playing: boolean; onTogglePlay: () => void; onDelete: () => void; onRename: (l: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rec.label);
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/30 group transition-colors">
      <button onClick={onTogglePlay} className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 shrink-0 transition-colors">
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input value={draft} onChange={e => setDraft(e.target.value)}
            onBlur={() => { onRename(draft); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(draft); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
            className="h-6 text-xs px-1 border-0 border-b rounded-none focus-visible:ring-0" autoFocus />
        ) : (
          <p className="text-sm font-medium truncate cursor-text" onDoubleClick={() => setEditing(true)}>{rec.label}</p>
        )}
        <p className="text-[10px] text-muted-foreground">{Math.floor(rec.durationSec / 60)}:{String(rec.durationSec % 60).padStart(2, '0')} · {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setEditing(true)}><Pencil size={11} /></Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 size={11} /></Button>
      </div>
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────
function AnalyticsPanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [addingChart, setAddingChart] = useState(false);
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [csvInput, setCsvInput] = useState('');
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [newPointLabel, setNewPointLabel] = useState('');
  const [newPointValue, setNewPointValue] = useState('');

  function patch(partial: Partial<Note>) { onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() }); }

  function parseCSV(raw: string): AnalyticsDataPoint[] {
    return raw.trim().split('\n').map(line => { const [label, val] = line.split(','); return { label: (label || '').trim(), value: parseFloat(val) || 0 }; }).filter(p => p.label);
  }

  function addChart() {
    if (!chartTitle.trim()) return;
    const chart: AnalyticsChart = {
      id: crypto.randomUUID(), title: chartTitle.trim(), type: chartType,
      data: csvInput.trim() ? parseCSV(csvInput) : [{ label: 'A', value: 10 }, { label: 'B', value: 20 }, { label: 'C', value: 15 }],
    };
    patch({ charts: [...(note.charts ?? []), chart] }); setChartTitle(''); setCsvInput(''); setAddingChart(false);
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

      {addingChart && (
        <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/20">
          <Input placeholder="Chart title" value={chartTitle} onChange={e => setChartTitle(e.target.value)} className="h-8 text-sm" autoFocus />
          <div className="flex gap-2">
            {(['bar', 'line', 'pie'] as const).map(t => (
              <button key={t} onClick={() => setChartType(t)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${chartType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}>
                {t}
              </button>
            ))}
          </div>
          <Textarea placeholder={"Paste CSV:\nLabel,Value\nQ1,120\nQ2,180"} value={csvInput} onChange={e => setCsvInput(e.target.value)} className="h-24 text-xs font-mono resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={addChart} disabled={!chartTitle.trim()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingChart(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {charts.length === 0 && !addingChart && (
        <div className="flex flex-col items-center justify-center h-40 gap-3 border border-dashed border-border rounded-xl">
          <BarChart2 size={28} className="text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No charts yet</p>
        </div>
      )}

      {charts.map(chart => (
        <div key={chart.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <span className="flex-1 text-sm font-medium">{chart.title}</span>
            <Badge variant="secondary" className="text-[10px]">{chart.type}</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setEditingChartId(editingChartId === chart.id ? null : chart.id)}><Pencil size={11} /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => patch({ charts: note.charts?.filter(c => c.id !== chart.id) })}><Trash2 size={11} /></Button>
          </div>
          <div className="p-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'bar' ? (
                <BarChart data={chart.data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : chart.type === 'line' ? (
                <LineChart data={chart.data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
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
          {editingChartId === chart.id && (
            <div className="border-t border-border px-3 py-2 space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Data Points</p>
              {chart.data.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <span className="flex-1 text-xs truncate">{pt.label}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{pt.value}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => patch({ charts: note.charts?.map(c => c.id === chart.id ? { ...c, data: c.data.filter((_, i) => i !== idx) } : c) })}>
                    <X size={10} />
                  </Button>
                </div>
              ))}
              <div className="flex gap-1.5 mt-2">
                <Input placeholder="Label" value={newPointLabel} onChange={e => setNewPointLabel(e.target.value)} className="h-7 text-xs flex-1" />
                <Input placeholder="Value" value={newPointValue} onChange={e => setNewPointValue(e.target.value)} className="h-7 text-xs w-20" type="number" />
                <Button size="sm" className="h-7 text-xs" onClick={() => {
                  if (!newPointLabel.trim()) return;
                  patch({ charts: note.charts?.map(c => c.id === chart.id ? { ...c, data: [...c.data, { label: newPointLabel.trim(), value: parseFloat(newPointValue) || 0 }] } : c) });
                  setNewPointLabel(''); setNewPointValue('');
                }} disabled={!newPointLabel.trim()}>Add</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Canvas Panel ─────────────────────────────────────────────────────────────
function CanvasPanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  function patch(partial: Partial<Note>) { onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() }); }
  const elements = note.canvasElements || [];
  const [newText, setNewText] = useState('');

  const addSticky = () => {
    if (!newText.trim()) return;
    const colors = ['#fbbf24', '#a78bfa', '#34d399', '#f472b6', '#60a5fa'];
    patch({
      canvasElements: [...elements, {
        id: crypto.randomUUID(), type: 'sticky',
        x: 20 + elements.length * 30, y: 20 + elements.length * 20,
        w: 160, h: 100, content: newText, color: colors[elements.length % colors.length],
      }],
    });
    setNewText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Add a sticky note…" value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSticky()} className="flex-1 h-8 text-sm" />
        <Button size="sm" onClick={addSticky} disabled={!newText.trim()}>Add</Button>
      </div>

      {elements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-border rounded-xl">
          <Layers size={28} className="text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Empty canvas — add sticky notes, ideas, links</p>
        </div>
      ) : (
        <div className="relative min-h-[300px] rounded-xl border border-border bg-muted/10 overflow-hidden">
          {elements.map(el => (
            <div
              key={el.id}
              style={{ left: el.x, top: el.y, width: el.w, minHeight: el.h, background: el.color + '30', borderLeft: `3px solid ${el.color}` }}
              className="absolute p-2.5 rounded-lg text-xs text-foreground shadow-sm"
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed">{el.content}</p>
              <button
                onClick={() => patch({ canvasElements: elements.filter(e => e.id !== el.id) })}
                className="absolute top-1 right-1 text-foreground/30 hover:text-foreground/80 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flashcard Panel ──────────────────────────────────────────────────────────
function FlashcardPanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  function patch(partial: Partial<Note>) { onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() }); }
  const cards = note.flashcards || [];
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'edit' | 'study'>('edit');

  const addCard = () => {
    if (!front.trim()) return;
    patch({ flashcards: [...cards, { id: crypto.randomUUID(), front: front.trim(), back: back.trim(), confidence: 0 }] });
    setFront(''); setBack('');
  };

  const rate = (confidence: 0 | 1 | 2 | 3) => {
    patch({ flashcards: cards.map((c, i) => i === currentIdx ? { ...c, confidence } : c) });
    setFlipped(false);
    setCurrentIdx(i => (i + 1) % Math.max(1, cards.length));
  };

  const confidenceColors = ['bg-red-500/20 text-red-300', 'bg-orange-500/20 text-orange-300', 'bg-yellow-500/20 text-yellow-300', 'bg-emerald-500/20 text-emerald-300'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground flex-1">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setMode('edit')} className={`text-xs px-2.5 py-1 rounded transition-colors ${mode === 'edit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Edit</button>
          <button onClick={() => setMode('study')} className={`text-xs px-2.5 py-1 rounded transition-colors ${mode === 'study' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`} disabled={cards.length === 0}>Study</button>
        </div>
      </div>

      {mode === 'edit' && (
        <>
          <div className="rounded-xl border border-border p-3 space-y-2 bg-muted/20">
            <Input placeholder="Front (question)" value={front} onChange={e => setFront(e.target.value)} className="h-8 text-sm" />
            <Input placeholder="Back (answer)" value={back} onChange={e => setBack(e.target.value)} className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && addCard()} />
            <Button size="sm" onClick={addCard} disabled={!front.trim()}>Add Card</Button>
          </div>
          <div className="space-y-2">
            {cards.map((card, i) => (
              <div key={card.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-muted/20 group">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${confidenceColors[card.confidence].split(' ')[0]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{card.front}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.back || '(no answer)'}</p>
                </div>
                <button onClick={() => patch({ flashcards: cards.filter((_, j) => j !== i) })} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {mode === 'study' && cards.length > 0 && (
        <div className="space-y-3">
          <div className="text-center text-[10px] text-muted-foreground">{(currentIdx % cards.length) + 1} / {cards.length}</div>
          <button onClick={() => setFlipped(f => !f)} className="w-full rounded-2xl border border-border bg-muted/30 p-6 min-h-[120px] text-center transition-all hover:border-yellow-500/40 cursor-pointer">
            <p className="text-[10px] text-muted-foreground mb-2">{flipped ? 'Answer' : 'Question'}</p>
            <p className="text-base font-medium text-foreground">{flipped ? cards[currentIdx % cards.length].back : cards[currentIdx % cards.length].front}</p>
            {!flipped && <p className="text-[10px] text-muted-foreground/40 mt-3">Tap to reveal</p>}
          </button>
          {flipped && (
            <div className="flex gap-2">
              {(['Again', 'Hard', 'Good', 'Easy'] as const).map((label, i) => (
                <button key={label} onClick={() => rate(i as 0 | 1 | 2 | 3)} className={`flex-1 text-xs rounded-lg py-2 font-medium transition-colors ${confidenceColors[i]}`}>{label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sections Panel ───────────────────────────────────────────────────────────
function SectionsPanel({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<{ sectionId: string; index: number; value: string } | null>(null);

  function patch(partial: Partial<Note>) { onUpdate({ ...note, ...partial, updatedAt: new Date().toISOString() }); }

  function addSection() {
    const title = newSectionTitle.trim();
    if (!title) return;
    const s: Section = { id: crypto.randomUUID(), title, items: [], collapsed: false };
    patch({ sections: [...note.sections, s] }); setNewSectionTitle(''); setAddingSection(false);
  }

  function addItem(sectionId: string) {
    const text = (newItemText[sectionId] || '').trim();
    if (!text) return;
    patch({ sections: note.sections.map(s => s.id === sectionId ? { ...s, items: [...s.items, text] } : s) });
    setNewItemText(prev => ({ ...prev, [sectionId]: '' }));
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
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setAddingSection(true)}><Plus size={13} /></Button>
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
      {note.sections.length === 0 && !addingSection && <p className="text-sm text-muted-foreground">No sections. Click + to add one.</p>}
      {note.sections.map(section => (
        <div key={section.id} className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <button onClick={() => patch({ sections: note.sections.map(s => s.id === section.id ? { ...s, collapsed: !s.collapsed } : s) })} className="text-muted-foreground hover:text-foreground">
              {section.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <span className="flex-1 text-sm font-medium">{section.title}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => patch({ sections: note.sections.filter(s => s.id !== section.id) })}><Trash2 size={11} /></Button>
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
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => patch({ sections: note.sections.map(s => s.id === section.id ? { ...s, items: s.items.filter((_, i) => i !== idx) } : s) })}><Trash2 size={10} /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input placeholder="Add item…" value={newItemText[section.id] || ''} onChange={e => setNewItemText(prev => ({ ...prev, [section.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addItem(section.id); }} className="h-7 text-sm" />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addItem(section.id)} disabled={!(newItemText[section.id] || '').trim()}>Add</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Connected Notes Panel ────────────────────────────────────────────────────
function ConnectedPanel({ note, notes, onSelectNote }: { note: Note; notes: Note[]; onSelectNote: (id: string) => void }) {
  const linked = (note.links || []).slice(0, 6).map(l => ({ note: notes.find(n => n.id === l.targetId), strength: l.strength })).filter(x => x.note);

  if (linked.length === 0) return (
    <div className="px-5 py-3 border-t border-border/50">
      <p className="text-[10px] text-muted-foreground/40">No connections yet — write more to build your graph</p>
    </div>
  );

  return (
    <div className="border-t border-border/50 px-4 py-3 shrink-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Link2 size={11} className="text-muted-foreground/60" />
        <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Connected</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {linked.map(({ note: n, strength }) => (
          <button key={n!.id} onClick={() => onSelectNote(n!.id)}
            className="flex items-center gap-1.5 text-[10px] bg-muted/40 hover:bg-muted border border-border rounded-full px-2.5 py-1 transition-colors max-w-[140px]"
            title={`${Math.round(strength * 100)}% match`}
          >
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `hsl(${Math.round(strength * 120)}, 60%, 60%)` }} />
            <span className="truncate text-muted-foreground">{n!.title || 'Untitled'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tags Panel ───────────────────────────────────────────────────────────────
function TagsBar({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const tags = note.tags || [];

  const addTag = () => {
    const t = draft.trim().replace(/^#/, '').toLowerCase();
    if (t && !tags.includes(t)) {
      onUpdate({ ...note, tags: [...tags, t], updatedAt: new Date().toISOString() });
    }
    setDraft(''); setAdding(false);
  };

  const autoTags = extractTags(note.content, note.title).filter(t => !tags.includes(t)).slice(0, 3);

  return (
    <div className="flex items-center gap-1.5 px-5 py-2 border-t border-border/50 flex-wrap shrink-0 min-h-[36px]">
      <Tag size={10} className="text-muted-foreground/40 shrink-0" />
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 text-[10px] bg-violet-500/15 text-violet-400 rounded-full px-2 py-0.5 group">
          #{t}
          <button onClick={() => onUpdate({ ...note, tags: tags.filter(x => x !== t), updatedAt: new Date().toISOString() })} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={8} />
          </button>
        </span>
      ))}
      {autoTags.map(t => (
        <button key={t} onClick={() => onUpdate({ ...note, tags: [...tags, t], updatedAt: new Date().toISOString() })}
          className="text-[10px] text-muted-foreground/40 hover:text-violet-400 rounded-full px-2 py-0.5 border border-dashed border-muted-foreground/20 hover:border-violet-500/40 transition-colors">
          +#{t}
        </button>
      ))}
      {adding ? (
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setAdding(false); }}
          onBlur={addTag}
          className="text-[10px] bg-transparent border-b border-violet-500 outline-none text-foreground w-20 placeholder:text-muted-foreground/30"
          placeholder="tag name" />
      ) : (
        <button onClick={() => setAdding(true)} className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors">+ add</button>
      )}
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function NoteEditor({ note, notes, onUpdate, onFocusMode, onSelectNote }: NoteEditorProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const versionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save version on content change (debounced 30s)
  const scheduleVersionSave = useCallback(() => {
    if (versionTimerRef.current) clearTimeout(versionTimerRef.current);
    versionTimerRef.current = setTimeout(() => {
      if (note) onUpdate(saveVersion(note));
    }, 30000);
  }, [note, onUpdate]);

  useEffect(() => () => { if (versionTimerRef.current) clearTimeout(versionTimerRef.current); }, []);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground gap-4 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-blue-500/3 pointer-events-none" />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl border border-border/40 bg-muted/20 flex items-center justify-center mb-4 mx-auto">
            <Network size={24} className="text-violet-400/40" />
          </div>
          <p className="text-sm font-medium text-foreground/60">Your second brain awaits</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Select a note or explore your memory graph</p>
        </div>
      </div>
    );
  }

  function patch(partial: Partial<Note>) {
    const updated = { ...note!, ...partial, updatedAt: new Date().toISOString() };
    onUpdate(updated);
    if ('content' in partial) scheduleVersionSave();
  }

  function commitTitle() {
    const t = titleDraft.trim();
    if (t) patch({ title: t });
    setEditingTitle(false);
  }

  const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;

  // ── Title bar ────────────────────────────────────────────────────────────
  const titleBar = (
    <div className="flex items-center gap-2 px-4 h-11 border-b border-border shrink-0">
      {typeIcon(note.type)}
      {editingTitle ? (
        <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
          onBlur={commitTitle} onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
          className="flex-1 bg-transparent text-base font-semibold text-foreground outline-none border-b border-violet-500" autoFocus />
      ) : (
        <h1 className="flex-1 text-base font-semibold text-foreground cursor-text truncate"
          onDoubleClick={() => { setTitleDraft(note.title); setEditingTitle(true); }}>
          {note.title || 'Untitled'}
        </h1>
      )}

      {/* History toggle */}
      <button onClick={() => setShowHistory(h => !h)}
        className={`p-1.5 rounded transition-colors ${showHistory ? 'bg-violet-500/20 text-violet-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
        title="Version history">
        <History size={13} />
      </button>

      {/* Focus mode */}
      {note.type === 'text' && (
        <button onClick={onFocusMode} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Focus mode">
          <Focus size={13} />
        </button>
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
            <Sparkles size={13} className="mr-2 text-violet-500" /> AI Summary
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch({ showSections: true })}>
            <Plus size={13} className="mr-2 text-blue-500" /> Sections
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onUpdate(saveVersion(note))}>
            <History size={13} className="mr-2 text-muted-foreground" /> Save Snapshot
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-[10px] text-muted-foreground shrink-0">
        {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </span>
    </div>
  );

  // ── Context menu ─────────────────────────────────────────────────────────
  const contextMenuContent = (
    <ContextMenuContent className="w-52">
      <ContextMenuItem onClick={() => { setTitleDraft(note.title); setEditingTitle(true); }}>
        <Pencil size={13} className="mr-2" /> Rename
      </ContextMenuItem>
      <ContextMenuSeparator />
      {note.type === 'text' && (
        <ContextMenuItem onClick={onFocusMode}>
          <Maximize2 size={13} className="mr-2 text-violet-500" /> Focus Mode
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => patch({ showAiSummary: !note.showAiSummary })}>
        <Sparkles size={13} className="mr-2 text-violet-500" /> {note.showAiSummary ? 'Hide' : 'Show'} AI Summary
      </ContextMenuItem>
      <ContextMenuItem onClick={() => patch({ showSections: !note.showSections })}>
        <Plus size={13} className="mr-2 text-blue-500" /> {note.showSections ? 'Hide' : 'Show'} Sections
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onUpdate(saveVersion(note))}>
        <History size={13} className="mr-2" /> Save Snapshot
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setShowHistory(h => !h)}>
        <History size={13} className="mr-2 text-violet-500" /> {showHistory ? 'Hide' : 'View'} History
      </ContextMenuItem>
    </ContextMenuContent>
  );

  // ── Version history overlay ────────────────────────────────────────────
  if (showHistory) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}
            <IdeaEvolution note={note} onRestore={(v: NoteVersion) => { patch({ content: v.content, title: v.title }); setShowHistory(false); }} />
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── AI Summary block ──────────────────────────────────────────────────
  const aiSummaryBlock = note.showAiSummary && (
    <div className="px-5 py-4 border-t border-border/50 bg-violet-500/3 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={12} className="text-violet-400" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</span>
        <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive" onClick={() => patch({ showAiSummary: false })}><X size={11} /></Button>
      </div>
      {editingSummary ? (
        <div className="space-y-2">
          <Textarea value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} placeholder="Write your summary…" className="min-h-[60px] resize-none text-sm bg-muted/40 border border-border rounded-md" autoFocus />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => { patch({ aiSummary: summaryDraft }); setEditingSummary(false); }}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingSummary(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic cursor-text hover:text-foreground/70 transition-colors min-h-[1.5rem] px-1 py-0.5 rounded hover:bg-muted/20"
          onClick={() => { setSummaryDraft(note.aiSummary || ''); setEditingSummary(true); }}>
          {note.aiSummary || 'Click to write a summary…'}
        </p>
      )}
    </div>
  );

  // ── TEXT ────────────────────────────────────────────────────────────────
  if (note.type === 'text') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}
            <textarea
              placeholder="Start writing… your thoughts are safe here"
              value={note.content}
              onChange={e => patch({ content: e.target.value })}
              className="flex-1 w-full resize-none border-0 bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-0 leading-relaxed"
              style={{ fontFamily: 'inherit' }}
            />
            {aiSummaryBlock}
            {note.showSections && (
              <div className="border-t border-border/50 px-5 py-4 shrink-0 bg-muted/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">Sections</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => patch({ showSections: false })}><X size={11} /></Button>
                </div>
                <SectionsPanel note={note} onUpdate={onUpdate} />
              </div>
            )}
            <ContextualWorkspace note={note} onUpdateNote={patch} />
            <ConnectedPanel note={note} notes={notes} onSelectNote={onSelectNote} />
            <TagsBar note={note} onUpdate={onUpdate} />
            <div className="px-5 py-1 border-t border-border/30 shrink-0">
              <span className="text-[10px] text-muted-foreground/30">{wordCount} word{wordCount !== 1 ? 's' : ''} · {note.contentContext || 'general'}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── VOICE ────────────────────────────────────────────────────────────────
  if (note.type === 'voice') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 max-w-3xl space-y-5">
                <VoicePanel note={note} onUpdate={onUpdate} />
                {aiSummaryBlock && <div>{aiSummaryBlock}</div>}
                {note.showSections && (
                  <div className="border border-border/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">Sections</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => patch({ showSections: false })}><X size={11} /></Button>
                    </div>
                    <SectionsPanel note={note} onUpdate={onUpdate} />
                  </div>
                )}
              </div>
            </ScrollArea>
            <TagsBar note={note} onUpdate={onUpdate} />
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── ANALYTICS ────────────────────────────────────────────────────────────
  if (note.type === 'analytics') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 max-w-3xl space-y-5">
                <AnalyticsPanel note={note} onUpdate={onUpdate} />
                {aiSummaryBlock && <div>{aiSummaryBlock}</div>}
                {note.showSections && (
                  <div className="border border-border/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">Sections</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => patch({ showSections: false })}><X size={11} /></Button>
                    </div>
                    <SectionsPanel note={note} onUpdate={onUpdate} />
                  </div>
                )}
              </div>
            </ScrollArea>
            <TagsBar note={note} onUpdate={onUpdate} />
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── CANVAS ────────────────────────────────────────────────────────────────
  if (note.type === 'canvas') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {titleBar}
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 max-w-4xl">
                <CanvasPanel note={note} onUpdate={onUpdate} />
              </div>
            </ScrollArea>
            <TagsBar note={note} onUpdate={onUpdate} />
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // ── FLASHCARD ─────────────────────────────────────────────────────────────
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
          {titleBar}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 max-w-2xl">
              <FlashcardPanel note={note} onUpdate={onUpdate} />
            </div>
          </ScrollArea>
          <TagsBar note={note} onUpdate={onUpdate} />
        </div>
      </ContextMenuTrigger>
      {contextMenuContent}
    </ContextMenu>
  );
}
