# BrainJot Second Brain - Build Progress

## Status: IN PROGRESS

## Done
- [x] types.ts — expanded with NoteVersion, NoteLink, CanvasElement, Flashcard, ActionItem, Session, ContentContext
- [x] store.ts — added tokenize, computeLinks, detectContext, extractActionItems, generateFlashcards, saveVersion, semanticSearch, pickThoughtStreamNote, extractTags
- [x] MemoryGraph.tsx — force-directed canvas graph with zoom/pan/drag/click
- [x] TimelineView.tsx — calendar heatmap + day replay
- [x] ThoughtStream.tsx — floating intelligent note resurfacing widget
- [x] FocusMode.tsx — fullscreen writing with particle animation
- [x] SmartSessions.tsx — auto-grouped sessions by time + topic
- [x] ContextualWorkspace.tsx — code/meeting/study/idea panels
- [x] IdeaEvolution.tsx — version history + diff viewer
- [x] LocalAIAgent.tsx — offline AI Q&A from notes
- [x] SplitView.tsx — side-by-side note comparison
- [x] Sidebar.tsx — new nav with graph/timeline/sessions/split/ai

## TODO
- [ ] NoteList.tsx — add canvas/flashcard types, update UI
- [ ] NoteEditor.tsx — fix textarea fill, no textarea on voice/analytics, context menu, + new features (focus mode button, version save, contextual workspace, connected notes panel)
- [ ] App.tsx — wire all new views, add thought stream toggle, computeLinks on note updates
- [ ] TitleBar.tsx — add thought stream toggle, focus mode button
- [ ] SettingsPanel.tsx — add new settings fields
- [ ] Build verify

## Architecture Notes
- All features are local-only, no API calls
- computeLinks runs after any note update (debounced)
- saveVersion runs on blur or every 3 min
- ThoughtStream is a floating widget toggled from TitleBar
- FocusMode overlays entire window
- Brain views (graph/timeline/sessions/split/ai) replace the note editor area
