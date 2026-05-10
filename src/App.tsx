import { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import { loadData, saveData, createNote } from './store'
import type { AppData, NoteType } from './types'

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [selectedId, setSelectedId] = useState<string | null>(
    () => {
      const d = loadData()
      return d.notes.length > 0 ? d.notes[0].id : null
    }
  )
  const [activeFilter, setActiveFilter] = useState<{ type: 'all' | NoteType | 'folder'; value?: string }>({ type: 'all' })
  const [searchQuery, setSearchQuery] = useState('')

  // Persist on data change
  useEffect(() => {
    saveData(data)
  }, [data])

  const filteredNotes = data.notes.filter(note => {
    const matchesSearch =
      searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (activeFilter.type === 'all') return true
    if (activeFilter.type === 'folder') return note.folderId === activeFilter.value
    return note.type === activeFilter.type
  })

  const selectedNote = data.notes.find(n => n.id === selectedId) ?? null

  function handleNewNote(type: NoteType) {
    const folderId =
      activeFilter.type === 'folder' ? activeFilter.value : undefined
    const note = createNote(data, type, folderId)
    const updated = { ...data, notes: [note, ...data.notes] }
    setData(updated)
    setSelectedId(note.id)
  }

  function handleSetData(updated: AppData) {
    setData(updated)
    // If selected note was deleted, pick next
    if (selectedId && !updated.notes.find(n => n.id === selectedId)) {
      setSelectedId(updated.notes.length > 0 ? updated.notes[0].id : null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1724] text-white overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          data={data}
          setData={handleSetData}
          activeFilter={activeFilter}
          onFilterChange={(f) => {
            setActiveFilter(f)
            setSelectedId(null)
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewNote={handleNewNote}
        />
        <NoteList
          data={data}
          setData={handleSetData}
          filteredNotes={filteredNotes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewNote={handleNewNote}
        />
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            data={data}
            setData={handleSetData}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm font-medium">Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
