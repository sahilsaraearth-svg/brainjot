import { useState } from 'react';
import { Mic, FileText, BarChart2, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Note, NoteType } from '../types';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (type: NoteType) => void;
  onDeleteNote: (id: string) => void;
}

function typeIcon(type: NoteType) {
  if (type === 'voice') return <Mic size={12} className="text-blue-500 shrink-0" />;
  if (type === 'analytics') return <BarChart2 size={12} className="text-emerald-500 shrink-0" />;
  return <FileText size={12} className="text-muted-foreground shrink-0" />;
}

function groupByDate(notes: Note[]): { label: string; notes: Note[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, Note[]> = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
  for (const note of notes) {
    const d = new Date(note.updatedAt); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['Today'].push(note);
    else if (d.getTime() === yesterday.getTime()) groups['Yesterday'].push(note);
    else if (d >= weekAgo) groups['This Week'].push(note);
    else groups['Older'].push(note);
  }
  return Object.entries(groups).filter(([, n]) => n.length > 0).map(([label, notes]) => ({ label, notes }));
}

export default function NoteList({
  notes, selectedNoteId, onSelectNote, onCreateNote, onDeleteNote,
}: NoteListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const groups = groupByDate(notes);

  return (
    <div className="w-[260px] flex flex-col bg-background border-r border-border shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">Notes</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onCreateNote('text')}>
              <FileText size={13} className="mr-2 text-muted-foreground" /> Text Note
              <span className="ml-auto text-[10px] text-muted-foreground">⌘N</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNote('voice')}>
              <Mic size={13} className="mr-2 text-blue-500" /> Voice Note
              <span className="ml-auto text-[10px] text-muted-foreground">⌘⇧N</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCreateNote('analytics')}>
              <BarChart2 size={13} className="mr-2 text-emerald-500" /> Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center">
            <FileText size={28} className="text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No notes here yet</p>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onCreateNote('text')}>
              <Plus size={12} className="mr-1" /> New Note
            </Button>
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.notes.map((note) => {
                  const active = note.id === selectedNoteId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => onSelectNote(note.id)}
                      className={`group relative flex flex-col px-3 py-2 cursor-pointer transition-colors ${
                        active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {typeIcon(note.type)}
                        <span className="flex-1 text-[13px] font-medium truncate">
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
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                            >
                              <Trash2 size={12} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 pl-[18px]">
                        {note.content || (note.type === 'voice' ? `${note.recordings?.length ?? 0} recording(s)` : note.type === 'analytics' ? `${note.charts?.length ?? 0} chart(s)` : 'No content')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 pl-[18px]">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 rounded">
                          {note.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDeleteId) onDeleteNote(confirmDeleteId); setConfirmDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
