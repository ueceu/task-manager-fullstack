import { useEffect, useState } from "react";
import image1 from "../img/1.png";
import image2 from "../img/2.png";
import image3 from "../img/3.png";
import image4 from "../img/4.png";
import image5 from "../img/5.png";
import image6 from "../img/6.png";
import "./landing.css";

const slogans = ["Plan together", "Stay accountable", "Finish what you start"];

const starDecor = [
  { symbol: "⟡", className: "star-1" },
  { symbol: "⟡", className: "star-13" },
  { symbol: "⟡", className: "star-25" },
  { symbol: "⋆", className: "star-2" },
  { symbol: "⋆", className: "star-14" },
  { symbol: "⋆", className: "star-22" },
  { symbol: "୨୧", className: "star-3" },
  { symbol: "୨୧", className: "star-26" },
  { symbol: "୨୧", className: "star-27" },
  { symbol: "✧", className: "star-4" },
  { symbol: "✧", className: "star-15" },
  { symbol: "✧", className: "star-21" },
  { symbol: "❅", className: "star-5" },
  { symbol: "❅", className: "star-23" },
  { symbol: "❅", className: "star-28" },
  { symbol: "♡", className: "star-6" },
  { symbol: "♡", className: "star-16" },
  { symbol: "♡", className: "star-24" },
  { symbol: "⭒", className: "star-7" },
  { symbol: "⭒", className: "star-18" },
  { symbol: "⭒", className: "star-29" },
  { symbol: "₊", className: "star-8" },
  { symbol: "₊", className: "star-17" },
  { symbol: "₊", className: "star-30" },
  { symbol: "݁", className: "star-9" },
  { symbol: "݁", className: "star-19" },
  { symbol: "݁", className: "star-31" },
  { symbol: "ɞ", className: "star-10" },
  { symbol: "ɞ", className: "star-32" },
  { symbol: "ɞ", className: "star-33" },
  { symbol: "✦", className: "star-11" },
  { symbol: "✦", className: "star-34" },
  { symbol: "✦", className: "star-35" },
  { symbol: "❆", className: "star-12" },
  { symbol: "❆", className: "star-36" },
  { symbol: "❆", className: "star-37" },
];

const features = [
  {
    image: image1,
    title: "Free-hand Notes",
    description:
      "Capture quick ideas directly on the board and keep visual notes close to your tasks.",
  },
  {
    image: image2,
    title: "Global Tasks",
    description:
      "Create global tasks and let the world see what you're working on. Inspire others, show your prograss and stay accountable.",
  },
  {
    image: image6,
    title: "Send Reactions, Feel the Support",
    description:
      "Send stickers and reactions to people working on their goals. See the encouragement others send you and stay motivated.",
  },
  {
    image: image3,
    title: "Monthly Reminders",
    description:
      "Use reminders on the month calendar to keep track of important events. See your schedule in a clear agenda-like overview.",
  },
  {
    image: image4,
    title: "Everything in Sidebar",
    description:
      "Create notes, manage stickers, switch between personal and global calendars, build groups with friends and follow the leaderboard.",
  },
  {
    image: image5,
    title: "Full Customization",
    description:
      "From tasks to buttons, customize your workspace. You control the colors.",
  },
];

export default function LandingAuth({ onLogin }) {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeSlogan, setActiveSlogan] = useState(0);

  useEffect(() => {
    if (showAuth) return undefined;

    const featureIntervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % features.length);
    }, 4500);

    const sloganIntervalId = window.setInterval(() => {
      setActiveSlogan((current) => (current + 1) % slogans.length);
    }, 2600);

    return () => {
      window.clearInterval(featureIntervalId);
      window.clearInterval(sloganIntervalId);
    };
  }, [showAuth]);

  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  const goToPrevious = () => {
    setActiveSlide((current) => (current - 1 + features.length) % features.length);
  };

  const goToNext = () => {
    setActiveSlide((current) => (current + 1) % features.length);
  };

  const submit = async (e) => {
    e.preventDefault();

    const path = mode === "login" ? "/login" : "/register";

    const res = await fetch(`http://localhost:8000${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      alert(mode === "login" ? "Login failed" : "Register failed");
      return;
    }

    const data = await res.json();

    if (mode === "login") onLogin(data.token);
    else {
      alert("Account created. You can sign in now.");
      setMode("login");
      setPassword("");
    }
  };

  return (
    <div className="landing-root">
      {!showAuth && (
        <section className="hero">
          <div className="hero-backdrop hero-backdrop-left" />
          <div className="hero-backdrop hero-backdrop-right" />
          <div className="hero-stars" aria-hidden="true">
            {starDecor.map((star) => (
              <span key={star.className} className={`hero-star ${star.className}`}>
                {star.symbol}
              </span>
            ))}
          </div>

          <div className="hero-copy">
            <p className="hero-eyebrow">Collaborative productivity workspace</p>
            <h1>TaskLink</h1>
            <p className="hero-tag">by Ülkü Ece Kuşçu</p>

            <div className="slogans" aria-live="polite">
              <span key={slogans[activeSlogan]} className="slogan-text">
                {slogans[activeSlogan]}
              </span>
            </div>

            <p className="hero-desc">
              Time-blocking calendar, collaborative tasks, reactions, visual
              notes and productivity leaderboard - all in one place.
            </p>

            <button className="cta" onClick={() => setShowAuth(true)}>
              Get Started
            </button>
          </div>

          <div className="feature-showcase">
            <div className="feature-slider">
              <div className="slides-viewport">
                <div
                  className="slides-track"
                  style={{
                    transform: `translateX(calc(-${activeSlide} * (100% + 36px)))`,
                  }}
                >
                  {features.map((feature) => (
                    <article className="slide-panel" key={feature.title}>
                      <div className="feature-frame">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="feature-image"
                        />
                      </div>

                      <div className="feature-content">
                        <h2>{feature.title}</h2>
                        <p>{feature.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="slider-controls">
              <button
                type="button"
                className="arrow-button"
                onClick={goToPrevious}
                aria-label="Previous feature"
              >
                &lt;
              </button>

              <div className="slider-dots" aria-label="Feature slider indicators">
                {features.map((feature, index) => (
                  <button
                    key={feature.title}
                    type="button"
                    className={index === activeSlide ? "dot active" : "dot"}
                    onClick={() => goToSlide(index)}
                    aria-label={`Show ${feature.title}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="arrow-button"
                onClick={goToNext}
                aria-label="Next feature"
              >
                &gt;
              </button>
            </div>
          </div>
        </section>
      )}

      {showAuth && (
        <section className="auth-layout">
          <div className="auth-stars" aria-hidden="true">
            {starDecor.map((star) => (
              <span key={`auth-${star.className}`} className={`hero-star auth-star ${star.className}`}>
                {star.symbol}
              </span>
            ))}
          </div>

          <div className="auth-form">
            <button
              type="button"
              className="back-link"
              onClick={() => setShowAuth(false)}
            >
              Back to landing
            </button>

            <h2>{mode === "login" ? "Sign In" : "Register"}</h2>

            <form onSubmit={submit}>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="auth-btn">
                {mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="switch">
              {mode === "login" ? (
                <span onClick={() => setMode("register")}>Register instead</span>
              ) : (
                <span onClick={() => setMode("login")}>Back to Sign In</span>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
