import type { AppData, Note, Folder, NoteType, AppSettings, ContentContext, NoteLink, NoteVersion } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'brainjot_data_v4';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'md',
  compactMode: false,
  showWordCount: true,
  autoSave: true,
  focusMode: false,
  ambientSound: 'none',
  graphLayout: 'force',
  streamInterval: 120,
  pluginMode: 'notes',
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (!parsed.settings) parsed.settings = { ...DEFAULT_SETTINGS };
      if (!parsed.sessions) parsed.sessions = [];
      // migrate notes
      parsed.notes = parsed.notes.map(n => ({
        versions: [],
        links: [],
        canvasElements: [],
        flashcards: [],
        actionItems: [],
        tags: [],
        recordings: [],
        charts: [],
        ...n,
      }));
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return { notes: [], folders: [], settings: { ...DEFAULT_SETTINGS }, sessions: [] };
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
    title: 'Untitled',
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
    versions: [],
    links: [],
    canvasElements: [],
    flashcards: [],
    actionItems: [],
    tags: [],
    wordCount: 0,
  };
}

export function createFolder(name: string): Folder {
  return { id: uuidv4(), name };
}

// ─── Semantic / Graph utilities ───────────────────────────────────────────────

/** Extract simple keyword tokens from text */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 3)
    .filter(t => !STOPWORDS.has(t));
}

const STOPWORDS = new Set([
  'that', 'this', 'with', 'from', 'they', 'have', 'been', 'will',
  'would', 'could', 'should', 'there', 'their', 'them', 'then',
  'what', 'when', 'where', 'which', 'while', 'about', 'into',
  'more', 'also', 'just', 'over', 'some', 'such', 'than', 'only',
  'very', 'much', 'even', 'each', 'most', 'other', 'after',
]);

/** Compute cosine-like similarity between two notes */
export function noteSimilarity(a: Note, b: Note): number {
  const tokensA = new Set(tokenize(`${a.title} ${a.content} ${(a.tags || []).join(' ')}`));
  const tokensB = new Set(tokenize(`${b.title} ${b.content} ${(b.tags || []).join(' ')}`));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  tokensA.forEach(t => { if (tokensB.has(t)) intersection++; });
  return intersection / Math.sqrt(tokensA.size * tokensB.size);
}

/** Auto-compute links for all notes */
export function computeLinks(notes: Note[]): Note[] {
  return notes.map(note => {
    const links: NoteLink[] = [];
    notes.forEach(other => {
      if (other.id === note.id) return;
      const sim = noteSimilarity(note, other);
      if (sim > 0.05) {
        links.push({ targetId: other.id, strength: Math.min(sim, 1) });
      }
    });
    links.sort((a, b) => b.strength - a.strength);
    return { ...note, links: links.slice(0, 8) };
  });
}

/** Detect content context from note text */
export function detectContext(content: string): ContentContext {
  const lower = content.toLowerCase();
  const codeSignals = ['function ', 'const ', 'import ', 'return ', '() =>', '```', 'class ', 'async ', '{}', '//'];
  const meetingSignals = ['action item', 'attendee', 'agenda', 'follow up', 'decision', 'stakeholder', 'deadline', 'meeting'];
  const studySignals = ['definition', 'concept', 'remember', 'flashcard', 'review', 'chapter', 'exam', 'study', 'learn', 'formula'];
  const ideaSignals = ['what if', 'idea', 'imagine', 'could be', 'brainstorm', 'hypothesis', 'vision', 'dream', 'explore'];
  const journalSignals = ['today i', 'felt', 'feeling', 'grateful', 'mood', 'journal', 'diary', 'reflection', 'yesterday'];

  const score = (signals: string[]) => signals.filter(s => lower.includes(s)).length;
  const scores: [ContentContext, number][] = [
    ['code', score(codeSignals)],
    ['meeting', score(meetingSignals)],
    ['study', score(studySignals)],
    ['idea', score(ideaSignals)],
    ['journal', score(journalSignals)],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : 'general';
}

/** Extract action items from meeting notes */
export function extractActionItems(content: string): string[] {
  const lines = content.split('\n');
  return lines
    .filter(l => /action|todo|follow.?up|assign|complete|deadline|do:/i.test(l))
    .map(l => l.replace(/^[-*•]\s*/, '').trim())
    .filter(l => l.length > 5)
    .slice(0, 10);
}

/** Auto-generate flashcards from study notes */
export function generateFlashcards(content: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = [];
  // definition patterns: "X is Y", "X means Y", "X: Y"
  const patterns = [
    /^(.{5,50})\s+(?:is|are|means?|refers? to|defined as)\s+(.{10,200})/im,
    /^(.{5,50}):\s+(.{10,200})/m,
    /^Q:\s*(.+)\nA:\s*(.+)/gim,
  ];
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    while ((match = regex.exec(content)) !== null && cards.length < 12) {
      cards.push({ front: match[1].trim(), back: match[2].trim() });
    }
  }
  return cards;
}

/** Save a version snapshot */
export function saveVersion(note: Note): Note {
  const versions = note.versions || [];
  const last = versions[versions.length - 1];
  if (last && last.content === note.content && last.title === note.title) return note;
  const newVersion: NoteVersion = {
    id: uuidv4(),
    content: note.content,
    title: note.title,
    savedAt: new Date().toISOString(),
  };
  return {
    ...note,
    versions: [...versions.slice(-19), newVersion], // keep last 20
  };
}

/** Semantic search: returns notes ranked by relevance */
export function semanticSearch(notes: Note[], query: string): Note[] {
  if (!query.trim()) return notes;
  const qTokens = new Set(tokenize(query));
  if (qTokens.size === 0) {
    // fallback to substring match
    const q = query.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }
  const scored = notes.map(note => {
    const nTokens = tokenize(`${note.title} ${note.content} ${(note.tags || []).join(' ')}`);
    const nSet = new Set(nTokens);
    let score = 0;
    qTokens.forEach(t => { if (nSet.has(t)) score += 2; });
    // partial match bonus
    qTokens.forEach(qt => {
      nTokens.forEach(nt => { if (nt.includes(qt) || qt.includes(nt)) score += 0.5; });
    });
    // title bonus
    const titleTokens = new Set(tokenize(note.title));
    qTokens.forEach(t => { if (titleTokens.has(t)) score += 3; });
    return { note, score };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.note);
}

/** Pick "thought stream" note — weighted random by age + links */
export function pickThoughtStreamNote(notes: Note[], excludeId?: string): Note | null {
  const candidates = notes.filter(n => n.id !== excludeId && n.content.length > 20);
  if (candidates.length === 0) return null;
  // Weight: older notes surface more, highly linked notes surface more
  const weights = candidates.map(n => {
    const ageDays = (Date.now() - new Date(n.updatedAt).getTime()) / 86400000;
    const ageFactor = Math.min(ageDays / 7, 3); // peaks at 3 weeks
    const linkFactor = (n.links?.length || 0) * 0.3;
    return ageFactor + linkFactor + 0.1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Auto-extract tags from content */
export function extractTags(content: string, title: string): string[] {
  const text = `${title} ${content}`;
  // explicit #tags
  const hashTags = (text.match(/#(\w+)/g) || []).map(t => t.slice(1).toLowerCase());
  // keyword extraction: top 5 frequent tokens
  const tokens = tokenize(text);
  const freq: Record<string, number> = {};
  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const topKeywords = Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  return [...new Set([...hashTags, ...topKeywords])].slice(0, 8);
}
