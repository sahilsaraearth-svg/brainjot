import { invoke } from '@tauri-apps/api/core';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-9 px-3 bg-background border-b border-border select-none shrink-0"
    >
      <span
        data-tauri-drag-region
        className="text-sm font-semibold text-foreground tracking-tight"
      >
        BrainJot
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => invoke('minimize_window')}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={() => invoke('maximize_window')}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => invoke('close_window')}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
