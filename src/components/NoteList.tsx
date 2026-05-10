import { useState } from 'react';
import { Mic, FileText, BarChart2, Plus, Trash2, MoreHorizontal, Layers, BookOpen, Pin } from 'lucide-react';
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
  onPinNote?: (id: string) => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  text: <FileText size={12} className="text-muted-foreground shrink-0" />,
  voice: <Mic size={12} className="text-blue-400 shrink-0" />,
  analytics: <BarChart2 size={12} className="text-emerald-400 shrink-0" />,
  canvas: <Layers size={12} className="text-pink-400 shrink-0" />,
  flashcard: <BookOpen size={12} className="text-yellow-400 shrink-0" />,
};

const TYPE_BADGE_COLOR: Record<string, string> = {
  text: '',
  voice: 'bg-blue-500/15 text-blue-400 border-0',
  analytics: 'bg-emerald-500/15 text-emerald-400 border-0',
  canvas: 'bg-pink-500/15 text-pink-400 border-0',
  flashcard: 'bg-yellow-500/15 text-yellow-400 border-0',
};

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

function getNotePreview(note: Note): string {
  if (note.type === 'voice') return `${note.recordings?.length ?? 0} recording${note.recordings?.length !== 1 ? 's' : ''}`;
  if (note.type === 'analytics') return `${note.charts?.length ?? 0} chart${note.charts?.length !== 1 ? 's' : ''}`;
  if (note.type === 'canvas') return `${note.canvasElements?.length ?? 0} element${note.canvasElements?.length !== 1 ? 's' : ''}`;
  if (note.type === 'flashcard') return `${note.flashcards?.length ?? 0} card${note.flashcards?.length !== 1 ? 's' : ''}`;
  return note.content || 'No content';
}

export default function NoteList({
  notes, selectedNoteId, onSelectNote, onCreateNote, onDeleteNote, onPinNote,
}: NoteListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pinned = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);
  const groups = groupByDate(unpinned);

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
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onCreateNote('text')}>
              <FileText size={13} className="mr-2 text-muted-foreground" /> Text Note
              <span className="ml-auto text-[10px] text-muted-foreground">⌘N</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNote('voice')}>
              <Mic size={13} className="mr-2 text-blue-400" /> Voice Note
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCreateNote('analytics')}>
              <BarChart2 size={13} className="mr-2 text-emerald-400" /> Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNote('canvas')}>
              <Layers size={13} className="mr-2 text-pink-400" /> Canvas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNote('flashcard')}>
              <BookOpen size={13} className="mr-2 text-yellow-400" /> Flashcards
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center">
            <div className="relative">
              <FileText size={28} className="text-muted-foreground/20" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500/40 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">Your second brain starts here</p>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onCreateNote('text')}>
              <Plus size={12} className="mr-1" /> New Note
            </Button>
          </div>
        ) : (
          <div className="py-1">
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Pin size={9} /> Pinned
                </div>
                {pinned.map(note => <NoteItem key={note.id} note={note} active={note.id === selectedNoteId} onSelect={onSelectNote} onDelete={id => setConfirmDeleteId(id)} onPin={onPinNote} />)}
              </div>
            )}

            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.notes.map(note => (
                  <NoteItem key={note.id} note={note} active={note.id === selectedNoteId} onSelect={onSelectNote} onDelete={id => setConfirmDeleteId(id)} onPin={onPinNote} />
                ))}
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
            <AlertDialogAction onClick={() => { if (confirmDeleteId) onDeleteNote(confirmDeleteId); setConfirmDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NoteItem({ note, active, onSelect, onDelete, onPin }: {
  note: Note; active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin?: (id: string) => void;
}) {
  const hasLinks = (note.links?.length ?? 0) > 0;

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`group relative flex flex-col px-3 py-2 cursor-pointer transition-colors ${
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {TYPE_ICON[note.type] || <FileText size={12} className="text-muted-foreground shrink-0" />}
        <span className="flex-1 text-[13px] font-medium truncate">{note.title || 'Untitled'}</span>
        {hasLinks && (
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60 shrink-0" title={`${note.links!.length} connections`} />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/20 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onPin && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(note.id); }}>
                <Pin size={12} className="mr-2" /> {note.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>
              <Trash2 size={12} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 pl-[18px]">{getNotePreview(note)}</p>
      <div className="flex items-center gap-1.5 mt-1 pl-[18px]">
        {note.type !== 'text' && (
          <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-3.5 rounded ${TYPE_BADGE_COLOR[note.type] || ''}`}>
            {note.type}
          </Badge>
        )}
        {(note.tags || []).slice(0, 2).map(t => (
          <span key={t} className="text-[9px] text-muted-foreground/50">#{t}</span>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
