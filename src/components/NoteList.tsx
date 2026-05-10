import { Mic, FileText, BarChart2, Plus, Trash2 } from 'lucide-react';
import type { Note, NoteType, AppData } from '../types';
import { groupNotesByDate, deleteNote } from '../store';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  filteredNotes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewNote: (type: NoteType) => void;
}

const typeIcon = (type: NoteType, size = 13) => {
  if (type === 'voice') return <Mic size={size} className="text-indigo-400" />;
  if (type === 'analytics') return <BarChart2 size={size} className="text-emerald-400" />;
  return <FileText size={size} className="text-amber-400" />;
};

export default function NoteList({ data, setData, filteredNotes, selectedId, onSelect, onNewNote }: Props) {
  const grouped = groupNotesByDate(filteredNotes);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteNote(data, id);
    setData(updated);
  };

  return (
    <div className="w-[260px] flex-shrink-0 bg-[#141926] flex flex-col h-full border-r border-white/5">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Notes</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNewNote('voice')}
            title="New Voice Note"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Mic size={13} />
          </button>
          <button
            onClick={() => onNewNote('text')}
            title="New Text Note"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <FileText size={13} />
          </button>
          <button
            onClick={() => onNewNote('text')}
            title="New Note"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <FileText size={32} className="text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 font-medium">No notes yet</p>
            <p className="text-xs text-slate-600 mt-1">Click + to create your first note</p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, notes]) => (
            <div key={group}>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-[#141926] sticky top-0 z-10">
                {group}
              </div>
              {notes.map(note => {
                const isSelected = note.id === selectedId;
                return (
                  <div
                    key={note.id}
                    onClick={() => onSelect(note.id)}
                    className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-white/3 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-l-2 border-l-indigo-500'
                        : 'hover:bg-white/4'
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      note.type === 'voice' ? 'bg-indigo-500/15' :
                      note.type === 'analytics' ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                    }`}>
                      {typeIcon(note.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {note.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {note.content.substring(0, 60)}...
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600">
                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                        </span>
                        {note.assignees.length > 0 && (
                          <div className="flex -space-x-1">
                            {note.assignees.slice(0, 3).map(a => (
                              <div
                                key={a.id}
                                className="w-4 h-4 rounded-full border border-[#141926] flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: a.color }}
                                title={a.name}
                              >
                                {a.name[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => handleDelete(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
