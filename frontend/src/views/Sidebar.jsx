import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
import Leaderboard from "./Leaderboard";
import "./sidebar.css";

function getNotePreview(content) {
  if (!content) return "";

  try {
    const json = JSON.parse(content);
    const records = json?.store?.records;
    const shapeRecords = records
      ? Object.values(records).filter((record) => record?.typeName === "shape")
      : [];
    const firstShape = shapeRecords[0];

    return (
      firstShape?.props?.text ||
      firstShape?.props?.richText ||
      (shapeRecords.length > 0 ? "Drawing" : "Notebook")
    );
  } catch {
    return "Notebook";
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function shrinkProfileImage(file) {
  const src = await fileToDataUrl(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(src);
        return;
      }

      context.clearRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = reject;
    image.src = src;
  });
}

export default function Sidebar({
  isOpen = true,
  onOpenGlobal,
  onOpenNotes,
  onSelectGroup,
  notesReloadKey,
}) {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [reloadGroupsTick, setReloadGroupsTick] = useState(0);
  const [notes, setNotes] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(() => {
    const savedPhoto = localStorage.getItem("profilePhoto") || "";
    return savedPhoto.startsWith("https://i.pravatar.cc") ? "" : savedPhoto;
  });
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "User";

  const loadGroups = async () => {
    if (!token) return;

    const res = await apiFetch("/groups");
    if (!res.ok) return;

    const data = await res.json();
    setGroups(data);
  };

  const loadNotes = async () => {
    if (!token) return;

    const res = await apiFetch("/notes");
    if (!res.ok) return;

    const data = await res.json();
    setNotes(data);
  };

  const loadStickers = async () => {
    if (!token) return;

    const res = await apiFetch("/stickers");
    if (!res.ok) return;

    const data = await res.json();
    setStickers(data);
  };

  useEffect(() => {
    if (!token) return;

    loadGroups();
    loadNotes();
    loadStickers();
    apiFetch("/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile_photo) {
          localStorage.setItem("profilePhoto", data.profile_photo);
          setProfilePhoto(data.profile_photo);
        }
        if (data?.username) {
          localStorage.setItem("username", data.username);
        }
      })
      .catch(() => {});
  }, [token, reloadGroupsTick, notesReloadKey]);

  const createGroup = async () => {
    if (!groupName.trim()) return;

    await apiFetch("/group/create", {
      method: "POST",
      body: JSON.stringify({ name: groupName }),
    });

    setGroupName("");
    setReloadGroupsTick((value) => value + 1);
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;

    await apiFetch("/group/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: joinCode }),
    });

    setJoinCode("");
    setReloadGroupsTick((value) => value + 1);
  };

  const leaveGroup = async (id) => {
    await apiFetch(`/group/${id}/leave`, {
      method: "DELETE",
    });

    setReloadGroupsTick((value) => value + 1);
  };

  const visibleNotes = showAllNotes ? notes : notes.slice(0, 5);

  return (
    <aside className={`sidebar${isOpen ? "" : " sidebar-collapsed"}`}>
      <div className="sidebar-scroll">
        <Section title="Notes">
          <button className="notes-new-btn" onClick={onOpenNotes}>
            + New Note
          </button>

          <div className="notes-list">
            {visibleNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className="note-preview"
                onClick={() => onOpenNotes(note)}
              >
                <div className="note-title">{note.title || "Untitled"}</div>
                <div className="note-thumb">{getNotePreview(note.content)}</div>
              </button>
            ))}
          </div>

          {notes.length > 5 && !showAllNotes && (
            <button
              className="notes-more-btn"
              onClick={() => setShowAllNotes(true)}
            >
              +More
            </button>
          )}
        </Section>

        <Section title="Stickers">
          <div className="sticker-panel">
            <div className="sticker-empty">
              Shared stickers are visible to everyone here.
            </div>

            <div className="sticker-grid">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className="sticker-item"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "application/tasklink-sticker",
                      sticker.url
                    );
                  }}
                >
                  <img src={sticker.url} alt={sticker.name} />
                </button>
              ))}
            </div>

            <button
              type="button"
              className="notes-new-btn sticker-upload-btn"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.dataset.mode = "sticker";
                  fileInputRef.current.click();
                }
              }}
            >
              + Add Sticker
            </button>
          </div>
        </Section>

        <Section title="Calendars">
          <div
            className="calendar-option"
            onClick={() => onSelectGroup("personal")}
          >
            Personal Calendar
          </div>

          <div
            className="calendar-option calendar-option-spaced"
            onClick={() => onSelectGroup("global")}
          >
            Global Calendar
          </div>
        </Section>

        <Section title="Groups">
          <div className="group-panel">
            <div className="group-actions">
              <div className="group-box">
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="New group name"
                />
                <button onClick={createGroup}>Create</button>
              </div>

              <div className="group-box">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="Invite code"
                />
                <button onClick={joinGroup}>Join</button>
              </div>
            </div>

            <div className="group-list">
              {groups.map((group) => (
                <div key={group.id} className="group-item-row">
                  <div className="group-item" onClick={() => onSelectGroup(group)}>
                    <div className="group-name">{group.name}</div>
                    <div className="group-code">{group.invite_code}</div>
                  </div>

                  <button
                    className="leave-btn"
                    onClick={() => leaveGroup(group.id)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Section>
        
        <Section title="Leaderboard">
          <Leaderboard embedded />
        </Section>
      </div>

      <div className="sidebar-footer">
        <div className="profile-block">
          {profilePhoto ? (
            <img
              className="profile-pic"
              src={profilePhoto}
              alt="profile"
            />
          ) : (
            <div className="profile-pic profile-pic-empty" aria-hidden="true" />
          )}
          <div className="profile-meta">
            <div className="profile-name">{username}</div>
            <button
              type="button"
              className="profile-link"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.dataset.mode = "profile";
                  fileInputRef.current.click();
                }
              }}
            >
              Change photo
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="profile-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            (async () => {
              const nextValue =
                await shrinkProfileImage(file);

              if (fileInputRef.current?.dataset.mode === "sticker") {
                const res = await apiFetch("/sticker", {
                  method: "POST",
                  body: JSON.stringify({
                    name: file.name,
                    image_url: nextValue,
                  }),
                });

                if (res.ok) {
                  await loadStickers();
                }

                fileInputRef.current.dataset.mode = "profile";
              } else {
                await apiFetch("/profile/photo", {
                  method: "PUT",
                  body: JSON.stringify({
                    profile_photo: nextValue,
                  }),
                });
                localStorage.setItem("profilePhoto", nextValue);
                setProfilePhoto(nextValue);
              }
              event.target.value = "";
            })().catch((error) => {
              console.error("file upload failed", error);
            });
          }}
        />

        <button
          type="button"
          className="logout-footer-btn"
          onClick={() => {
            localStorage.removeItem("token");
            location.reload();
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <div className="section">
      <h4>{title}</h4>
      <div className="section-body">{children}</div>
    </div>
  );
}
