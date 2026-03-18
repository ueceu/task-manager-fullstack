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

<img width="2559" height="1267" alt="main" src="https://github.com/user-attachments/assets/1b7502a5-7d9c-4625-a74b-03cd63d3de0f" />

<img width="1277" height="1268" alt="main1" src="https://github.com/user-attachments/assets/a24a70ea-bc04-4a65-898c-27ce51161dfe" />

<img width="1278" height="1268" alt="main2" src="https://github.com/user-attachments/assets/a918179b-1cad-444f-9dac-b9ff2e156b96" />

<img width="1278" height="1270" alt="main3" src="https://github.com/user-attachments/assets/5e1a643f-0724-4106-b945-2ea245b00c41" />

<img width="1279" height="1268" alt="main4" src="https://github.com/user-attachments/assets/19b8012d-974d-4c1d-97e3-91a50a5af86f" />

<img width="1277" height="1268" alt="main5" src="https://github.com/user-attachments/assets/79544fb6-0c54-4292-9bb9-92dc470cc4d5" />

<img width="1278" height="1268" alt="main6" src="https://github.com/user-attachments/assets/0072305f-48f7-4a33-aafc-3308df2d9cbc" />

<img width="1279" height="1267" alt="image" src="https://github.com/user-attachments/assets/b75bbb49-7317-4a1d-9a16-37f4c9e8a65e" />

<img width="1276" height="1270" alt="image" src="https://github.com/user-attachments/assets/c6e36eaf-cd9e-4434-9a25-7c4c444c3863" />

<img width="1278" height="1271" alt="image" src="https://github.com/user-attachments/assets/0ac803b8-c46c-4fd6-a8a5-954b4b985615" />

<img width="1279" height="1270" alt="image" src="https://github.com/user-attachments/assets/4a5bb303-2a13-481c-b0be-4fccf1c16356" />

<img width="1278" height="1271" alt="image" src="https://github.com/user-attachments/assets/c9647798-f4fd-4b81-b3d7-a717ca21bdcc" />


(See `/images` folder.)

---

## 🧠 What I Learned

* End-to-end fullstack deployment
* Reverse proxy setup with Nginx
* Managing services with systemd
* Debugging production issues (CORS, DNS, SSL, build mismatches)
* Mobile responsiveness & UI architecture

---

## 👤 Author

Ülkü Ece Kuşçu
