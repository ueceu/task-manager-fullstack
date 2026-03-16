import "./calendar-navbar.css";

export default function CalendarNavbar({
  title,
  onPrev,
  onNext,
  onToday,
  view,
  setView,
  canZoomIn,
  zoomIn,
  zoomOut,
  toggleSidebar,
  onOpenSettings,
  sidebarOpen,
}) {
  return (
    <header className={`navbar${sidebarOpen ? " with-sidebar" : ""}`}>
      <div className="nav-left">
        <button className="icon" onClick={toggleSidebar}>
          &#9776;
        </button>

        <div className="brand">
          <span className="brand-mark">TaskLink</span>
        </div>

      </div>

      <div className="nav-nav">
        <button className="nav-arrow" onClick={onPrev}>
          &#8249;
        </button>
        <button className="today-btn" onClick={onToday}>
          Today
        </button>
        <button className="nav-arrow" onClick={onNext}>
          &#8250;
        </button>
      </div>

      <div className="nav-center">{title}</div>

      <div className="nav-right">
        <div className="nav-views">
          <button
            className={view === "timeGridDay" ? "active" : ""}
            onClick={() => setView("timeGridDay")}
          >
            Day
          </button>

          <button
            className={view === "timeGridWeek" ? "active" : ""}
            onClick={() => setView("timeGridWeek")}
          >
            Week
          </button>

          <button
            className={view === "dayGridMonth" ? "active" : ""}
            onClick={() => setView("dayGridMonth")}
          >
            Month
          </button>
        </div>

        <div className="zoom">
          <button onClick={zoomIn} disabled={!canZoomIn}>
            +
          </button>

          <button onClick={zoomOut}>-</button>
        </div>

        <button
          className="settings-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          &#9881;
        </button>
      </div>
    </header>
  );
}
