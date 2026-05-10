import { Mic, FileText, BarChart2, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
import type { Note, NoteType } from '../types';
import { useState } from 'react';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (type: NoteType) => void;
  onDeleteNote: (id: string) => void;
}

function typeIcon(type: NoteType) {
  if (type === 'voice') return <Mic size={13} className="text-blue-500" />;
  if (type === 'analytics') return <BarChart2 size={13} className="text-green-500" />;
  return <FileText size={13} className="text-muted-foreground" />;
}

function groupByDate(notes: Note[]): { label: string; notes: Note[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, Note[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  for (const note of notes) {
    const d = new Date(note.updatedAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['Today'].push(note);
    else if (d.getTime() === yesterday.getTime()) groups['Yesterday'].push(note);
    else if (d >= weekAgo) groups['This Week'].push(note);
    else groups['Older'].push(note);
  }

  return Object.entries(groups)
    .filter(([, n]) => n.length > 0)
    .map(([label, notes]) => ({ label, notes }));
}

export default function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
}: NoteListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const groups = groupByDate(notes);

  return (
    <div className="w-[260px] flex flex-col bg-background border-r border-border shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Notes</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onCreateNote('text')}>
              <FileText size={13} className="mr-2" /> Text Note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNote('voice')}>
              <Mic size={13} className="mr-2" /> Voice Note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNote('analytics')}>
              <BarChart2 size={13} className="mr-2" /> Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center">
            <FileText size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <Button size="sm" variant="outline" onClick={() => onCreateNote('text')}>
              Create note
            </Button>
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.notes.map((note) => {
                  const active = note.id === selectedNoteId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => onSelectNote(note.id)}
                      className={`group relative flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">{typeIcon(note.type)}</span>
                        <span className="flex-1 text-sm font-medium truncate leading-tight">
                          {note.title || 'Untitled'}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/20 transition-opacity shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(note.id);
                              }}
                            >
                              <Trash2 size={13} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="ml-5 mt-0.5">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {note.content || 'No content'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {note.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(note.updatedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Delete confirm */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) onDeleteNote(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
