import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, FileText, Mic, BarChart2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Note } from '../types';

interface Props {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  text: <FileText size={11} className="text-violet-400" />,
  voice: <Mic size={11} className="text-blue-400" />,
  analytics: <BarChart2 size={11} className="text-emerald-400" />,
};

export default function TimelineView({ notes, selectedNoteId, onSelectNote }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const notesByDay = useMemo(() => {
    const map: Record<string, Note[]> = {};
    notes.forEach(n => {
      const day = format(new Date(n.updatedAt), 'yyyy-MM-dd');
      if (!map[day]) map[day] = [];
      map[day].push(n);
    });
    return map;
  }, [notes]);

  const dayNotes = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return notesByDay[key] || [];
  }, [selectedDay, notesByDay]);

  // Heatmap intensity
  const maxNotesInDay = Math.max(1, ...Object.values(notesByDay).map(a => a.length));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-semibold">Timeline Replay</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft size={13} />
          </button>
          <span className="text-xs font-medium text-foreground px-2 min-w-[110px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar */}
        <div className="w-[320px] shrink-0 p-4 border-r border-border overflow-y-auto">
          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map(d => (
              <div key={d} className="text-[10px] text-muted-foreground text-center font-medium py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const count = notesByDay[key]?.length || 0;
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, new Date());
              const intensity = count === 0 ? 0 : Math.ceil((count / maxNotesInDay) * 4);

              const bgColors = ['', 'bg-violet-900/30', 'bg-violet-700/40', 'bg-violet-600/50', 'bg-violet-500/70'];

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded text-[11px] flex flex-col items-center justify-center transition-all
                    ${isSelected ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-background' : ''}
                    ${count > 0 ? bgColors[intensity] : ''}
                    ${!isCurrentMonth ? 'opacity-25' : ''}
                    ${isToday ? 'font-bold' : ''}
                    hover:bg-muted
                  `}
                >
                  <span className={isToday ? 'text-violet-300' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-violet-400 opacity-80" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'This month', value: notes.filter(n => {
                const d = new Date(n.updatedAt);
                return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
              }).length },
              { label: 'Active days', value: Object.keys(notesByDay).filter(d => d.startsWith(format(currentMonth, 'yyyy-MM'))).length },
              { label: 'Total', value: notes.length },
            ].map(s => (
              <div key={s.label} className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Day notes */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDay && (
            <div className="px-4 py-2 border-b border-border shrink-0 flex items-center gap-2">
              <Clock size={13} className="text-muted-foreground" />
              <span className="text-sm font-medium">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</span>
              <span className="text-xs text-muted-foreground">{dayNotes.length} note{dayNotes.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          <ScrollArea className="flex-1">
            {dayNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="text-3xl opacity-10 mb-3">◎</div>
                <p className="text-sm text-muted-foreground">No notes on this day</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Click a highlighted day to replay your thoughts</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {dayNotes
                  .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
                  .map(note => (
                    <button
                      key={note.id}
                      onClick={() => onSelectNote(note.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all hover:border-violet-500/40 hover:bg-muted/40 ${
                        note.id === selectedNoteId ? 'border-violet-500/60 bg-violet-500/10' : 'border-border bg-muted/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{TYPE_ICON[note.type] || <FileText size={11} />}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground truncate">{note.title || 'Untitled'}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {format(new Date(note.updatedAt), 'h:mm a')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{note.content || 'No content'}</p>
                          {(note.tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(note.tags || []).slice(0, 4).map(t => (
                                <span key={t} className="text-[9px] bg-violet-500/15 text-violet-400 rounded px-1.5 py-0.5">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
