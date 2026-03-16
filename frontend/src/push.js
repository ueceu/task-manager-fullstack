import { apiFetch } from "./api";

export async function subscribeToPush(userId) {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  });

  await apiFetch("/subscribe", {
    method: "POST",
    body: JSON.stringify({
      userId,
      ...subscription.toJSON(),
    }),
  });
}
