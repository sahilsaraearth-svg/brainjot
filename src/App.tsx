import { useState, useEffect, useMemo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TitleBar from './components/TitleBar';
import Sidebar, { type FilterType } from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import SettingsPanel from './components/SettingsPanel';
import { loadData, saveData, createNote, createFolder } from './store';
import type { AppData, Note, NoteType, Folder, AppSettings } from './types';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Apply theme
  useEffect(() => {
    const theme = data.settings.theme;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm-base', 'text-md-base', 'text-lg-base');
    const sizes = { sm: '13px', md: '14px', lg: '16px' };
    root.style.fontSize = sizes[data.settings.fontSize];
  }, [data.settings.fontSize]);

  // Persist
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Auto-deselect deleted note
  useEffect(() => {
    if (selectedNoteId && !data.notes.find(n => n.id === selectedNoteId)) {
      setSelectedNoteId(data.notes[0]?.id ?? null);
    }
  }, [data.notes, selectedNoteId]);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === '1') { e.preventDefault(); setActiveFilter('all'); }
      if (meta && e.key === '2') { e.preventDefault(); setActiveFilter('voice'); }
      if (meta && e.key === '3') { e.preventDefault(); setActiveFilter('text'); }
      if (meta && e.key === '4') { e.preventDefault(); setActiveFilter('analytics'); }
      if (meta && e.key === ',') { e.preventDefault(); setActiveFilter('settings'); }
      if (meta && e.key === 'n' && !e.shiftKey) { e.preventDefault(); handleCreateNote('text'); }
      if (meta && e.shiftKey && e.key === 'N') { e.preventDefault(); handleCreateNote('voice'); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const visibleNotes = useMemo(() => {
    let notes = data.notes;
    if (activeFilter === 'voice') notes = notes.filter(n => n.type === 'voice');
    else if (activeFilter === 'text') notes = notes.filter(n => n.type === 'text');
    else if (activeFilter === 'analytics') notes = notes.filter(n => n.type === 'analytics');
    else if (activeFilter !== 'all' && activeFilter !== 'settings') notes = notes.filter(n => n.folderId === activeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.aiSummary && n.aiSummary.toLowerCase().includes(q))
      );
    }
    return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [data.notes, activeFilter, searchQuery]);

  const selectedNote = data.notes.find(n => n.id === selectedNoteId) ?? null;
  const isSettings = activeFilter === 'settings';

  function handleCreateNote(type: NoteType) {
    const folderId = (activeFilter !== 'all' && activeFilter !== 'voice' && activeFilter !== 'text' && activeFilter !== 'analytics' && activeFilter !== 'settings')
      ? activeFilter : undefined;
    const note = createNote(type, folderId);
    setData(prev => ({ ...prev, notes: [note, ...prev.notes] }));
    setSelectedNoteId(note.id);
    if (isSettings) setActiveFilter('all');
  }

  function handleUpdateNote(updated: Note) {
    setData(prev => ({ ...prev, notes: prev.notes.map(n => n.id === updated.id ? updated : n) }));
  }

  function handleDeleteNote(id: string) {
    setData(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
    if (selectedNoteId === id) {
      setSelectedNoteId(data.notes.find(n => n.id !== id)?.id ?? null);
    }
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

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <TitleBar />
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
          ) : (
            <>
              <NoteList
                notes={visibleNotes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
              />
              <NoteEditor note={selectedNote} onUpdate={handleUpdateNote} />
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
