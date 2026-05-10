import type { AppData, Note, Folder, NoteType } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'brainjot_data';

const SAMPLE_DATA: AppData = {
  folders: [
    { id: 'work', name: 'Work', color: '#6366f1' },
    { id: 'personal', name: 'Personal', color: '#f59e0b' },
    { id: 'research', name: 'Research', color: '#10b981' },
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Q4 Product Roadmap Review',
      type: 'voice',
      folderId: 'work',
      content: 'Discussed the Q4 product roadmap with the team. Key focus areas include performance improvements, new onboarding flow, and mobile app enhancements.',
      aiSummary: 'The meeting covered Q4 priorities: mobile performance optimization (targeting 40% load time reduction), redesigned onboarding (projected 25% conversion boost), AI features in Premium tier, and expansion into APAC/EMEA markets. Next review scheduled for Nov 15.',
      sections: [
        {
          id: 's1',
          title: 'Key Decisions',
          items: [
            'Prioritize mobile performance optimization for Q4',
            'Launch redesigned onboarding flow by November 1st',
            'Allocate 30% of engineering resources to AI features',
            'Expand to APAC market in Q1 next year'
          ],
          collapsed: false
        },
        {
          id: 's2',
          title: 'A/B Testing Plan',
          items: [
            'Test new onboarding flow with 20% of new users',
            'Compare conversion rates over 2-week period',
            'Measure time-to-first-value metric',
            'Track 30-day retention for both variants'
          ],
          collapsed: false
        },
        {
          id: 's3',
          title: 'Action Items',
          items: [
            'Sarah to finalize mobile optimization spec by Oct 20',
            'Design team to deliver onboarding mockups by Oct 18',
            'Engineering to estimate AI feature timeline by Oct 25',
            'Marketing to prepare APAC market analysis'
          ],
          collapsed: false
        }
      ],
      transcript: [
        { id: 't1', speaker: 'Alex Chen', speakerColor: '#6366f1', timestamp: '00:00', text: 'Alright everyone, let\'s get started with the Q4 roadmap review. We have a lot to cover today.' },
        { id: 't2', speaker: 'Sarah Kim', speakerColor: '#f59e0b', timestamp: '00:15', text: 'I\'ve prepared the performance benchmarks. Our mobile load time is currently averaging 4.2 seconds which is way too slow.' },
        { id: 't3', speaker: 'Alex Chen', speakerColor: '#6366f1', timestamp: '00:42', text: 'That\'s our top priority then. What\'s our target?' },
        { id: 't4', speaker: 'Marcus Reid', speakerColor: '#10b981', timestamp: '01:05', text: 'We\'re targeting under 2.5 seconds. I think we can achieve that with the new rendering pipeline.' },
        { id: 't5', speaker: 'Sarah Kim', speakerColor: '#f59e0b', timestamp: '01:30', text: 'The onboarding data is concerning too. We\'re losing 60% of users in the first 3 steps.' },
        { id: 't6', speaker: 'Alex Chen', speakerColor: '#6366f1', timestamp: '02:10', text: 'Ok, both of these need to be Q4 priorities. Let\'s talk about AI features next.' },
        { id: 't7', speaker: 'Marcus Reid', speakerColor: '#10b981', timestamp: '02:45', text: 'The AI summarization feature has been getting great feedback from beta users. We should prioritize it for Premium.' },
      ],
      assignees: [
        { id: 'a1', name: 'Alex Chen', color: '#6366f1' },
        { id: 'a2', name: 'Sarah Kim', color: '#f59e0b' },
        { id: 'a3', name: 'Marcus Reid', color: '#10b981' },
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    },
    {
      id: 'note-2',
      title: 'Design System Sprint Planning',
      type: 'text',
      folderId: 'work',
      content: 'Sprint planning for the design system overhaul. Team aligned on component library structure and token naming conventions.',
      aiSummary: 'Sprint planning focused on design system v2. Team agreed on atomic design principles, token-based theming, and Storybook integration. 3-week sprint with daily syncs scheduled.',
      sections: [
        {
          id: 's1',
          title: 'Key Decisions',
          items: [
            'Adopt atomic design methodology',
            'Use CSS custom properties for all tokens',
            'Integrate with Storybook for documentation'
          ],
          collapsed: false
        },
        {
          id: 's2',
          title: 'Action Items',
          items: [
            'Create token naming convention doc',
            'Audit existing components for reuse',
            'Set up Storybook environment'
          ],
          collapsed: false
        }
      ],
      transcript: [],
      assignees: [
        { id: 'a1', name: 'Alex Chen', color: '#6366f1' },
      ],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    },
    {
      id: 'note-3',
      title: 'Customer Feedback Analysis',
      type: 'analytics',
      folderId: 'research',
      content: 'Analysis of Q3 customer feedback. NPS increased to 67, main pain points identified.',
      aiSummary: 'Q3 NPS rose to 67 (from 58). Top complaints: slow mobile performance, confusing navigation, limited export options. Power users want API access and bulk operations.',
      sections: [
        {
          id: 's1',
          title: 'Key Insights',
          items: [
            'NPS improved from 58 to 67 in Q3',
            'Mobile performance is #1 complaint (38% of feedback)',
            'Navigation confusion affects new users most',
            '72% of power users want API access'
          ],
          collapsed: false
        }
      ],
      transcript: [],
      assignees: [
        { id: 'a2', name: 'Sarah Kim', color: '#f59e0b' },
      ],
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    },
    {
      id: 'note-4',
      title: 'Investor Update Prep',
      type: 'voice',
      folderId: 'work',
      content: 'Preparing for Q3 investor update. Key metrics, growth story, and fundraising timeline.',
      aiSummary: 'Q3 metrics: ARR $2.4M (+40% YoY), 12,500 customers, churn down to 2.1%. Series A target $8M, timeline Q1 next year. Need to strengthen enterprise pipeline.',
      sections: [
        {
          id: 's1',
          title: 'Key Metrics to Highlight',
          items: [
            'ARR: $2.4M, +40% YoY growth',
            'Customer count: 12,500 (+65% YoY)',
            'Monthly churn: 2.1% (down from 3.4%)',
            'Enterprise pipeline: 8 qualified leads'
          ],
          collapsed: false
        }
      ],
      transcript: [
        { id: 't1', speaker: 'Alex Chen', speakerColor: '#6366f1', timestamp: '00:00', text: 'Let\'s go through the investor deck. I want to make sure our growth story is compelling.' },
        { id: 't2', speaker: 'Sarah Kim', speakerColor: '#f59e0b', timestamp: '00:30', text: 'The 40% ARR growth is strong but investors will ask about the path to profitability.' },
      ],
      assignees: [
        { id: 'a1', name: 'Alex Chen', color: '#6366f1' },
        { id: 'a2', name: 'Sarah Kim', color: '#f59e0b' },
      ],
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    },
    {
      id: 'note-5',
      title: 'Weekly Team Standup',
      type: 'voice',
      folderId: 'work',
      content: 'Weekly engineering standup. Velocity update, blockers, and sprint review.',
      aiSummary: 'Sprint velocity at 42 points (target 45). Main blocker: third-party API rate limits affecting data sync feature. Backend refactor 70% complete.',
      sections: [
        {
          id: 's1',
          title: 'Blockers',
          items: [
            'Third-party API rate limiting the data sync feature',
            'Need design approval for new dashboard layout',
            'Waiting on security review for auth changes'
          ],
          collapsed: false
        }
      ],
      transcript: [],
      assignees: [
        { id: 'a3', name: 'Marcus Reid', color: '#10b981' },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    },
    {
      id: 'note-6',
      title: 'Competitive Analysis Notes',
      type: 'text',
      folderId: 'research',
      content: 'Competitive landscape analysis for Q4 strategy. Reviewed Notion, Obsidian, and Roam Research.',
      aiSummary: 'Main competitors: Notion (broad ICP, enterprise focus), Obsidian (power users, local-first), Roam (researchers, networked notes). Our differentiator: AI-first, voice-native, team collaboration.',
      sections: [
        {
          id: 's1',
          title: 'Competitor Strengths',
          items: [
            'Notion: Best-in-class templates and databases',
            'Obsidian: Strong plugin ecosystem and local storage',
            'Roam: Unique bidirectional linking model'
          ],
          collapsed: false
        },
        {
          id: 's2',
          title: 'Our Advantages',
          items: [
            'AI summarization built-in',
            'Voice-first recording and transcription',
            'Real-time team collaboration',
            'Automatic action item extraction'
          ],
          collapsed: false
        }
      ],
      transcript: [],
      assignees: [
        { id: 'a2', name: 'Sarah Kim', color: '#f59e0b' },
        { id: 'a3', name: 'Marcus Reid', color: '#10b981' },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    },
    {
      id: 'note-7',
      title: 'Personal Goals Review',
      type: 'text',
      folderId: 'personal',
      content: 'Mid-year personal goals check-in. Progress on fitness, learning, and financial goals.',
      aiSummary: 'Progress: fitness goals 70% on track, completed 2 of 4 planned online courses, savings target 85% achieved. Adjust Q4: add weekly reading habit, resume Spanish learning.',
      sections: [
        {
          id: 's1',
          title: 'Progress Update',
          items: [
            'Fitness: Running 3x/week consistently ✓',
            'Learning: Finished React course, TypeScript in progress',
            'Financial: Emergency fund at target',
            'Reading: Behind on goal, catch up in Q4'
          ],
          collapsed: false
        }
      ],
      transcript: [],
      assignees: [],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      hasVideo: false,
    }
  ]
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppData;
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  saveData(SAMPLE_DATA);
  return SAMPLE_DATA;
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function createNote(data: AppData, type: NoteType, folderId?: string): Note {
  const note: Note = {
    id: uuidv4(),
    title: 'Untitled Note',
    type,
    folderId,
    content: '',
    aiSummary: '',
    sections: [
      { id: uuidv4(), title: 'Key Points', items: [], collapsed: false },
      { id: uuidv4(), title: 'Action Items', items: [], collapsed: false },
    ],
    transcript: [],
    assignees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasVideo: false,
  };
  data.notes.unshift(note);
  saveData(data);
  return note;
}

export function updateNote(data: AppData, updated: Note): AppData {
  const idx = data.notes.findIndex(n => n.id === updated.id);
  if (idx !== -1) {
    updated.updatedAt = new Date().toISOString();
    data.notes[idx] = updated;
    saveData(data);
  }
  return { ...data };
}

export function deleteNote(data: AppData, id: string): AppData {
  data.notes = data.notes.filter(n => n.id !== id);
  saveData(data);
  return { ...data };
}

export function createFolder(data: AppData, name: string): Folder {
  const folder: Folder = {
    id: uuidv4(),
    name,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
  };
  data.folders.push(folder);
  saveData(data);
  return folder;
}

export function groupNotesByDate(notes: Note[]): Record<string, Note[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeekStart = new Date(today.getTime() - 7 * 86400000);
  const last30Start = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, Note[]> = {
    'Today': [],
    'Yesterday': [],
    'Last week': [],
    'Previous 30 days': [],
    'Older': [],
  };

  for (const note of notes) {
    const d = new Date(note.updatedAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups['Today'].push(note);
    else if (day >= yesterday) groups['Yesterday'].push(note);
    else if (day >= lastWeekStart) groups['Last week'].push(note);
    else if (day >= last30Start) groups['Previous 30 days'].push(note);
    else groups['Older'].push(note);
  }

  // Remove empty groups
  for (const key of Object.keys(groups)) {
    if (groups[key].length === 0) delete groups[key];
  }

  return groups;
}
