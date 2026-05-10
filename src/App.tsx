import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TitleBar from './components/TitleBar';
import Sidebar, { type FilterType } from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import SettingsPanel from './components/SettingsPanel';
import MemoryGraph from './components/MemoryGraph';
import TimelineView from './components/TimelineView';
import ThoughtStream from './components/ThoughtStream';
import FocusMode from './components/FocusMode';
import SmartSessions from './components/SmartSessions';
import SplitView from './components/SplitView';
import LocalAIAgent from './components/LocalAIAgent';
import {
  loadData, saveData, createNote, createFolder, computeLinks, detectContext, extractTags,
} from './store';
import type { AppData, Note, NoteType, Folder, AppSettings } from './types';

const BRAIN_VIEWS: FilterType[] = ['graph', 'timeline', 'sessions', 'split', 'ai'];

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [showStream, setShowStream] = useState(false);

  // Debounce ref for computeLinks
  const linksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const theme = data.settings.theme;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // ── Font size ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sizes = { sm: '13px', md: '14px', lg: '16px' };
    document.documentElement.style.fontSize = sizes[data.settings.fontSize];
  }, [data.settings.fontSize]);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => {
    saveData(data);
  }, [data]);

  // ── Auto-deselect deleted note ─────────────────────────────────────────────
  useEffect(() => {
    if (selectedNoteId && !data.notes.find(n => n.id === selectedNoteId)) {
      setSelectedNoteId(data.notes[0]?.id ?? null);
    }
  }, [data.notes, selectedNoteId]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === '1') { e.preventDefault(); setActiveFilter('all'); }
      if (meta && e.key === '2') { e.preventDefault(); setActiveFilter('voice'); }
      if (meta && e.key === '3') { e.preventDefault(); setActiveFilter('text'); }
      if (meta && e.key === '4') { e.preventDefault(); setActiveFilter('analytics'); }
      if (meta && e.key === '5') { e.preventDefault(); setActiveFilter('graph'); }
      if (meta && e.key === '6') { e.preventDefault(); setActiveFilter('timeline'); }
      if (meta && e.key === ',') { e.preventDefault(); setActiveFilter('settings'); }
      if (meta && e.key === 'n' && !e.shiftKey) { e.preventDefault(); handleCreateNote('text'); }
      if (meta && e.shiftKey && e.key === 'N') { e.preventDefault(); handleCreateNote('voice'); }
      if (meta && e.shiftKey && e.key === 'F') { e.preventDefault(); setFocusModeActive(true); }
      if (e.key === 'Escape') { setFocusModeActive(false); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Visible notes ──────────────────────────────────────────────────────────
  const visibleNotes = useMemo(() => {
    let notes = data.notes;
    if (activeFilter === 'voice') notes = notes.filter(n => n.type === 'voice');
    else if (activeFilter === 'text') notes = notes.filter(n => n.type === 'text');
    else if (activeFilter === 'analytics') notes = notes.filter(n => n.type === 'analytics');
    else if (!BRAIN_VIEWS.includes(activeFilter) && activeFilter !== 'all' && activeFilter !== 'settings') {
      notes = notes.filter(n => n.folderId === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.aiSummary && n.aiSummary.toLowerCase().includes(q))
      );
    }
    return [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [data.notes, activeFilter, searchQuery]);

  const selectedNote = data.notes.find(n => n.id === selectedNoteId) ?? null;
  const isSettings = activeFilter === 'settings';
  const isBrainView = BRAIN_VIEWS.includes(activeFilter);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleCreateNote(type: NoteType) {
    const folderId = (
      activeFilter !== 'all' &&
      activeFilter !== 'voice' &&
      activeFilter !== 'text' &&
      activeFilter !== 'analytics' &&
      activeFilter !== 'settings' &&
      !BRAIN_VIEWS.includes(activeFilter)
    ) ? activeFilter : undefined;
    const note = createNote(type, folderId);
    setData(prev => ({ ...prev, notes: [note, ...prev.notes] }));
    setSelectedNoteId(note.id);
    if (isSettings || isBrainView) setActiveFilter('all');
  }

  const handleUpdateNote = useCallback((updated: Note) => {
    // Run detectContext + extractTags enrichment on content updates
    let enriched = { ...updated };
    if (updated.content) {
      const ctx = detectContext(updated.content);
      const tags = extractTags(updated.content, updated.title);
      enriched = { ...enriched, contentContext: ctx, tags };
    }

    setData(prev => {
      const notes = prev.notes.map(n => n.id === enriched.id ? enriched : n);
      // Debounced computeLinks
      if (linksTimerRef.current) clearTimeout(linksTimerRef.current);
      linksTimerRef.current = setTimeout(() => {
        const linked = computeLinks(notes);
        setData(d => ({ ...d, notes: linked }));
      }, 2000);
      return { ...prev, notes };
    });
  }, []);

  function handleUpdateNoteById(id: string, updates: Partial<Note>) {
    setData(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n),
    }));
  }

  function handleDeleteNote(id: string) {
    setData(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
    if (selectedNoteId === id) {
      setSelectedNoteId(data.notes.find(n => n.id !== id)?.id ?? null);
    }
  }

  function handlePinNote(id: string) {
    setData(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n),
    }));
  }

  function handleCreateFolder(name: string) {
    setData(prev => ({ ...prev, folders: [...prev.folders, createFolder(name)] }));
  }

  function handleRenameFolder(id: string, name: string) {
    setData(prev => ({ ...prev, folders: prev.folders.map((f: Folder) => f.id === id ? { ...f, name } : f) }));
  }

  function handleDeleteFolder(id: string) {
    setData(prev => ({
      ...prev,
      folders: prev.folders.filter((f: Folder) => f.id !== id),
      notes: prev.notes.map(n => n.folderId === id ? { ...n, folderId: undefined } : n),
    }));
    if (activeFilter === id) setActiveFilter('all');
  }

  function handleUpdateSettings(settings: AppSettings) {
    setData(prev => ({ ...prev, settings }));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <TitleBar onToggleStream={() => setShowStream(p => !p)} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            folders={data.folders}
            notes={data.notes}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            collapsed={sidebarCollapsed}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onToggleCollapse={() => setSidebarCollapsed(p => !p)}
          />

          {isSettings ? (
            <SettingsPanel settings={data.settings} onUpdate={handleUpdateSettings} />
          ) : isBrainView ? (
            <div className="flex-1 overflow-hidden">
              {activeFilter === 'graph' && (
                <MemoryGraph
                  notes={data.notes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={(id) => { setSelectedNoteId(id); setActiveFilter('all'); }}
                />
              )}
              {activeFilter === 'timeline' && (
                <TimelineView
                  notes={data.notes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={(id) => { setSelectedNoteId(id); setActiveFilter('all'); }}
                />
              )}
              {activeFilter === 'sessions' && (
                <SmartSessions
                  notes={data.notes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={(id) => { setSelectedNoteId(id); setActiveFilter('all'); }}
                />
              )}
              {activeFilter === 'split' && (
                <SplitView
                  notes={data.notes}
                  primaryNoteId={selectedNoteId}
                  onUpdateNote={handleUpdateNoteById}
                  onClose={() => setActiveFilter('all')}
                />
              )}
              {activeFilter === 'ai' && (
                <LocalAIAgent
                  notes={data.notes}
                  currentNote={selectedNote ?? undefined}
                  onSelectNote={(id) => { setSelectedNoteId(id); setActiveFilter('all'); }}
                  onClose={() => setActiveFilter('all')}
                />
              )}
            </div>
          ) : (
            <>
              <NoteList
                notes={visibleNotes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                onPinNote={handlePinNote}
              />
              <NoteEditor
                note={selectedNote}
                notes={data.notes}
                onUpdate={handleUpdateNote}
                onFocusMode={() => setFocusModeActive(true)}
                onSelectNote={setSelectedNoteId}
              />
            </>
          )}
        </div>

        {/* ThoughtStream — floating widget */}
        {showStream && (
          <ThoughtStream
            notes={data.notes}
            onSelectNote={(id) => { setSelectedNoteId(id); setActiveFilter('all'); }}
            onClose={() => setShowStream(false)}
          />
        )}

        {/* FocusMode — fullscreen overlay */}
        {focusModeActive && selectedNote && (
          <FocusMode
            note={selectedNote}
            onUpdate={(content: string) => handleUpdateNote({ ...selectedNote, content })}
            onExit={() => setFocusModeActive(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
