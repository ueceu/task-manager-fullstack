import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function Leaderboard({ onClose, embedded = false }) {

  const [rows, setRows] = useState([]);

  useEffect(() => {
    load();

    const refresh = () => load();
    window.addEventListener("leaderboard-refresh", refresh);

    return () => {
      window.removeEventListener("leaderboard-refresh", refresh);
    };
  }, []);

  async function load() {
    const res = await apiFetch("/leaderboard");
    if (!res.ok) return;
    const data = await res.json();
    setRows(data);
  }

  if (embedded) {
    return (
      <div className="leaderboard-panel">
        <div className="leaderboard-list">
          {rows.map((r, i) => (
            <div key={`${r.username}-${i}`} className="leaderboard-row">
              <span className="leaderboard-rank">{i + 1}</span>
              <div className="leaderboard-user">
                {r.profile_photo ? (
                  <img
                    className="leaderboard-avatar"
                    src={r.profile_photo}
                    alt={r.username}
                  />
                ) : (
                  <div className="leaderboard-avatar leaderboard-avatar-empty" />
                )}
                <span className="leaderboard-name">{r.username}</span>
              </div>
              <span className="leaderboard-points">{r.points}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Global Leaderboard</h2>

        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Points</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.username}</td>
                <td>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
