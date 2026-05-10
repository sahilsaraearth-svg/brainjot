import { useState } from 'react';
import {
  FileText, Mic, BarChart2, Folder, FolderPlus,
  MoreHorizontal, Pencil, Trash2, Search, Settings,
  ChevronRight, Hash, Network, CalendarDays, Layers, Bot,
  Columns2, Cpu, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { Folder as FolderType, Note } from '../types';

export type FilterType = 'all' | 'voice' | 'text' | 'analytics' | 'canvas' | 'flashcard' | 'settings' | 'graph' | 'timeline' | 'sessions' | 'split' | 'ai' | string;

interface SidebarProps {
  folders: FolderType[];
  notes: Note[];
  activeFilter: FilterType;
  searchQuery: string;
  collapsed: boolean;
  onFilterChange: (f: FilterType) => void;
  onSearchChange: (q: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onToggleCollapse: () => void;
}

const NOTE_FILTERS = [
  { id: 'all',        label: 'All Notes',   icon: FileText,    shortcut: '⌘1' },
  { id: 'text',       label: 'Text',        icon: Hash,        shortcut: '⌘2' },
  { id: 'voice',      label: 'Voice',       icon: Mic,         shortcut: '⌘3' },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart2,   shortcut: '⌘4' },
  { id: 'canvas',     label: 'Canvas',      icon: Layers,      shortcut: '' },
  { id: 'flashcard',  label: 'Flashcards',  icon: BookOpen,    shortcut: '' },
];

const BRAIN_VIEWS = [
  { id: 'graph',    label: 'Memory Graph',    icon: Network,     color: 'text-violet-400' },
  { id: 'timeline', label: 'Timeline',        icon: CalendarDays, color: 'text-blue-400' },
  { id: 'sessions', label: 'Smart Sessions',  icon: Cpu,         color: 'text-emerald-400' },
  { id: 'split',    label: 'Split Thinking',  icon: Columns2,    color: 'text-pink-400' },
  { id: 'ai',       label: 'AI Agent',        icon: Bot,         color: 'text-orange-400' },
];

export default function Sidebar({
  folders, notes, activeFilter, searchQuery, collapsed,
  onFilterChange, onSearchChange, onCreateFolder,
  onRenameFolder, onDeleteFolder, onToggleCollapse,
}: SidebarProps) {
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleCreate() {
    const name = newFolderName.trim();
    if (!name) return;
    onCreateFolder(name);
    setNewFolderName('');
    setNewFolderOpen(false);
  }

  function handleRename() {
    const name = renameName.trim();
    if (!name || !renameId) return;
    onRenameFolder(renameId, name);
    setRenameId(null);
  }

  function countForFilter(id: string) {
    if (id === 'all') return notes.length;
    if (['voice', 'text', 'analytics', 'canvas', 'flashcard'].includes(id)) return notes.filter(n => n.type === id).length;
    return notes.filter(n => n.folderId === id).length;
  }

  if (collapsed) {
    return (
      <div className="w-14 flex flex-col items-center bg-sidebar border-r border-sidebar-border py-2 gap-1 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground mb-2"
        >
          <ChevronRight size={14} />
        </button>
        {NOTE_FILTERS.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onFilterChange(id)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  activeFilter === id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <Icon size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
        <Separator className="my-1 bg-sidebar-border w-6" />
        {BRAIN_VIEWS.map(({ id, icon: Icon, label, color }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onFilterChange(id)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  activeFilter === id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : `${color} opacity-60 hover:opacity-100 hover:bg-sidebar-accent`
                }`}
              >
                <Icon size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onFilterChange('settings')}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                activeFilter === 'settings'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Settings size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="w-[220px] flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm font-semibold text-sidebar-foreground">BrainJot</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronRight size={12} className="rotate-180" />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/40" />
          <Input
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-sidebar-accent/50 border-0 focus-visible:ring-1 text-sidebar-foreground placeholder:text-sidebar-foreground/40"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-sidebar-foreground/30 hidden sm:block">⌘K</span>
        </div>
      </div>

      {/* Notes section */}
      <div className="px-2.5 pt-1 pb-0.5">
        <p className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-wider px-1 mb-1">Notes</p>
      </div>
      <div className="px-2 space-y-0.5">
        {NOTE_FILTERS.map(({ id, icon: Icon, label, shortcut }) => {
          const active = activeFilter === id;
          const count = countForFilter(id);
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onFilterChange(id)}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors group ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  <span className={`text-[10px] tabular-nums ${active ? 'text-sidebar-foreground/70' : 'text-sidebar-foreground/30'}`}>
                    {count > 0 ? count : ''}
                  </span>
                  {shortcut && <span className="text-[10px] text-sidebar-foreground/25 hidden group-hover:inline">{shortcut}</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{label}{shortcut && <span className="text-muted-foreground ml-1">{shortcut}</span>}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator className="my-2 bg-sidebar-border" />

      {/* Brain views */}
      <div className="px-2.5 pb-0.5">
        <p className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-wider px-1 mb-1">Second Brain</p>
      </div>
      <div className="px-2 space-y-0.5">
        {BRAIN_VIEWS.map(({ id, icon: Icon, label, color }) => {
          const active = activeFilter === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onFilterChange(id)}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${active ? '' : color}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {id === 'ai' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator className="my-2 bg-sidebar-border" />

      {/* Folders */}
      <div className="flex items-center justify-between px-3 pb-1">
        <span className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-wider">Folders</span>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-sidebar-foreground/40 hover:text-sidebar-foreground" onClick={() => { setNewFolderName(''); setNewFolderOpen(true); }}>
          <FolderPlus size={12} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
        {folders.length === 0 && (
          <p className="text-[11px] text-sidebar-foreground/30 px-2 py-1">No folders</p>
        )}
        {folders.map((folder) => {
          const active = activeFilter === folder.id;
          const count = countForFilter(folder.id);
          return (
            <div key={folder.id} onClick={() => onFilterChange(folder.id)}
              className={`group flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
              }`}
            >
              <Folder size={13} className="shrink-0" />
              <span className="flex-1 truncate text-sm">{folder.name}</span>
              <span className={`text-[10px] tabular-nums ${active ? 'text-sidebar-foreground/70' : 'text-sidebar-foreground/30'}`}>{count > 0 ? count : ''}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-foreground/10 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={11} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameId(folder.id); setRenameName(folder.name); }}>
                    <Pencil size={12} className="mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(folder.id); }}>
                    <Trash2 size={12} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <button
          onClick={() => onFilterChange('settings')}
          className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors ${
            activeFilter === 'settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
          }`}
        >
          <Settings size={14} className="shrink-0" />
          <span className="flex-1 text-left">Settings</span>
          <span className="text-[10px] text-sidebar-foreground/25">⌘,</span>
        </button>
      </div>

      {/* Dialogs */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader>
          <Input placeholder="Folder name" value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename()} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>Notes won't be deleted, just unassigned.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) onDeleteFolder(deleteId); setDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
