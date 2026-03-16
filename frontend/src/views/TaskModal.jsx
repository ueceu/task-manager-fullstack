import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./task-modal.css";

export default function TaskModal({
  task,
  onClose,
  onSave,
  onStart,
  onComplete,
  onExtend,
  onDelete,
  currentUserId,
  reactions = [],
  onSendReaction,
}) {
  const isCompleted = task.status === "done";
  const isOwner = !task.isGlobal || task.ownerId === currentUserId;
  const isViewerOnGlobalTask = task.isGlobal && !isOwner;
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [durationMinutes, setDurationMinutes] = useState(task.durationMinutes || 30);
  const [isGlobal, setIsGlobal] = useState(task.isGlobal || false);
  const [color, setColor] = useState(task.color || "#2563eb");
  const [reactionMessage, setReactionMessage] = useState("");
  const [selectedStickerUrl, setSelectedStickerUrl] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [openedAt] = useState(() => Date.now());
  const canStart =
    isOwner &&
    task.status !== "active" &&
    task.status !== "done" &&
    new Date(task.start).getTime() - openedAt > -5 * 60000;

  useEffect(() => {
    if (!task.isGlobal) return;

    apiFetch("/stickers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStickers(Array.isArray(data) ? data : []))
      .catch(() => setStickers([]));
  }, [task.isGlobal]);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{task.isNew ? "Create Task" : "Task Details"}</h3>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            readOnly={isCompleted || isViewerOnGlobalTask}
          />
        </label>

        <label>
          Description / Note
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task note..."
            readOnly={isViewerOnGlobalTask}
          />
        </label>

        <label>
          Planned duration (minutes)
          <input
            type="number"
            min={15}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            disabled={isCompleted || isViewerOnGlobalTask}
          />
        </label>

        <label className="row">
          <input
            type="checkbox"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
            disabled={isCompleted || isViewerOnGlobalTask}
          />
          Global task
        </label>

        <label>
          Color
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={isViewerOnGlobalTask}
          />
        </label>

        {task.isGlobal && reactions.length > 0 && (
          <button
            type="button"
            className="secondary reactions-toggle-btn"
            onClick={() => setShowReactions((value) => !value)}
          >
            Stickers / Reactions ({reactions.length})
          </button>
        )}

        {showReactions && reactions.length > 0 && (
          <div className="reaction-list">
            {reactions.map((reaction) => (
              <div key={reaction.id} className="reaction-item">
                <img src={reaction.sticker_url} alt={reaction.username} />
                <div className="reaction-copy">
                  <div className="reaction-author">{reaction.username}</div>
                  {reaction.message && <div>{reaction.message}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!task.isNew && isViewerOnGlobalTask && (
          <div className="reaction-composer">
            {stickers.length > 0 ? (
              <div className="reaction-sticker-grid">
                {stickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    className={`reaction-sticker-btn ${
                      selectedStickerUrl === sticker.url ? "is-selected" : ""
                    }`}
                    onClick={() => setSelectedStickerUrl(sticker.url)}
                  >
                    <img src={sticker.url} alt={sticker.name} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="reaction-empty">
                No shared stickers yet. Add one from the sidebar.
              </div>
            )}

            <label>
              Send sticker / reaction
              <textarea
                value={reactionMessage}
                onChange={(event) => setReactionMessage(event.target.value)}
                placeholder="Leave a good-luck note..."
              />
            </label>

            <button
              className="primary"
              disabled={!selectedStickerUrl}
              onClick={async () => {
                const ok = await onSendReaction?.({
                  stickerUrl: selectedStickerUrl,
                  message: reactionMessage,
                });
                if (ok) {
                  setReactionMessage("");
                  setSelectedStickerUrl("");
                  setShowReactions(true);
                }
              }}
            >
              Send Sticker
            </button>
          </div>
        )}

        {!task.isNew && isOwner && (
          <div className="task-actions">
            {canStart && (
              <button className="primary" onClick={onStart}>
                Start
              </button>
            )}

            {task.status !== "done" && task.status === "active" && (

              <button className="primary" onClick={onComplete}>
                Complete
              </button>
            )}

            {task.status !== "done" && (
              <div className="extend-row">
                <button className="secondary" onClick={() => onExtend(15)}>+15</button>
                <button className="secondary" onClick={() => onExtend(30)}>+30</button>
                <button className="secondary" onClick={() => onExtend(60)}>+60</button>
              </div>
            )}

            {isCompleted && task.earnedPoints > 0 && (
              <div className="task-points-badge">
                Earned {task.earnedPoints} points
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          {!task.isNew && isOwner && (
            <button className="secondary" onClick={onDelete}>
              Delete
            </button>
          )}

          <button className="secondary" onClick={onClose}>
            Close
          </button>

          <button
            className="primary"
            disabled={!title.trim() || isViewerOnGlobalTask}
            onClick={() =>
              onSave({
                title,
                description,
                durationMinutes,
                isGlobal,
                color,
              })
            }
          >
            {task.isNew ? "Create" : isViewerOnGlobalTask ? "View Only" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
