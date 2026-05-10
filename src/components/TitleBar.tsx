import { invoke } from '@tauri-apps/api/core';
import { Minus, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-9 bg-background border-b border-border select-none shrink-0"
      data-tauri-drag-region
    >
      {/* App name */}
      <span
        className="pl-4 text-sm font-semibold tracking-tight text-foreground"
        data-tauri-drag-region
      >
        BrainJot
      </span>

      {/* Window controls */}
      <div className="flex no-drag">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-10 rounded-none hover:bg-muted"
          onClick={() => invoke('minimize_window').catch(() => {})}
          tabIndex={-1}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-10 rounded-none hover:bg-muted"
          onClick={() => invoke('maximize_window').catch(() => {})}
          tabIndex={-1}
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-10 rounded-none hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => invoke('close_window').catch(() => {})}
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
