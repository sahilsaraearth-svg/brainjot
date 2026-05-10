import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Mic, BarChart2, Clock, Hash } from 'lucide-react';
import type { Note } from '../types';
import { format, differenceInMinutes } from 'date-fns';

interface Props {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

interface SessionGroup {
  id: string;
  label: string;
  topic: string;
  notes: Note[];
  startTime: Date;
  endTime: Date;
  mood?: string;
  tags: string[];
}

function groupIntoSessions(notes: Note[]): SessionGroup[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  const sessions: SessionGroup[] = [];
  let current: Note[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].updatedAt);
    const curr = new Date(sorted[i].updatedAt);
    const gap = differenceInMinutes(curr, prev);

    if (gap > 90) {
      sessions.push(makeSession(current, sessions.length));
      current = [sorted[i]];
    } else {
      current.push(sorted[i]);
    }
  }
  if (current.length > 0) sessions.push(makeSession(current, sessions.length));

  return sessions.reverse();
}

function makeSession(notes: Note[], idx: number): SessionGroup {
  const times = notes.map(n => new Date(n.updatedAt));
  const startTime = new Date(Math.min(...times.map(t => t.getTime())));
  const endTime = new Date(Math.max(...times.map(t => t.getTime())));

  // Collect all tags
  const allTags: Record<string, number> = {};
  notes.forEach(n => (n.tags || []).forEach(t => { allTags[t] = (allTags[t] || 0) + 1; }));
  const topTags = Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

  // Detect topic
  const titles = notes.map(n => n.title).join(' ').toLowerCase();
  const contents = notes.map(n => n.content).join(' ').toLowerCase();
  const combined = titles + ' ' + contents;

  let topic = 'General';
  if (/code|function|class|import|bug|fix|refactor/.test(combined)) topic = 'Coding';
  else if (/meeting|standup|sync|agenda|action item/.test(combined)) topic = 'Meetings';
  else if (/study|learn|exam|review|chapter|definition/.test(combined)) topic = 'Study';
  else if (/idea|concept|brainstorm|what if|vision/.test(combined)) topic = 'Ideas';
  else if (/journal|diary|feeling|today|reflection/.test(combined)) topic = 'Journal';
  else if (topTags.length > 0) topic = topTags[0].charAt(0).toUpperCase() + topTags[0].slice(1);

  const dayLabel = format(endTime, 'MMM d');
  const duration = differenceInMinutes(endTime, startTime);
  const durationLabel = duration < 60 ? `${duration}m` : `${Math.round(duration / 60)}h`;

  return {
    id: `session-${idx}-${startTime.getTime()}`,
    label: `${dayLabel} · ${durationLabel} session`,
    topic,
    notes,
    startTime,
    endTime,
    tags: topTags,
  };
}

const TOPIC_COLORS: Record<string, string> = {
  Coding: 'bg-emerald-500/20 text-emerald-300',
  Meetings: 'bg-blue-500/20 text-blue-300',
  Study: 'bg-yellow-500/20 text-yellow-300',
  Ideas: 'bg-pink-500/20 text-pink-300',
  Journal: 'bg-orange-500/20 text-orange-300',
  General: 'bg-muted text-muted-foreground',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  text: <FileText size={11} className="text-violet-400" />,
  voice: <Mic size={11} className="text-blue-400" />,
  analytics: <BarChart2 size={11} className="text-emerald-400" />,
};

export default function SmartSessions({ notes, selectedNoteId, onSelectNote }: Props) {
  const sessions = useMemo(() => groupIntoSessions(notes), [notes]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold">Smart Sessions</span>
        <span className="text-xs text-muted-foreground">{sessions.length} sessions detected</span>
      </div>

      <ScrollArea className="flex-1">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-3xl opacity-10 mb-3">◎</div>
            <p className="text-sm text-muted-foreground">Create notes to see your thinking sessions</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                {/* Session header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{session.label}</span>
                    </div>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${TOPIC_COLORS[session.topic] || TOPIC_COLORS.General}`}>
                      {session.topic}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{session.notes.length} notes</span>
                </div>

                {/* Tags */}
                {session.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/30 flex-wrap">
                    <Hash size={10} className="text-muted-foreground shrink-0" />
                    {session.tags.map(t => (
                      <span key={t} className="text-[9px] text-muted-foreground/70">{t}</span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div className="divide-y divide-border/30">
                  {session.notes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => onSelectNote(note.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 ${
                        note.id === selectedNoteId ? 'bg-violet-500/10' : ''
                      }`}
                    >
                      <div className="shrink-0">{TYPE_ICON[note.type] || <FileText size={11} />}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate block">{note.title || 'Untitled'}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{note.content || 'Empty'}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(note.updatedAt), 'h:mm a')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
