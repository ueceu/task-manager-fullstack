import { useCallback, useEffect, useRef, useState } from "react";
import NoteCanvas from "./NoteCanvas";
import { apiFetch } from "../api";

export default function NotesModal({ note, onClose, onSaved }) {
  const [noteId, setNoteId] = useState(note?.id || null);
  const [title, setTitle] = useState(note?.title || "Untitled");
  const [content, setContent] = useState(note?.content || "");
  const [saveState, setSaveState] = useState("Saved");
  const hasHydratedRef = useRef(false);
  const hasUserChangesRef = useRef(false);
  const noteIdRef = useRef(note?.id || null);
  const saveInFlightRef = useRef(false);
  const savePromiseRef = useRef(Promise.resolve(false));
  const latestTitleRef = useRef(note?.title || "Untitled");
  const latestContentRef = useRef(note?.content || "");
  const editorRef = useRef(null);

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  const save = useCallback(async () => {
    if (saveInFlightRef.current) {
      return savePromiseRef.current;
    }

    savePromiseRef.current = (async () => {
      saveInFlightRef.current = true;
      setSaveState("Saving...");
      try {
        const editorSnapshot = editorRef.current?.getSnapshot?.();
        const payload = {
          title: latestTitleRef.current.trim() || "Untitled",
          content: editorSnapshot
            ? JSON.stringify(editorSnapshot)
            : latestContentRef.current || "",
        };

        const currentNoteId = noteIdRef.current;
        const path = currentNoteId ? `/note/${currentNoteId}` : "/note";
        const method = currentNoteId ? "PUT" : "POST";

        const res = await apiFetch(path, {
          method,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          setSaveState("Save failed");
          return false;
        }

        if (!currentNoteId) {
          const data = await res.json();
          noteIdRef.current = data.id;
          setNoteId(data.id);
        }

        setSaveState("Saved");
        onSaved?.();
        return true;
      } finally {
        saveInFlightRef.current = false;
      }
    })();

    return savePromiseRef.current;
  }, [onSaved]);

  useEffect(() => {
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (!hasUserChangesRef.current) return;

    const timer = setTimeout(() => {
      save();
    }, 700);

    return () => clearTimeout(timer);
  }, [content, save, title]);

  const close = async () => {
    const shouldSave =
      hasUserChangesRef.current ||
      (!noteIdRef.current &&
        ((latestTitleRef.current.trim() && latestTitleRef.current.trim() !== "Untitled") ||
          latestContentRef.current));

    if (shouldSave) {
      await save();
    }
    onClose();
  };

  return (
    <div className="notes-overlay" onClick={close}>
      <div className="notes-container" onClick={(event) => event.stopPropagation()}>
        <div className="notes-topbar">
          <input
            className="note-title-input"
            value={title}
            onChange={(event) => {
              hasUserChangesRef.current = true;
              setTitle(event.target.value);
            }}
          />

          <div className="note-save-state">{saveState}</div>

          <button type="button" className="notes-close" onClick={close}>
            x
          </button>
        </div>

        <div className="notes-canvas">
          <NoteCanvas
            data={content}
            externalEditorRef={editorRef}
            onChange={(nextContent) => {
              hasUserChangesRef.current = true;
              latestContentRef.current = nextContent;
              setContent(nextContent);
            }}
          />
        </div>
      </div>
    </div>
  );
}
