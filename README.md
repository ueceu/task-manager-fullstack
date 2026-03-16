# Task Manager Fullstack

Fullstack task management application built with FastAPI and React (Vite).

## Features

* User authentication
* Task creation and management
* Calendar view
* Notes panel
* Reminder system
* Push notifications

## Tech Stack

Backend:

* FastAPI
* SQLite
* APScheduler

Frontend:

* React
* Vite
* JavaScript
* CSS

## Project Structure

backend/

* main.py
* scheduler.py
* requirements.txt

frontend/

* src/
* public/
* package.json

## Local Development

Backend

pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

Frontend

cd frontend
npm install
npm run dev

## Deployment

The application is designed to run on an AWS EC2 instance with a FastAPI backend and a static React build.

## Author

Ülkü Ece Kuşçu
