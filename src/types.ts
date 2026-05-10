export type NoteType = 'voice' | 'text' | 'analytics';
export type ThemeMode = 'light' | 'dark' | 'system';

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

export interface VoiceRecording {
  id: string;
  label: string;
  durationSec: number;
  createdAt: string;
  // base64 data URI or blob URL
  dataUrl?: string;
}

export interface AnalyticsDataPoint {
  label: string;
  value: number;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: AnalyticsDataPoint[];
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  folderId?: string;
  content: string;
  // AI summary — only shown if explicitly added
  aiSummary?: string;
  showAiSummary?: boolean;
  // Sections — only shown if explicitly added
  sections: Section[];
  showSections?: boolean;
  transcript: TranscriptEntry[];
  assignees: Assignee[];
  createdAt: string;
  updatedAt: string;
  hasVideo?: boolean;
  videoUrl?: string;
  tags?: string[];
  // voice specific
  recordings?: VoiceRecording[];
  // analytics specific
  charts?: AnalyticsChart[];
}

export interface AppSettings {
  theme: ThemeMode;
  fontSize: 'sm' | 'md' | 'lg';
  compactMode: boolean;
  showWordCount: boolean;
  autoSave: boolean;
}

export interface AppData {
  notes: Note[];
  folders: Folder[];
  settings: AppSettings;
}
