import { Sun, Moon, Monitor, Type, Minimize2, Eye, Save, Network } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { AppSettings, ThemeMode } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const FONT_OPTIONS: { value: AppSettings['fontSize']; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

export default function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  function patch(partial: Partial<AppSettings>) {
    onUpdate({ ...settings, ...partial });
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-5 h-11 border-b border-border shrink-0">
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-xl">

        {/* Appearance */}
        <div className="mb-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Appearance</p>

          <Row label="Theme" description="Choose your color scheme">
            <div className="flex gap-1">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => patch({ theme: value })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                    settings.theme === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </Row>

          <Separator />

          <Row label="Font Size" description="Editor and note content size">
            <div className="flex gap-1">
              {FONT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => patch({ fontSize: value })}
                  className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                    settings.fontSize === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>

          <Separator />

          <Row label="Compact Mode" description="Tighter spacing in the note list">
            <Toggle value={settings.compactMode} onChange={(v) => patch({ compactMode: v })} />
          </Row>
        </div>

        {/* Editor */}
        <div className="mt-6 mb-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Editor</p>

          <Row label="Show Word Count" description="Display word count below note content">
            <Toggle value={settings.showWordCount} onChange={(v) => patch({ showWordCount: v })} />
          </Row>

          <Separator />

          <Row label="Auto Save" description="Automatically save changes as you type">
            <Toggle value={settings.autoSave} onChange={(v) => patch({ autoSave: v })} />
          </Row>
        </div>

        {/* Brain */}
        <div className="mt-6 mb-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Second Brain</p>

          <Row label="Plugin Mode" description="Optimise suggestions for your use case">
            <div className="flex flex-wrap gap-1 justify-end">
              {(['notes','research','coding','study','journal','startup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => patch({ pluginMode: m })}
                  className={`px-2 py-1 rounded text-xs border capitalize transition-colors ${
                    (settings.pluginMode ?? 'notes') === m
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Row>

          <Separator />

          <Row label="Graph Layout" description="Memory graph arrangement style">
            <div className="flex gap-1">
              {(['force','radial','cluster'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => patch({ graphLayout: l })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border capitalize transition-colors ${
                    (settings.graphLayout ?? 'force') === l
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  <Network size={10} />
                  {l}
                </button>
              ))}
            </div>
          </Row>

          <Separator />

          <Row label="Ambient Sound" description="Background audio during Focus Mode">
            <div className="flex flex-wrap gap-1 justify-end">
              {(['none','rain','forest','cafe','space'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => patch({ ambientSound: s })}
                  className={`px-2 py-1 rounded text-xs border capitalize transition-colors ${
                    (settings.ambientSound ?? 'none') === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Row>

          <Separator />

          <Row label="Thought Stream Interval" description="Seconds between thought prompts (10–120)">
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={settings.streamInterval ?? 30}
              onChange={e => patch({ streamInterval: Number(e.target.value) })}
              className="w-24 accent-primary"
            />
            <span className="ml-2 text-xs text-muted-foreground w-8 text-right inline-block">
              {settings.streamInterval ?? 30}s
            </span>
          </Row>
        </div>

        {/* About */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">B</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">BrainJot</p>
              <p className="text-xs text-muted-foreground">Version 1.0.1</p>
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Type size={11} /> Notes are stored locally</span>
            <span className="flex items-center gap-1"><Save size={11} /> Auto-saved to localStorage</span>
            <span className="flex items-center gap-1"><Eye size={11} /> No telemetry</span>
            <span className="flex items-center gap-1"><Minimize2 size={11} /> Offline-first</span>
          </div>
        </div>

      </div>
    </div>
  );
}
