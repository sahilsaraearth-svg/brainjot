import { useState } from 'react';
import {
  Mic, FileText, BarChart2, Plus, Settings,
  Users, Zap, ChevronRight, Search, Sparkles
} from 'lucide-react';
import type { AppData, NoteType } from '../types';
import { createFolder } from '../store';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  activeFilter: { type: 'all' | NoteType | 'folder'; value?: string };
  onFilterChange: (f: { type: 'all' | NoteType | 'folder'; value?: string }) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewNote: (type: NoteType) => void;
}

export default function Sidebar({ data, setData, activeFilter, onFilterChange, searchQuery, onSearchChange, onNewNote: _onNewNote }: Props) {
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const folderCounts: Record<string, number> = {};
  for (const n of data.notes) {
    if (n.folderId) folderCounts[n.folderId] = (folderCounts[n.folderId] || 0) + 1;
  }

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const f = createFolder(data, newFolderName.trim());
    setData({ ...data, folders: [...data.folders, f] });
    setNewFolderName('');
    setAddingFolder(false);
  };

  const navItem = (
    icon: React.ReactNode,
    label: string,
    count: number | null,
    filter: { type: 'all' | NoteType | 'folder'; value?: string }
  ) => {
    const isActive = activeFilter.type === filter.type && activeFilter.value === filter.value;
    return (
      <button
        key={label}
        onClick={() => onFilterChange(filter)}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all group ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-300'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <span className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}>{icon}</span>
        <span className="flex-1 text-left font-medium">{label}</span>
        {count !== null && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-slate-400'}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-[220px] flex-shrink-0 bg-[#111827] flex flex-col h-full border-r border-white/5">
      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
          <Search size={13} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Nav */}
      <div className="px-2 flex-1 overflow-y-auto">
        {/* My Notes section */}
        <div className="mb-3">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">My Notes</div>
          <div className="space-y-0.5">
            {navItem(<Mic size={14} />, 'Voice Notes', data.notes.filter(n => n.type === 'voice').length, { type: 'voice' })}
            {navItem(<FileText size={14} />, 'Text Notes', data.notes.filter(n => n.type === 'text').length, { type: 'text' })}
            {navItem(<BarChart2 size={14} />, 'Analytics', data.notes.filter(n => n.type === 'analytics').length, { type: 'analytics' })}
          </div>
        </div>

        {/* Folders section */}
        <div className="mb-3">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Folders</span>
          </div>
          <div className="space-y-0.5">
            {data.folders.map(folder =>
              navItem(
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: folder.color }} />,
                folder.name,
                folderCounts[folder.id] ?? null,
                { type: 'folder', value: folder.id }
              )
            )}
            {addingFolder ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddFolder();
                    if (e.key === 'Escape') setAddingFolder(false);
                  }}
                  placeholder="Folder name..."
                  className="flex-1 bg-white/10 text-sm text-white rounded px-2 py-1 outline-none border border-indigo-500/50 min-w-0"
                />
                <button onClick={handleAddFolder} className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">Add</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingFolder(true)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
              >
                <Plus size={14} />
                <span className="font-medium">Add Folder</span>
              </button>
            )}
          </div>
        </div>

        {/* Manage section */}
        <div className="mb-3">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Manage</div>
          <div className="space-y-0.5">
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
              <Zap size={14} className="text-slate-500" />
              <span className="font-medium flex-1 text-left">Integrations</span>
              <ChevronRight size={12} className="text-slate-600" />
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
              <Users size={14} className="text-slate-500" />
              <span className="font-medium flex-1 text-left">Teams</span>
              <ChevronRight size={12} className="text-slate-600" />
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
              <Settings size={14} className="text-slate-500" />
              <span className="font-medium flex-1 text-left">Settings</span>
              <ChevronRight size={12} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Power User card */}
      <div className="px-3 py-2">
        <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-500/20 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">You're a Power User!</span>
          </div>
          <p className="text-xs text-slate-400 mb-2 leading-relaxed">Unlock AI summaries, unlimited recordings & team features.</p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
            Start Free Trial
          </button>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">BH</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">Bryce Hoover</div>
            <div className="text-xs text-slate-500 truncate">Pro Plan</div>
          </div>
          <Settings size={13} className="text-slate-500 hover:text-slate-300 cursor-pointer flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
