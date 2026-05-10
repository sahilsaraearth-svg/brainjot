import { useState } from 'react';
import { Mic, FileText, BarChart2, Trash2, MoreVertical, Plus } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Note, NoteType, AppData } from '../types';
import { groupNotesByDate, formatRelativeTime, createNote, updateNote, deleteNote } from '../store';
import type { FilterType } from './Sidebar';

interface Props {
  data: AppData;
  filter: FilterType;
  search: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDataChange: (d: AppData) => void;
}

const typeIcon: Record<NoteType, React.ElementType> = {
  voice: Mic,
  text: FileText,
  analytics: BarChart2,
};

const typeColors: Record<NoteType, string> = {
  voice: 'text-violet-500',
  text: 'text-blue-500',
  analytics: 'text-emerald-500',
};

export default function NoteList({ data, filter, search, selectedId, onSelect, onDataChange }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    const newData = deleteNote(data, deleteTarget.id);
    onDataChange(newData);
    setDeleteTarget(null);
  }

  function handleNewNote(type: NoteType) {
    const folderId = (filter !== 'all' && filter !== 'voice' && filter !== 'text' && filter !== 'analytics')
      ? filter
      : undefined;
    const noteType: NoteType = (filter === 'voice' || filter === 'text' || filter === 'analytics')
      ? filter as NoteType
      : type;
    const note = createNote(data, noteType, folderId);
    const newData = updateNote(data, note);
    onDataChange(newData);
    onSelect(note.id);
  }

  // Filter notes
  let filtered = data.notes;
  if (filter === 'voice') filtered = filtered.filter(n => n.type === 'voice');
  else if (filter === 'text') filtered = filtered.filter(n => n.type === 'text');
  else if (filter === 'analytics') filtered = filtered.filter(n => n.type === 'analytics');
  else if (filter !== 'all') filtered = filtered.filter(n => n.folderId === filter);

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }

  const groups = groupNotesByDate(filtered);
  const groupKeys = Object.keys(groups);

  return (
    <div className="flex flex-col h-full w-[260px] bg-background border-r border-border shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">
          {filter === 'all' ? 'All Notes'
            : filter === 'voice' ? 'Voice Notes'
            : filter === 'text' ? 'Text Notes'
            : filter === 'analytics' ? 'Analytics'
            : data.folders.find(f => f.id === filter)?.name ?? 'Notes'}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => handleNewNote('text')}>
              <FileText className="h-3.5 w-3.5 mr-2 text-blue-500" />
              Text Note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewNote('voice')}>
              <Mic className="h-3.5 w-3.5 mr-2 text-violet-500" />
              Voice Note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewNote('analytics')}>
              <BarChart2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
              Analytics Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-30" />
            <p className="text-sm">No notes yet</p>
            <Button variant="outline" size="sm" onClick={() => handleNewNote('text')}>
              Create one
            </Button>
          </div>
        )}

        {groupKeys.map(groupKey => (
          <div key={groupKey}>
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm">
              {groupKey}
            </div>
            {groups[groupKey].map(note => {
              const Icon = typeIcon[note.type];
              const isSelected = note.id === selectedId;
              return (
                <div
                  key={note.id}
                  onClick={() => onSelect(note.id)}
                  className={`group relative px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors
                    ${isSelected ? 'bg-accent' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${typeColors[note.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-accent-foreground' : 'text-foreground'}`}>
                        {note.title || 'Untitled Note'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">
                        {note.content || 'No content'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(note.updatedAt)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={e => { e.stopPropagation(); setDeleteTarget(note); }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title || 'Untitled'}" will be permanently deleted.
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
