export async function apiFetch(path, options = {}) {

  const token = localStorage.getItem("token");

  const publicPaths = new Set([
    "/login",
    "/register"
  ]);

  if (!token && !publicPaths.has(path)) {
    throw new Error("No token")
  }

  const res = await fetch(`/api${path}`, {   // 🔥 BURASI DEĞİŞTİ

    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },

  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
  }

  return res;
}