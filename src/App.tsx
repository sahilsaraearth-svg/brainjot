import { useState, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TitleBar from './components/TitleBar';
import Sidebar, { type FilterType } from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { loadData } from './store';
import type { AppData } from './types';

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDataChange = useCallback((newData: AppData) => {
    setData(newData);
  }, []);

  const selectedNote = data.notes.find(n => n.id === selectedId) ?? null;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            data={data}
            filter={filter}
            search={search}
            onFilterChange={setFilter}
            onSearchChange={setSearch}
            onDataChange={handleDataChange}
          />
          <NoteList
            data={data}
            filter={filter}
            search={search}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDataChange={handleDataChange}
          />
          <NoteEditor
            note={selectedNote}
            data={data}
            onDataChange={handleDataChange}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
