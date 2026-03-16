import { apiFetch } from "./api";

function urlBase64ToUint8Array(base64String) {

  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function subscribePush() {

  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.log("Notification permission denied");
    return;
  }

  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    console.log("Already subscribed");
    return;
  }

  const VAPID_PUBLIC_KEY = "BURAYA_PUBLIC_KEY";

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));

  await apiFetch("/subscribe", {
    method: "POST",
    body: JSON.stringify({
      userId: payload.user_id,
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys
    })
  });

  console.log("Push subscribed");

}