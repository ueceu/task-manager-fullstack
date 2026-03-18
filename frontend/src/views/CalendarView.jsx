import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { apiFetch } from "../api";

import "./calendar.css";
import TaskModal from "./TaskModal";
import ReminderModal from "./ReminderModal";
import ReminderListModal from "./ReminderListModal";

export default function CalendarView({
  setApi,
  onTitleChange,
  view,
  selectedGroup
}) {
  const ref = useRef(null);
  const latestLoadRef = useRef(0);

  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [reminderPopup, setReminderPopup] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [activeReminder, setActiveReminder] = useState(null);
  const [taskReactions, setTaskReactions] = useState([]);
  const [use24Hour] = useState(true);
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1])).user_id;
    } catch {
      return null;
    }
  })();

  const logResponseError = async (res, context) => {
    let details = "";
    try {
      details = await res.text();
    } catch {
      details = "";
    }
    console.error(`${context} failed`, res.status, details);
  };

  
  const loadTasks = useCallback(async () => {

    const reqId = ++latestLoadRef.current;

    let path = "/tasks"

    if (selectedGroup === "personal") {
      path = "/tasks?type=personal"
    }
    else if (selectedGroup === "global") {
      path = "/tasks?type=global"
    }
    else if (selectedGroup?.id) {
      path = `/group/${selectedGroup.id}/tasks`
    }

    try {

      const res = await apiFetch(path);

      if (!res.ok) {
        await logResponseError(res, "loadTasks");
        return;
      }

      const data = await res.json();

      const mapped = data.map((t) => {
        const scheduledStart = new Date(t.start_time);
        const actualStart =
          (t.status === "active" || t.status === "done") && t.started_at
            ? new Date(t.started_at)
            : scheduledStart;
        const actualEnd =
          t.status === "done" && t.ended_at
            ? new Date(t.ended_at)
            : new Date(
                actualStart.getTime() +
                  (t.status === "done" && t.total_minutes
                    ? t.total_minutes
                    : t.planned_minutes) *
                    60000
              );

        return {
          id: String(t.id),
          title: t.title,
          description: t.description,
          start: actualStart,
          end: actualEnd,
          durationMinutes: t.planned_minutes,
          isGlobal: t.is_global ?? false,
          status: t.status,
          ownerId: t.user_id,
          color: t.color,
          scheduledStart,
          startedAt: t.started_at,
          endedAt: t.ended_at,
          totalMinutes: t.total_minutes,
          earnedPoints: (t.total_minutes || 0) * 10,

          backgroundColor: t.color,
          borderColor: t.color,
          classNames: [
            "calendar-event",
            `calendar-event-${t.status || "waiting"}`,
          ],
        };

      });

      if (reqId !== latestLoadRef.current) return;

      setTasks(mapped);

    } catch (err) {

      console.error("loadTasks exception", err);

    }

  }, [selectedGroup]);


  const loadReminders = async () => {

    const res = await apiFetch("/reminders")

    if(!res.ok) return

    const data = await res.json()

    const mapped = data.map(r=>({

      id:`reminder-${r.id}`,
      title:r.title,
      note:r.note,
      start:new Date(r.date),
      date:new Date(r.date),
      isReminder:true,
      reminderId:String(r.id)

    }))

    setReminders(mapped)

  }
  
  useEffect(()=>{
    loadReminders()
  },[])

  useEffect(() => {
    if (ref.current) {
      setApi(ref.current.getApi());
    }
  }, [setApi]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);


  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: "SET_TOKEN",
          token: localStorage.getItem("token"),
        });
      });
    }
  }, []);


  const isPastBeyondTolerance = (dateObj) => {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = diffMs / 60000;
    return diffMinutes > 5;
  };

  const createTask = useCallback(
    async (startDate, data) => {

      try {

        let res

        if (selectedGroup?.id) {

          res = await apiFetch("/group/task", {
            method: "POST",
            body: JSON.stringify({
              group_id: selectedGroup.id,
              title: data.title,
              description: data.description,
              start_time: startDate.toISOString(),
              planned_minutes: data.durationMinutes,
              color: data.color
            })
          })

        } else {

          res = await apiFetch("/task", {
            method: "POST",
            body: JSON.stringify({
              title: data.title,
              description: data.description,
              start_time: startDate.toISOString(),
              planned_minutes: data.durationMinutes,
              is_global: data.isGlobal,
              color: data.color
            })
          })

        }

        if (!res.ok) {
          await logResponseError(res, "createTask")
          return false
        }

        await loadTasks()
        return true

      } catch (err) {

        console.error("createTask exception", err)
        return false

      }
    },
    [loadTasks, selectedGroup]
  )

  const updateTask = useCallback(
    async (id, startDate, data) => {

      try {

        const path = selectedGroup?.id
          ? `/group/task/${id}/update`
          : `/task/${id}/update`;

        const payload = {
          title: data.title,
          description: data.description,
          start_time: startDate.toISOString(),
          planned_minutes: data.durationMinutes,
          color: data.color
        };

        const res = await apiFetch(path, {

          method: "POST",

          body: JSON.stringify(
            selectedGroup?.id
              ? payload
              : {
                  ...payload,
                  is_global: data.isGlobal,
                }
          ),

        });

        if (!res.ok) {

          await logResponseError(res, "updateTask");
          return false;

        }

        await loadTasks();
        return true;

      } catch (err) {

        console.error("updateTask exception", err);
        return false;

      }

    },
    [loadTasks, selectedGroup]
  );

  const deleteTask = useCallback(
    async (id) => {
      try {
        const path = selectedGroup?.id
          ? `/group/task/${id}`
          : `/task/${id}`;
        const res = await apiFetch(path, { method: "DELETE" });
        if (!res.ok) {
          await logResponseError(res, "deleteTask");
          return false;
        }
        await loadTasks();
        return true;
      } catch (err) {
        console.error("deleteTask exception", err);
        return false;
      }
    },
    [loadTasks, selectedGroup]
  );

  const startTask = useCallback(
    async (id) => {
      try {
        const path = selectedGroup?.id
          ? `/group/task/${id}/start`
          : `/task/${id}/start`;
        const res = await apiFetch(path, { method: "POST" });
        if (!res.ok) {
          await logResponseError(res, "startTask");
          return false;
        }
        await loadTasks();
        return true;
      } catch (err) {
        console.error("startTask exception", err);
        return false;
      }
    },
    [loadTasks, selectedGroup]
  );

  const completeTask = useCallback(
    async (id) => {
      try {
        const path = selectedGroup?.id
          ? `/group/task/${id}/complete`
          : `/task/${id}/complete`;
        const res = await apiFetch(path, { method: "POST" });
        if (!res.ok) {
          await logResponseError(res, "completeTask");
          return false;
        }
        await loadTasks();
        window.dispatchEvent(new Event("leaderboard-refresh"));
        return true;
      } catch (err) {
        console.error("completeTask exception", err);
        return false;
      }
    },
    [loadTasks, selectedGroup]
  );

  const extendTask = useCallback(
    async (id, minutes, reload = true) => {
      try {
        const path = selectedGroup?.id
          ? `/group/task/${id}/extend/${minutes}`
          : `/task/${id}/extend/${minutes}`;
        const res = await apiFetch(path, {
          method: "POST",
        });
        if (!res.ok) {
          await logResponseError(res, "extendTask");
          return false;
        }
        if (reload) await loadTasks();
        return true;
      } catch (err) {
        console.error("extendTask exception", err);
        return false;
      }
    },
    [loadTasks, selectedGroup]
  );

  const moveTask = useCallback(async (id, startDate, plannedMinutes, reload = true) => {
    try {
      const path = selectedGroup?.id
        ? `/group/task/${id}/move`
        : `/task/${id}/move`;
      const res = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({
          start_time: startDate.toISOString(),
          planned_minutes: plannedMinutes,
        }),
      });
      if (!res.ok) {
        await logResponseError(res, "moveTask");
        return false;
      }
      if (reload) await loadTasks();
      return true;
    } catch (err) {
      console.error("moveTask exception", err);
      return false;
    }
  }, [loadTasks, selectedGroup]);

  const handleSelect = (selection) => {
    if (selection.view.type === "dayGridMonth") {
      setActiveReminder({
        id: (crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now()),
        title: "",
        note: "",
        date: selection.start,
        isNew: true,
      });
      return;
    }

    if (isPastBeyondTolerance(selection.start)) {
      selection.view.calendar.unselect();
      alert("You cannot create a task in the past (5 min tolerance).");
      return;
    }

    setActiveTask({
      id: (crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now()),
      title: "",
      description: "",
      start: selection.start,
      end: selection.end,
      durationMinutes:
        (selection.end.getTime() - selection.start.getTime()) / 60000,
      isGlobal: false,
      color: "#2563eb",
      status: "waiting",
      isNew: true,
    });
  };

  const handleEventClick = (info) => {
    if (view === "dayGridMonth" && info.event.extendedProps?.isReminder) {
      const reminder = reminders.find(
        (item) => item.id === info.event.id || item.reminderId === info.event.extendedProps?.reminderId
      );
      if (reminder) {
        setActiveReminder({ ...reminder, isNew:false });
      }
      return
    }

    const e = info.event
    const nextTask = {
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      ...e.extendedProps,
      isNew:false
    };

    setActiveTask(nextTask);

    if (nextTask.isGlobal) {
      loadTaskReactions(nextTask.id);
    } else {
      setTaskReactions([]);
    }

  }

  const loadTaskReactions = useCallback(async (taskId) => {
    const res = await apiFetch(`/task/${taskId}/reactions`);
    if (!res.ok) {
      setTaskReactions([]);
      return;
    }

    const data = await res.json();
    setTaskReactions(data);
  }, []);

  const updateEventTime = async (info) => {
    if (info.event.extendedProps?.status === "done") {
      info.revert();
      return;
    }

    const updatedStart = info.event.start;
    const updatedEnd = info.event.end;
    const previousStart = info.oldEvent.start;
    const previousEnd = info.oldEvent.end;

    if (!updatedStart || !updatedEnd || !previousStart || !previousEnd) {
      info.revert();
      return;
    }

    if (isPastBeyondTolerance(updatedStart)) {
      alert("You cannot move a task into the past.");
      info.revert();
      return;
    }

    const previousMinutes = Math.round(
      (previousEnd.getTime() - previousStart.getTime()) / 60000
    );
    const updatedMinutes = Math.round(
      (updatedEnd.getTime() - updatedStart.getTime()) / 60000
    );
    const durationDiff = updatedMinutes - previousMinutes;
    const id = info.event.id;

    let success = false;

    if (durationDiff > 0) {
      // Keep move and extend split to satisfy backend API contract.
      const moved = await moveTask(id, updatedStart, previousMinutes, false);
      if (!moved) {
        info.revert();
        await loadTasks();
        return;
      }

      success = await extendTask(id, durationDiff, false);
    } else {
      success = await moveTask(id, updatedStart, updatedMinutes, false);
    }

    if (!success) {
      info.revert();
      await loadTasks();
      return;
    }

    await loadTasks();
  };

  const handleSaveTask = async (data) => {
    if (!activeTask) return;
    const taskStart = activeTask.scheduledStart || activeTask.start;

    let success = false;
    if (activeTask.isNew) {
      success = await createTask(activeTask.start, data);
    } else {
      success = await updateTask(activeTask.id, taskStart, data);
    }

    if (success) {
      setActiveTask(null);
    }
  };

  const handleDeleteTask = async () => {
    if (!activeTask || activeTask.isNew) return;
    const success = await deleteTask(activeTask.id);
    if (success) {
      setActiveTask(null);
    }
  };

  const handleSendReaction = async ({ stickerUrl, message }) => {
    if (!activeTask) return false;

    const res = await apiFetch(`/task/${activeTask.id}/reaction`, {
      method: "POST",
      body: JSON.stringify({
        sticker_url: stickerUrl,
        message,
      }),
    });

    if (!res.ok) {
      await logResponseError(res, "sendReaction");
      return false;
    }

    await loadTaskReactions(activeTask.id);
    return true;
  };

  const handleStartTask = async () => {
    if (!activeTask || activeTask.isNew) return;
    const success = await startTask(activeTask.id);
    if (success) {
      setActiveTask(null);
    }
  };

  const handleCompleteTask = async () => {
    if (!activeTask || activeTask.isNew) return;
    const success = await completeTask(activeTask.id);
    if (success) {
      setActiveTask(null);
    }
  };

  const handleExtendTask = async (minutes) => {
    if (!activeTask || activeTask.isNew) return;
    const success = await extendTask(activeTask.id, minutes);
    if (success) {
      setActiveTask(null);
    }
  };

  const handleSaveReminder = async (data) => {

    if (!activeReminder) return

    const reminderId = activeReminder.reminderId || activeReminder.id;
    const path = activeReminder.isNew
      ? "/reminder"
      : `/reminder/${reminderId}`;

    const method = activeReminder.isNew ? "POST" : "PUT";

    const res = await apiFetch(path,{
      method,
      body:JSON.stringify({
        title:data.title,
        note:data.note,
        date:activeReminder.date.toISOString()
      })
    })

    if(res.ok){
      await loadReminders()
    }

    setActiveReminder(null)

  }

  const handleUpdateReminderNoteFromList = async (id, note) => {
    const reminder = reminders.find(
      (item) => item.id === id || item.reminderId === id
    );
    if (!reminder) return;

    const res = await apiFetch(`/reminder/${reminder.reminderId || reminder.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: reminder.title,
        note,
        date: reminder.date.toISOString(),
      }),
    });

    if (!res.ok) {
      await logResponseError(res, "updateReminder");
      return;
    }

    await loadReminders();

    setReminderPopup((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        events: prev.events.map((eventItem) =>
          eventItem.id === id || eventItem.reminderId === id
            ? { ...eventItem, note }
            : eventItem
        ),
      };
    });
  };

  const eventsToShow = view === "dayGridMonth" ? reminders : tasks;

  return (
    <>
      <FullCalendar
        ref={ref}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={view}
        headerToolbar={false}
        height="100%"
        nowIndicator
        allDaySlot={false}
        expandRows={view !== "dayGridMonth"}
        displayEventTime={view !== "dayGridMonth"}
        slotDuration="00:15:00"
        snapDuration="00:15:00"
        selectable
        longPressDelay={0}
        selectLongPressDelay={0}

        eventAllow={(dropInfo, draggedEvent) => {
          if (draggedEvent.extendedProps?.status === "done") {
            return false;
          }

          const token = localStorage.getItem("token")
          const payload = JSON.parse(atob(token.split(".")[1]))
          const currentUser = payload.user_id

          const owner = draggedEvent.extendedProps?.ownerId
          const isGlobal = draggedEvent.extendedProps?.isGlobal

          if (isGlobal && owner !== currentUser) {
            return false
          }

          return true
        }}

        eventDidMount={(info)=>{
          const isDone = info.event.extendedProps.status === "done";
          const ownerId = info.event.extendedProps.ownerId;
          const shouldFade =
            isDone && (!selectedGroup?.id || ownerId === currentUserId);

          if(shouldFade){
            info.el.style.opacity = "0.45"
          }
        }}
        eventContent={(info) => {
          if (info.event.extendedProps?.isReminder) {
            return (
              <div className="reminder-dot-row">
                <span className="reminder-dot" />
                <span>{info.event.title}</span>
              </div>
            );
          }

          const earnedPoints = info.event.extendedProps?.earnedPoints;
          return (
            <div className="calendar-event-body">
              <div className="calendar-event-title">{info.event.title}</div>
              {info.event.extendedProps?.status === "done" && earnedPoints > 0 && (
                <div className="calendar-event-points">+{earnedPoints} pts</div>
              )}
            </div>
          );
        }}

        select={handleSelect}
        events={eventsToShow}
        editable={view !== "dayGridMonth"}
        eventStartEditable={view !== "dayGridMonth"}
        eventDurationEditable={view !== "dayGridMonth"}
        eventResizableFromStart={true}
        eventDrop={updateEventTime}
        eventResize={updateEventTime}
        eventClick={handleEventClick}
        fixedWeekCount={false}
        slotLabelInterval="01:00"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: !use24Hour,
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: !use24Hour,
        }}
        firstDay={1}
        datesSet={(arg) => onTitleChange(arg.view.title)}
        dayMaxEvents={view === "dayGridMonth" ? 3 : false}
        moreLinkClick={(arg) => {
          if (view !== "dayGridMonth") return;

          const dayEvents = reminders.filter((r) => {
            const d = new Date(r.date || r.start);
            return (
              d.getFullYear() === arg.date.getFullYear() &&
              d.getMonth() === arg.date.getMonth() &&
              d.getDate() === arg.date.getDate()
            );
          });

          setReminderPopup({
            date: arg.date,
            events: dayEvents,
          });

          return "none";
        }}
        dayHeaderContent={(args) => {
          const day = args.date
            .toLocaleDateString("en-GB", { weekday: "short" })
            .toUpperCase();
          const num = args.date.getDate();

          if (args.view.type === "dayGridMonth") {
            return (
              <div className="day-header">
                <div className="day-number">{num}</div>
              </div>
            );
          }

          return (
            <div className="day-header">
              <div className="day-name">{day}</div>
              <div className="day-number">{num}</div>
            </div>
          );
        }}
      />

      {activeTask && (
        <TaskModal
          task={activeTask}
          onSave={handleSaveTask}
          onStart={handleStartTask}
          onComplete={handleCompleteTask}
          onExtend={handleExtendTask}
          onDelete={handleDeleteTask}
          currentUserId={currentUserId}
          reactions={taskReactions}
          onSendReaction={handleSendReaction}
          onClose={() => setActiveTask(null)}
        />
      )}

      {activeReminder && (
        <ReminderModal
          reminder={activeReminder}
          onSave={handleSaveReminder}
          onClose={() => setActiveReminder(null)}
        />
      )}

      {reminderPopup && (
        <ReminderListModal
          popup={reminderPopup}
          onUpdateNote={handleUpdateReminderNoteFromList}
          onClose={() => setReminderPopup(null)}
        />
      )}
    </>
  );
}
