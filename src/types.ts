export type NoteType = 'voice' | 'text' | 'analytics' | 'canvas' | 'flashcard';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ContentContext = 'code' | 'meeting' | 'study' | 'idea' | 'journal' | 'general';

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

export interface NoteVersion {
  id: string;
  content: string;
  title: string;
  savedAt: string;
  label?: string;
}

export interface NoteLink {
  targetId: string;
  strength: number; // 0-1
  reason?: string;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'sticky' | 'image' | 'link' | 'drawing';
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
  color?: string;
  fontSize?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  confidence: 0 | 1 | 2 | 3; // 0=new,1=hard,2=ok,3=easy
  nextReview?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  folderId?: string;
  content: string;
  contentContext?: ContentContext;
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
  // versioning
  versions?: NoteVersion[];
  // graph connections
  links?: NoteLink[];
  // canvas
  canvasElements?: CanvasElement[];
  // flashcards
  flashcards?: Flashcard[];
  // meeting action items
  actionItems?: ActionItem[];
  // mood/energy
  mood?: 'energized' | 'focused' | 'neutral' | 'tired' | 'creative';
  // session grouping
  sessionId?: string;
  // pinned
  pinned?: boolean;
  // word count snapshot
  wordCount?: number;
  // color accent
  accent?: string;
}

export interface Session {
  id: string;
  label: string;
  noteIds: string[];
  topic?: string;
  startedAt: string;
  endedAt?: string;
  mood?: string;
}

export interface AppSettings {
  theme: ThemeMode;
  fontSize: 'sm' | 'md' | 'lg';
  compactMode: boolean;
  showWordCount: boolean;
  autoSave: boolean;
  focusMode?: boolean;
  ambientSound?: 'none' | 'rain' | 'forest' | 'cafe' | 'space';
  graphLayout?: 'force' | 'radial' | 'cluster';
  streamInterval?: number; // seconds between thought stream pops
  pluginMode?: 'notes' | 'research' | 'coding' | 'study' | 'journal' | 'startup';
}

export interface AppData {
  notes: Note[];
  folders: Folder[];
  settings: AppSettings;
  sessions?: Session[];
}
