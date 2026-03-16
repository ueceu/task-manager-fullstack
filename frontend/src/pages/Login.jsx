import { useState } from "react";
import { apiFetch } from "../api";
import { subscribePush } from "../pushSubscribe"; 

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // login | register
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");

    const path = mode === "login" ? "/login" : "/register";
    const response = await apiFetch(path, {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });
    const res = await response.json();

    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("username", res.username || username);
      onLogin(res.token);
      subscribePush();
    } else if (res.msg === "registered") {
      setMode("login");
      alert("Registration successful. You can now log in.");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 320 }}>
      <h2>{mode === "login" ? "Sign In" : "Create Account"}</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={submit} style={{ width: "100%" }}>
        {mode === "login" ? "Sign In" : "Register"}
      </button>

      <p
        style={{ marginTop: 12, cursor: "pointer", color: "blue" }}
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "Don't have an account? Create one"
          : "Already have an account? Sign in"}
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
