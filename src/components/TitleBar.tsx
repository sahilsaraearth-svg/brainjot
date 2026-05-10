import { useState, useEffect } from 'react';
import { Minus, Square, X, Brain } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const max = await invoke<boolean>('is_maximized');
        setIsMaximized(max);
      } catch {}
    };
    check();
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, []);

  const minimize = () => invoke('minimize_window').catch(() => {});
  const maximize = () => {
    invoke('maximize_window').catch(() => {});
    setIsMaximized(v => !v);
  };
  const close = () => invoke('close_window').catch(() => {});

  return (
    <div
      className="flex items-center justify-between h-9 bg-[#1a1a2e] px-3 flex-shrink-0 select-none"
      data-tauri-drag-region
    >
      {/* App brand */}
      <div className="flex items-center gap-2 pointer-events-none" data-tauri-drag-region>
        <div className="w-5 h-5 bg-indigo-500 rounded-md flex items-center justify-center">
          <Brain size={12} className="text-white" />
        </div>
        <span className="text-white text-xs font-semibold tracking-wide">BrainJot</span>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={minimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={maximize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square size={11} />
        </button>
        <button
          onClick={close}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500 text-white/60 hover:text-white transition-colors"
          title="Close"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
