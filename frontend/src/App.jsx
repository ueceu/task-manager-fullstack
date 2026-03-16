import { useState } from "react";
import LandingAuth from "./pages/LandingAuth";
import CalendarLayout from "./layouts/CalendarLayout";
import Leaderboard from "./views/Leaderboard";

export default function App() {

  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = (nextToken) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!token) return <LandingAuth onLogin={handleLogin} />;

  return (
    <>
      <CalendarLayout
        onLogout={handleLogout}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
}
