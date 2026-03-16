import { useState, useEffect } from "react";
import CalendarNavbar from "../views/CalendarNavbar";
import CalendarView from "../views/CalendarView";
import Sidebar from "../views/Sidebar";
import NotesModal from "../views/NotesModal";
import "./calendar-layout.css";

const ZOOM_LEVELS = [12, 16, 20, 24, 32, 40, 56, 72];
const VIOLET = "#99acf7";

export default function CalendarLayout({
  onLogout,
  onOpenLeaderboard,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [calendarApi, setCalendarApi] = useState(null);
  const [view, setView] = useState("timeGridWeek");
  const [selectedGroup, setSelectedGroup] = useState("personal");
  const [activeNote, setActiveNote] = useState(null);
  const [notesReloadKey, setNotesReloadKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [todayColor, setTodayColor] = useState(
    localStorage.getItem("todayHighlightColor") || VIOLET
  );
  const [pageColor, setPageColor] = useState(
    localStorage.getItem("pageSurfaceColor") || "#ffffff"
  );
  const [selectedDayColor, setSelectedDayColor] = useState(
    localStorage.getItem("selectedDayColor") || VIOLET
  );
  const [notesColor, setNotesColor] = useState(
    localStorage.getItem("notesAccentColor") || VIOLET
  );
  const [calendarColor, setCalendarColor] = useState(
    localStorage.getItem("calendarAccentColor") || VIOLET
  );
  const [leaderboardColor, setLeaderboardColor] = useState(
    localStorage.getItem("leaderboardAccentColor") || VIOLET
  );
  const [groupsColor, setGroupsColor] = useState(
    localStorage.getItem("groupsAccentColor") || VIOLET
  );

  const [zoomIndex, setZoomIndex] = useState(2);

  useEffect(() => {
    if (localStorage.getItem("themePaletteVersion") === "violet-3") return;

    setTodayColor(VIOLET);
    setSelectedDayColor(VIOLET);
    setNotesColor(VIOLET);
    setCalendarColor(VIOLET);
    setLeaderboardColor(VIOLET);
    setGroupsColor(VIOLET);
    setPageColor("#ffffff");
    localStorage.setItem("themePaletteVersion", "violet-3");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-surface", pageColor);
    document.documentElement.style.setProperty(
      "--line-hour",
      isDark(pageColor) ? "rgba(255,255,255,0.26)" : "rgba(0,0,0,0.14)"
    );
    document.documentElement.style.setProperty(
      "--line-soft",
      isDark(pageColor) ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"
    );
    document.documentElement.style.setProperty(
      "--page-text",
      isDark(pageColor) ? "#f8fafc" : "#121f3a"
    );
    document.documentElement.style.setProperty(
      "--text-muted",
      isDark(pageColor) ? "rgba(255,255,255,0.72)" : "#6b7280"
    );
    document.documentElement.style.setProperty(
      "--card-surface",
      isDark(pageColor) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.78)"
    );
    localStorage.setItem("pageSurfaceColor", pageColor);
  }, [pageColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--today-bg", withAlpha(todayColor, 0.28));
    localStorage.setItem("todayHighlightColor", todayColor);
  }, [todayColor]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--selected-day-bg",
      withAlpha(selectedDayColor, 0.18)
    );
    localStorage.setItem("selectedDayColor", selectedDayColor);
  }, [selectedDayColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--notes-accent", notesColor);
    document.documentElement.style.setProperty(
      "--notes-accent-soft",
      withAlpha(notesColor, 0.16)
    );
    localStorage.setItem("notesAccentColor", notesColor);
  }, [notesColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--calendar-accent", calendarColor);
    document.documentElement.style.setProperty(
      "--calendar-accent-soft",
      withAlpha(calendarColor, 0.16)
    );
    localStorage.setItem("calendarAccentColor", calendarColor);
  }, [calendarColor]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--leaderboard-accent",
      leaderboardColor
    );
    document.documentElement.style.setProperty(
      "--leaderboard-accent-soft",
      withAlpha(leaderboardColor, 0.16)
    );
    localStorage.setItem("leaderboardAccentColor", leaderboardColor);
  }, [leaderboardColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--group-accent", groupsColor);
    document.documentElement.style.setProperty(
      "--group-accent-soft",
      withAlpha(groupsColor, 0.16)
    );
    localStorage.setItem("groupsAccentColor", groupsColor);
  }, [groupsColor]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--slot-height",
      ZOOM_LEVELS[zoomIndex] + "px"
    );
  }, [zoomIndex]);

  const zoomIn = () => {
    setZoomIndex((z) => Math.min(z + 1, ZOOM_LEVELS.length - 1));
  };

  const zoomOut = () => {
    setZoomIndex((z) => Math.max(z - 1, 0));
  };

  return (
    <div className="app-root">

      <CalendarNavbar
        title={title}
        view={view}
        sidebarOpen={sidebarOpen}
        canZoomIn={zoomIndex < ZOOM_LEVELS.length - 1}
        setView={(v) => {
          setView(v);
          calendarApi?.changeView(v);
        }}
        onPrev={() => calendarApi?.prev()}
        onNext={() => calendarApi?.next()}
        onToday={() => calendarApi?.today()}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        toggleSidebar={() => setSidebarOpen((s) => !s)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="main">

        {sidebarOpen && (
          <Sidebar
            onOpenGlobal={onOpenLeaderboard}
            onOpenNotes={(note) => setActiveNote(note || {})}
            notesReloadKey={notesReloadKey}
            onSelectGroup={(group) => {

              if (group === "personal") {
                setSelectedGroup("personal");
                return;
              }

              if (group === "global") {
                setSelectedGroup("global");
                return;
              }

              setSelectedGroup(group);
            }}
          />
        )}

        <div className="calendar-wrap">

          <CalendarView
            setApi={setCalendarApi}
            view={view}
            onTitleChange={setTitle}
            selectedGroup={selectedGroup}
          />

          {activeNote && (
            <NotesModal
              key={activeNote.id || "new-note"}
              note={activeNote}
              onSaved={() => setNotesReloadKey((value) => value + 1)}
              onClose={() => setActiveNote(null)}
            />
          )}
        </div>

      </div>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal settings-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Settings</h3>

            <label>
              Page color
              <input
                type="color"
                value={pageColor}
                onChange={(event) => setPageColor(event.target.value)}
              />
            </label>

            <label>
              Today color
              <input
                type="color"
                value={todayColor}
                onChange={(event) => setTodayColor(event.target.value)}
              />
            </label>

            <label>
              Selected day color
              <input
                type="color"
                value={selectedDayColor}
                onChange={(event) => setSelectedDayColor(event.target.value)}
              />
            </label>

            <label>
              Notes color
              <input
                type="color"
                value={notesColor}
                onChange={(event) => setNotesColor(event.target.value)}
              />
            </label>

            <label>
              Calendar button color
              <input
                type="color"
                value={calendarColor}
                onChange={(event) => setCalendarColor(event.target.value)}
              />
            </label>

            <label>
              Groups color
              <input
                type="color"
                value={groupsColor}
                onChange={(event) => setGroupsColor(event.target.value)}
              />
            </label>

            <label>
              Leaderboard color
              <input
                type="color"
                value={leaderboardColor}
                onChange={(event) => setLeaderboardColor(event.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isDark(hex) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((value) => value + value).join("")
    : clean;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness < 140;
}

function withAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((value) => value + value).join("")
    : clean;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
