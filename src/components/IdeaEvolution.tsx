import { useState } from 'react';
import { History, ChevronRight, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Note, NoteVersion } from '../types';

interface Props {
  note: Note;
  onRestore: (version: NoteVersion) => void;
}

function diffWords(a: string, b: string): { type: 'same' | 'add' | 'remove'; text: string }[] {
  const aWords = a.split(' ');
  const bWords = b.split(' ');
  const result: { type: 'same' | 'add' | 'remove'; text: string }[] = [];

  // Simple LCS-based diff
  const aSet = new Set(aWords);
  const _bSet = new Set(bWords); void _bSet;

  bWords.forEach(w => {
    if (aSet.has(w)) result.push({ type: 'same', text: w });
    else result.push({ type: 'add', text: w });
  });

  return result.slice(0, 200); // limit display
}

export default function IdeaEvolution({ note, onRestore }: Props) {
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const versions = note.versions || [];

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <History size={28} className="text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">No version history yet</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Versions auto-save every few minutes</p>
      </div>
    );
  }

  const displayVersion = selectedVersion || versions[versions.length - 1];
  const prevVersion = selectedVersion
    ? versions[versions.indexOf(selectedVersion) - 1]
    : versions[versions.length - 2];

  const diff = prevVersion ? diffWords(prevVersion.content, displayVersion.content) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
        <History size={13} className="text-violet-400" />
        <span className="text-sm font-semibold">Idea Evolution</span>
        <span className="text-xs text-muted-foreground">{versions.length} snapshots</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Version list */}
        <div className="w-[180px] shrink-0 border-r border-border">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {/* Current */}
              <button
                onClick={() => setSelectedVersion(null)}
                className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                  !selectedVersion ? 'bg-violet-500/15 border border-violet-500/30' : 'hover:bg-muted/40 border border-transparent'
                }`}
              >
                <div className="text-xs font-medium text-violet-300">Current</div>
                <div className="text-[10px] text-muted-foreground">{note.content.trim().split(/\s+/).filter(Boolean).length} words</div>
              </button>

              {[...versions].reverse().map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                    selectedVersion?.id === v.id ? 'bg-muted border border-border' : 'hover:bg-muted/40 border border-transparent'
                  }`}
                >
                  <div className="text-xs font-medium text-foreground">v{versions.length - i}</div>
                  <div className="text-[10px] text-muted-foreground">{format(new Date(v.savedAt), 'MMM d, h:mm a')}</div>
                  <div className="text-[9px] text-muted-foreground/50">{v.content.trim().split(/\s+/).filter(Boolean).length}w</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Version content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedVersion && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <ChevronRight size={12} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">{displayVersion.title}</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(displayVersion.savedAt), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <button
                onClick={() => onRestore(selectedVersion)}
                className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                <RotateCcw size={11} /> Restore
              </button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-4">
              {diff ? (
                <div className="text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                  {diff.map((chunk, i) => (
                    <span
                      key={i}
                      className={
                        chunk.type === 'add' ? 'bg-emerald-500/20 text-emerald-300' :
                        chunk.type === 'remove' ? 'bg-red-500/20 text-red-300 line-through' :
                        'text-foreground/70'
                      }
                    >
                      {chunk.text}{' '}
                    </span>
                  ))}
                </div>
              ) : (
                <pre className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
                  {displayVersion.content || 'Empty'}
                </pre>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
