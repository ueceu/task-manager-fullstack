function makeSticker(label, accent, text = "TaskLink") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="28" fill="${accent}" />
      <text x="120" y="84" text-anchor="middle" font-size="28" font-weight="700" font-family="Arial, sans-serif" fill="white">${label}</text>
      <text x="120" y="148" text-anchor="middle" font-size="18" font-weight="600" font-family="Arial, sans-serif" fill="white">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_STICKERS = [
  { id: "luck", name: "Good Luck", url: makeSticker("GOOD LUCK", "#2563eb", "You got this") },
  { id: "wow", name: "Wow", url: makeSticker("WOW", "#f97316", "Amazing work") },
  { id: "power", name: "Power", url: makeSticker("POWER", "#10b981", "Keep going") },
  { id: "focus", name: "Focus", url: makeSticker("FOCUS", "#7c3aed", "Locked in") },
];

export function loadCustomStickers() {
  try {
    return JSON.parse(localStorage.getItem("customStickers") || "[]");
  } catch {
    return [];
  }
}

export function saveCustomStickers(stickers) {
  localStorage.setItem("customStickers", JSON.stringify(stickers));
}

export function getAllStickers() {
  return [...DEFAULT_STICKERS, ...loadCustomStickers()];
}
