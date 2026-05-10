import { useState } from 'react';
import {
  FolderOpen, Plus, Mic, FileText, BarChart2, Inbox,
  MoreHorizontal, Pencil, Trash2, Search, ChevronRight,
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
import type { AppData, Folder } from '../types';
import { createFolder, renameFolder, deleteFolder } from '../store';

export type FilterType = 'all' | 'voice' | 'text' | 'analytics' | string; // string for folder ids

interface Props {
  data: AppData;
  filter: FilterType;
  search: string;
  onFilterChange: (f: FilterType) => void;
  onSearchChange: (s: string) => void;
  onDataChange: (d: AppData) => void;
}

const topFilters: { id: FilterType; label: string; Icon: React.ElementType }[] = [
  { id: 'all', label: 'All Notes', Icon: Inbox },
  { id: 'voice', label: 'Voice Notes', Icon: Mic },
  { id: 'text', label: 'Text Notes', Icon: FileText },
  { id: 'analytics', label: 'Analytics', Icon: BarChart2 },
];

export default function Sidebar({ data, filter, search, onFilterChange, onSearchChange, onDataChange }: Props) {
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [foldersExpanded, setFoldersExpanded] = useState(true);

  function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const { data: newData } = createFolder(data, name);
    onDataChange(newData);
    setNewFolderName('');
    setNewFolderOpen(false);
  }

  function handleRename() {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    onDataChange(renameFolder(data, renameTarget.id, name));
    setRenameOpen(false);
    setRenameTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const newData = deleteFolder(data, deleteTarget.id);
    onDataChange(newData);
    if (filter === deleteTarget.id) onFilterChange('all');
    setDeleteTarget(null);
  }

  function openRename(folder: Folder) {
    setRenameTarget(folder);
    setRenameName(folder.name);
    setRenameOpen(true);
  }

  const folderNoteCount = (folderId: string) =>
    data.notes.filter(n => n.folderId === folderId).length;

  return (
    <div className="flex flex-col h-full w-[220px] bg-sidebar border-r border-border shrink-0">
      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Top filters */}
      <nav className="px-2 space-y-0.5">
        {topFilters.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors
              ${filter === id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mx-3 my-2 h-px bg-border" />

      {/* Folders header */}
      <div className="px-2 mb-1 flex items-center justify-between">
        <button
          onClick={() => setFoldersExpanded(v => !v)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${foldersExpanded ? 'rotate-90' : ''}`} />
          Folders
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setNewFolderOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Folder list */}
      {foldersExpanded && (
        <div className="px-2 space-y-0.5 overflow-y-auto flex-1">
          {data.folders.length === 0 && (
            <p className="text-xs text-muted-foreground px-2.5 py-1.5">No folders yet</p>
          )}
          {data.folders.map(folder => (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm cursor-pointer transition-colors
                ${filter === folder.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              onClick={() => onFilterChange(folder.id)}
            >
              <FolderOpen
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: folder.color ?? 'currentColor' }}
              />
              <span className="flex-1 truncate">{folder.name}</span>
              <span className="text-xs opacity-60">{folderNoteCount(folder.id)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); openRename(folder); }}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(folder); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* New Folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Notes in this folder won't be deleted — they'll become unorganized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
