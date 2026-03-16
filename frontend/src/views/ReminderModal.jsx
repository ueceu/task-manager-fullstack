import { useState } from "react";
import "./task-modal.css";

export default function ReminderModal({ reminder, onSave, onClose }) {
  const [title, setTitle] = useState(reminder.title || "");
  const [note, setNote] = useState(reminder.note || "");

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{reminder.isNew ? "Create Reminder" : "Edit Reminder"}</h3>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
          />
        </label>

        <label>
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note..."
          />
        </label>

        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>

          <button
            className="primary"
            disabled={!title.trim()}
            onClick={() => onSave({ title, note })}
          >
            {reminder.isNew ? "Save Reminder" : "Update Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}
