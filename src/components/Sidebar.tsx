import { useState } from 'react';
import {
  FileText,
  Mic,
  BarChart2,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Folder as FolderType } from '../types';

type FilterType = 'all' | 'voice' | 'text' | 'analytics' | string;

interface SidebarProps {
  folders: FolderType[];
  activeFilter: FilterType;
  searchQuery: string;
  onFilterChange: (f: FilterType) => void;
  onSearchChange: (q: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

export default function Sidebar({
  folders,
  activeFilter,
  searchQuery,
  onFilterChange,
  onSearchChange,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: SidebarProps) {
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleCreateFolder() {
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
    setRenameName('');
  }

  function handleDelete() {
    if (!deleteId) return;
    onDeleteFolder(deleteId);
    setDeleteId(null);
  }

  const navItem = (
    label: string,
    icon: React.ReactNode,
    filter: FilterType
  ) => {
    const active = activeFilter === filter;
    return (
      <button
        key={filter}
        onClick={() => onFilterChange(filter)}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-sm transition-colors ${
          active
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="w-[220px] flex flex-col bg-background border-r border-border shrink-0 overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-2 py-1 space-y-0.5">
        {navItem('All Notes', <FileText size={14} />, 'all')}
        {navItem('Voice', <Mic size={14} />, 'voice')}
        {navItem('Text', <FileText size={14} />, 'text')}
        {navItem('Analytics', <BarChart2 size={14} />, 'analytics')}
      </div>

      {/* Folders header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setNewFolderName('');
            setNewFolderOpen(true);
          }}
        >
          <FolderPlus size={13} />
        </Button>
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        {folders.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-2">No folders yet</p>
        )}
        {folders.map((folder) => {
          const active = activeFilter === folder.id;
          return (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => onFilterChange(folder.id)}
            >
              <Folder size={14} className="shrink-0" />
              <span className="flex-1 truncate">{folder.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/20 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameId(folder.id);
                      setRenameName(folder.name);
                    }}
                  >
                    <Pencil size={13} className="mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(folder.id);
                    }}
                  >
                    <Trash2 size={13} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Create folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Notes in this folder won't be deleted, just unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
