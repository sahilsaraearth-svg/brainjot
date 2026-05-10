import type { AppData, Note, Folder, NoteType, AppSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'brainjot_data_v3';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'md',
  compactMode: false,
  showWordCount: true,
  autoSave: true,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      // migrate missing settings
      if (!parsed.settings) parsed.settings = { ...DEFAULT_SETTINGS };
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return { notes: [], folders: [], settings: { ...DEFAULT_SETTINGS } };
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
    showAiSummary: false,
    sections: [],
    showSections: false,
    transcript: [],
    assignees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasVideo: false,
    recordings: [],
    charts: [],
  };
}

export function createFolder(name: string): Folder {
  return { id: uuidv4(), name };
}
