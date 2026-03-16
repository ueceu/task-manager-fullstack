import { useEffect, useState } from "react"
import { apiFetch } from "../api"
import NoteModal from "./NotesModal"

export default function NotesPanel(){

  const [notes,setNotes] = useState([])
  const [activeNote,setActiveNote] = useState(null)
  const [showAll,setShowAll] = useState(false)

  async function loadNotes(){

    const res = await apiFetch("/notes")
    if(!res.ok) return

    const data = await res.json()
    setNotes(data)

  }

  useEffect(()=>{
    loadNotes()
  },[])

  const visibleNotes = showAll ? notes : notes.slice(0,5)

  return(

    <div className="notes-panel">

      <div className="notes-title">
        Notes
      </div>

      <button
        className="notes-new"
        onClick={()=>setActiveNote({})}
      >
        + New Note
      </button>

      <div className="notes-items">

        {visibleNotes.map(n=>(
          <button
            key={n.id}
            className="notes-item"
            onClick={()=>setActiveNote(n)}
          >
            Note {n.id}
          </button>
        ))}

      </div>

      {notes.length > 5 && !showAll && (
        <button
          className="notes-more"
          onClick={()=>setShowAll(true)}
        >
          +More
        </button>
      )}

      {activeNote && (

        <NoteModal
          note={activeNote}
          onClose={()=>{
            setActiveNote(null)
            loadNotes()
          }}
        />

      )}

    </div>

  )

}
