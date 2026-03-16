import { useState } from "react";
import "./reminder-list-modal.css";

export default function ReminderListModal({ popup, onUpdateNote, onClose }) {
  const [expandedId, setExpandedId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [savedIds, setSavedIds] = useState({});

  const handleToggleItem = (eventItem) => {
    setExpandedId((prev) => (prev === eventItem.id ? null : eventItem.id));
    setNoteDrafts((prev) =>
      prev[eventItem.id] !== undefined
        ? prev
        : { ...prev, [eventItem.id]: eventItem.note || "" }
    );
  };

  const handleNoteChange = (id, value) => {
    setNoteDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (id) => {
    if (!onUpdateNote) return;

    await onUpdateNote(id, noteDrafts[id] ?? "");
    setSavedIds((prev) => ({ ...prev, [id]: true }));

    setTimeout(() => {
      setSavedIds((prev) => ({ ...prev, [id]: false }));
    }, 900);
  };

  const dateText = popup.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="reminder-list-backdrop" onClick={onClose}>
      <div className="reminder-list-modal" onClick={(event) => event.stopPropagation()}>
        <div className="reminder-list-header">
          <h3>{dateText}</h3>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </div>

        <div className="reminder-list-body">
          {popup.events?.map((eventItem) => (
            <div key={eventItem.id} className="reminder-list-item">
              <button
                type="button"
                className="reminder-list-item-trigger"
                onClick={() => handleToggleItem(eventItem)}
              >
                <div className="reminder-title">{eventItem.title}</div>
              </button>

              {expandedId === eventItem.id && (
                <div className="reminder-note-section">
                  <textarea
                    value={noteDrafts[eventItem.id] ?? ""}
                    onChange={(event) =>
                      handleNoteChange(eventItem.id, event.target.value)
                    }
                    placeholder="Add a note..."
                  />

                  <button
                    type="button"
                    className={`reminder-note-save-btn ${
                      savedIds[eventItem.id] ? "is-saved" : ""
                    }`}
                    onClick={() => handleSave(eventItem.id)}
                  >
                    {savedIds[eventItem.id] ? "Saved" : "Save Note"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
