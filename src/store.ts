import type { AppData, Note, Folder, NoteType } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'brainjot_data_v2';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch (e) {
    console.error('Failed to load data', e);
  }
  const fresh: AppData = { notes: [], folders: [] };
  saveData(fresh);
  return fresh;
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function createNote(_data: AppData, type: NoteType, folderId?: string): Note {
  const note: Note = {
    id: uuidv4(),
    title: 'Untitled Note',
    type,
    folderId,
    content: '',
    aiSummary: '',
    sections: [],
    transcript: [],
    assignees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasVideo: false,
  };
  return note;
}

export function updateNote(data: AppData, updated: Note): AppData {
  const idx = data.notes.findIndex(n => n.id === updated.id);
  const newNote = { ...updated, updatedAt: new Date().toISOString() };
  const newNotes = [...data.notes];
  if (idx !== -1) {
    newNotes[idx] = newNote;
  } else {
    newNotes.unshift(newNote);
  }
  const newData = { ...data, notes: newNotes };
  saveData(newData);
  return newData;
}

export function deleteNote(data: AppData, id: string): AppData {
  const newData = { ...data, notes: data.notes.filter(n => n.id !== id) };
  saveData(newData);
  return newData;
}

export function createFolder(data: AppData, name: string): { data: AppData; folder: Folder } {
  const folder: Folder = {
    id: uuidv4(),
    name,
    color: FOLDER_COLORS[data.folders.length % FOLDER_COLORS.length],
  };
  const newData = { ...data, folders: [...data.folders, folder] };
  saveData(newData);
  return { data: newData, folder };
}

export function deleteFolder(data: AppData, id: string): AppData {
  const newData = {
    folders: data.folders.filter(f => f.id !== id),
    notes: data.notes.map(n => n.folderId === id ? { ...n, folderId: undefined } : n),
  };
  saveData(newData);
  return newData;
}

export function renameFolder(data: AppData, id: string, name: string): AppData {
  const newData = {
    ...data,
    folders: data.folders.map(f => f.id === id ? { ...f, name } : f),
  };
  saveData(newData);
  return newData;
}

export const FOLDER_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

export function groupNotesByDate(notes: Note[]): Record<string, Note[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeekStart = new Date(today.getTime() - 7 * 86400000);
  const last30Start = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, Note[]> = {
    'Today': [],
    'Yesterday': [],
    'Last Week': [],
    'Previous 30 Days': [],
    'Older': [],
  };

  for (const note of notes) {
    const d = new Date(note.updatedAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups['Today'].push(note);
    else if (day >= yesterday) groups['Yesterday'].push(note);
    else if (day >= lastWeekStart) groups['Last Week'].push(note);
    else if (day >= last30Start) groups['Previous 30 Days'].push(note);
    else groups['Older'].push(note);
  }

  for (const key of Object.keys(groups)) {
    if (groups[key].length === 0) delete groups[key];
  }
  return groups;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
