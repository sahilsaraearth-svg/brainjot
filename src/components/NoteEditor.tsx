import { useState, useEffect } from 'react';
import {
  Mic, FileText, BarChart2, Share2, ChevronDown, ChevronRight,
  Plus, Trash2, Sparkles, Clock, FolderOpen, Users, Edit3,
  Play, Pause, Volume2, CheckSquare, SkipBack, SkipForward
} from 'lucide-react';
import type { Note, NoteType, AppData, Section } from '../types';
import { updateNote } from '../store';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  note: Note;
  data: AppData;
  setData: (d: AppData) => void;
}

export default function NoteEditor({ note, data, setData }: Props) {
  const [local, setLocal] = useState<Note>(note);
  const [editingTitle, setEditingTitle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [progress, setProgress] = useState(32);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);

  useEffect(() => {
    setLocal(note);
  }, [note.id]);

  const save = (updated: Note) => {
    setLocal(updated);
    const newData = updateNote(data, updated);
    setData(newData);
  };

  const toggleSection = (sectionId: string) => {
    const updated = {
      ...local,
      sections: local.sections.map(s =>
        s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
      )
    };
    save(updated);
  };

  const addItem = (sectionId: string) => {
    if (!newItem.trim()) return;
    const updated = {
      ...local,
      sections: local.sections.map(s =>
        s.id === sectionId ? { ...s, items: [...s.items, newItem.trim()] } : s
      )
    };
    setNewItem('');
    setEditingSection(null);
    save(updated);
  };

  const removeItem = (sectionId: string, idx: number) => {
    const updated = {
      ...local,
      sections: local.sections.map(s =>
        s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== idx) } : s
      )
    };
    save(updated);
  };

  const addSection = () => {
    const newSection: Section = {
      id: uuidv4(),
      title: 'New Section',
      items: [],
      collapsed: false,
    };
    save({ ...local, sections: [...local.sections, newSection] });
  };

  const folderName = local.folderId
    ? data.folders.find(f => f.id === local.folderId)?.name ?? 'Unknown'
    : null;

  const typeIcon = (type: NoteType) => {
    if (type === 'voice') return <Mic size={14} className="text-indigo-400" />;
    if (type === 'analytics') return <BarChart2 size={14} className="text-emerald-400" />;
    return <FileText size={14} className="text-amber-400" />;
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#0f1724]">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              local.type === 'voice' ? 'bg-indigo-500/15' :
              local.type === 'analytics' ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}>
              {typeIcon(local.type)}
            </div>
            {editingTitle ? (
              <input
                autoFocus
                value={local.title}
                onChange={e => setLocal({ ...local, title: e.target.value })}
                onBlur={() => { setEditingTitle(false); save(local); }}
                onKeyDown={e => { if (e.key === 'Enter') { setEditingTitle(false); save(local); } }}
                className="bg-transparent text-base font-semibold text-white outline-none border-b border-indigo-500 min-w-0 flex-1"
              />
            ) : (
              <h1
                className="text-base font-semibold text-white truncate cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => setEditingTitle(true)}
              >
                {local.title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500">
              Updated {format(new Date(local.updatedAt), 'MMM d, h:mm a')}
            </span>
            <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Share2 size={12} />
              Share
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 max-w-3xl">
            {/* Video player (for voice notes) */}
            {local.type === 'voice' && (
              <div className="bg-[#1a2235] rounded-xl overflow-hidden mb-5 border border-white/5">
                {/* Video placeholder */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 h-44 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/10" />
                  <div className="text-center relative z-10">
                    <div className="w-14 h-14 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2">
                      <Mic size={24} className="text-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-400">Voice Recording</p>
                  </div>
                  {/* Waveform visualization */}
                  <div className="absolute bottom-4 left-0 right-0 flex items-end justify-center gap-0.5 px-8 h-8">
                    {Array.from({ length: 60 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${i < progress * 0.6 ? 'bg-indigo-500' : 'bg-white/15'}`}
                        style={{ height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}%` }}
                      />
                    ))}
                  </div>
                </div>
                {/* Controls */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <SkipBack size={15} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} fill="white" />}
                  </button>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <SkipForward size={15} />
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-8">
                      {Math.floor(progress / 60)}:{String(progress % 60).padStart(2, '0')}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer" onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const pct = x / rect.width;
                      setProgress(Math.floor(pct * 180));
                    }}>
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(progress / 180) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8">3:00</span>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Note metadata */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={12} className="text-slate-500" />
                {format(new Date(local.createdAt), 'MMMM d, yyyy')}
              </div>
              {folderName && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FolderOpen size={12} className="text-slate-500" />
                  {folderName}
                </div>
              )}
              {local.assignees.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-slate-500" />
                  <div className="flex items-center gap-1">
                    {local.assignees.map(a => (
                      <div
                        key={a.id}
                        className="flex items-center gap-1 text-xs text-slate-400"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: a.color }}
                        >
                          {a.name[0]}
                        </div>
                        <span>{a.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {local.aiSummary && (
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-300">AI Summary</span>
                  </div>
                  <button
                    onClick={() => setEditingSummary(!editingSummary)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Edit3 size={12} />
                  </button>
                </div>
                {editingSummary ? (
                  <textarea
                    autoFocus
                    value={local.aiSummary}
                    onChange={e => setLocal({ ...local, aiSummary: e.target.value })}
                    onBlur={() => { setEditingSummary(false); save(local); }}
                    className="w-full bg-transparent text-sm text-slate-300 leading-relaxed outline-none resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">{local.aiSummary}</p>
                )}
              </div>
            )}

            {/* Sections */}
            {local.sections.map(section => (
              <div key={section.id} className="mb-3 bg-[#1a2235]/50 rounded-xl border border-white/5 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">{section.title}</span>
                    <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {section.items.length}
                    </span>
                  </div>
                  {section.collapsed ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </button>
                {!section.collapsed && (
                  <div className="px-4 pb-3">
                    <ul className="space-y-1.5">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 group">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-slate-300 flex-1 leading-relaxed">{item}</span>
                          <button
                            onClick={() => removeItem(section.id, idx)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all mt-0.5 flex-shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    {editingSection === section.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          autoFocus
                          value={newItem}
                          onChange={e => setNewItem(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addItem(section.id);
                            if (e.key === 'Escape') { setEditingSection(null); setNewItem(''); }
                          }}
                          placeholder="Add item..."
                          className="flex-1 bg-white/5 text-sm text-white rounded-lg px-3 py-1.5 outline-none border border-indigo-500/30 placeholder-slate-600"
                        />
                        <button
                          onClick={() => addItem(section.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingSection(section.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 mt-2 transition-colors"
                      >
                        <Plus size={12} />
                        Add item
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add section */}
            <button
              onClick={addSection}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 mb-6 transition-colors"
            >
              <Plus size={13} />
              Add section
            </button>

            {/* Notes content */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 size={13} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</span>
              </div>
              <textarea
                value={local.content}
                onChange={e => {
                  const updated = { ...local, content: e.target.value };
                  setLocal(updated);
                }}
                onBlur={() => save(local)}
                placeholder="Start typing your notes..."
                className="w-full bg-[#1a2235]/30 text-sm text-slate-300 leading-relaxed rounded-xl border border-white/5 p-4 outline-none resize-none placeholder-slate-600 min-h-[120px] focus:border-indigo-500/30 transition-colors"
                rows={6}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transcript panel (only for voice notes with transcript) */}
      {local.type === 'voice' && local.transcript.length > 0 && showTranscript && (
        <div className="w-[280px] flex-shrink-0 bg-[#111827] border-l border-white/5 flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Mic size={13} className="text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Transcript</span>
            </div>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {local.transcript.map(entry => (
              <div key={entry.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono">{entry.timestamp}</span>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: entry.speakerColor }}
                  >
                    {entry.speaker}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-9">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show transcript button when hidden */}
      {local.type === 'voice' && local.transcript.length > 0 && !showTranscript && (
        <button
          onClick={() => setShowTranscript(true)}
          className="absolute bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
        >
          <Mic size={12} />
          Show Transcript
        </button>
      )}
    </div>
  );
}
