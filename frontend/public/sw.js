/* =====================================================
   TOKEN'I TUT (SERVICE WORKER STATE)
   ===================================================== */

self.token = null;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_TOKEN") {
    self.token = event.data.token;
  }
});

/* =====================================================
   PUSH GELDİĞİNDE BİLDİRİM GÖSTER
   ===================================================== */

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.message,
    data: {
      taskId: data.taskId,
    },
    actions: [
      { action: "start", title: "Start" },
      { action: "complete", title: "Complete" },
      { action: "extend15", title: "+15 min" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/* =====================================================
   BİLDİRİME TIKLANINCA
   ===================================================== */

self.addEventListener("notificationclick", (event) => {
  const taskId = event.notification.data.taskId;
  event.notification.close();

  let endpoint = null;

  if (event.action === "start") {
    endpoint = `/task/${taskId}/start`;
  } else if (event.action === "complete") {
    endpoint = `/task/${taskId}/complete`;
  } else if (event.action === "extend15") {
    endpoint = `/task/${taskId}/extend/15`;
  }

  // Eğer notification body'ye tıklandıysa (buton değil)
  if (!endpoint) return;

  event.waitUntil(
    fetch(`http://localhost:8000${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${self.token}`,
      },
    })
  );
});
