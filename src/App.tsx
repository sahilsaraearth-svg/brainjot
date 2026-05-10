import { useState, useEffect, useMemo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { loadData, saveData, createNote, createFolder } from './store';
import type { AppData, Note, NoteType, Folder } from './types';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persist on every data change
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Select first note when list changes (if current selection disappears)
  useEffect(() => {
    if (selectedNoteId && !data.notes.find((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(data.notes[0]?.id ?? null);
    }
  }, [data.notes, selectedNoteId]);

  // Filtered + searched notes
  const visibleNotes = useMemo(() => {
    let notes = data.notes;

    if (activeFilter === 'voice') notes = notes.filter((n) => n.type === 'voice');
    else if (activeFilter === 'text') notes = notes.filter((n) => n.type === 'text');
    else if (activeFilter === 'analytics') notes = notes.filter((n) => n.type === 'analytics');
    else if (activeFilter !== 'all') notes = notes.filter((n) => n.folderId === activeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.aiSummary && n.aiSummary.toLowerCase().includes(q))
      );
    }

    return [...notes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [data.notes, activeFilter, searchQuery]);

  const selectedNote = data.notes.find((n) => n.id === selectedNoteId) ?? null;

  function handleCreateNote(type: NoteType) {
    const folderId =
      activeFilter !== 'all' &&
      activeFilter !== 'voice' &&
      activeFilter !== 'text' &&
      activeFilter !== 'analytics'
        ? activeFilter
        : undefined;
    const note = createNote(type, folderId);
    setData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
    setSelectedNoteId(note.id);
  }

  function handleUpdateNote(updated: Note) {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === updated.id ? updated : n)),
    }));
  }

  function handleDeleteNote(id: string) {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
    if (selectedNoteId === id) {
      const remaining = data.notes.filter((n) => n.id !== id);
      setSelectedNoteId(remaining[0]?.id ?? null);
    }
  }

  function handleCreateFolder(name: string) {
    const folder = createFolder(name);
    setData((prev) => ({ ...prev, folders: [...prev.folders, folder] }));
  }

  function handleRenameFolder(id: string, name: string) {
    setData((prev) => ({
      ...prev,
      folders: prev.folders.map((f: Folder) => (f.id === id ? { ...f, name } : f)),
    }));
  }

  function handleDeleteFolder(id: string) {
    setData((prev) => ({
      ...prev,
      folders: prev.folders.filter((f: Folder) => f.id !== id),
      notes: prev.notes.map((n) =>
        n.folderId === id ? { ...n, folderId: undefined } : n
      ),
    }));
    if (activeFilter === id) setActiveFilter('all');
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            folders={data.folders}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
          <NoteList
            notes={visibleNotes}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
          />
          <NoteEditor note={selectedNote} onUpdate={handleUpdateNote} />
        </div>
      </div>
    </TooltipProvider>
  );
}
