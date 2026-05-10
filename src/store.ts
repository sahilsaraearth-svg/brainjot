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
  return { notes: [], folders: [] };
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function createNote(type: NoteType, folderId?: string): Note {
  return {
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
}

export function createFolder(name: string): Folder {
  return {
    id: uuidv4(),
    name,
  };
}
