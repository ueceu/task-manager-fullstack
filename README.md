# TaskLink – Fullstack Task Manager

A production-ready fullstack productivity application with calendar-based task management, reminders, and social features.

🌐 Live: https://tasklinks.online

---

## 🚀 Features

* JWT Authentication (Login / Register)
* Calendar-based task management
* Personal, Global and Group tasks
* Reminders system
* Task reactions & leaderboard
* Responsive UI (desktop + mobile)
* Real-time-like UX with smooth interactions

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* FullCalendar
* CSS

### Backend

* FastAPI (Python)
* JWT Authentication

### Deployment

* AWS EC2 (Ubuntu)
* Nginx (reverse proxy)
* Systemd (backend service)
* Let's Encrypt (SSL)

---

## ⚙️ Architecture

Client → Nginx → FastAPI → Database

* Nginx serves frontend (static build)
* `/api` routes proxied to FastAPI backend
* HTTPS enabled via Certbot

---

## 📸 Screenshots

See `/images` folder.

---

## 🧠 What I Learned

* End-to-end fullstack deployment
* Reverse proxy setup with Nginx
* Managing services with systemd
* Debugging production issues (CORS, DNS, SSL, build mismatches)
* Mobile responsiveness & UI architecture

---

## 👤 Author

Ece
