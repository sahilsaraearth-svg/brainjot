export type NoteType = 'voice' | 'text' | 'analytics';

export interface Folder {
  id: string;
  name: string;
  color?: string;
}

export interface Assignee {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: string;
  speakerColor: string;
  timestamp: string;
  text: string;
}

export interface Section {
  id: string;
  title: string;
  items: string[];
  collapsed: boolean;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  folderId?: string;
  content: string;
  aiSummary?: string;
  sections: Section[];
  transcript: TranscriptEntry[];
  assignees: Assignee[];
  createdAt: string;
  updatedAt: string;
  hasVideo?: boolean;
  videoUrl?: string;
  tags?: string[];
}

export interface AppData {
  notes: Note[];
  folders: Folder[];
}
