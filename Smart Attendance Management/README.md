# Smart Attendance Management System

A full-stack MERN project for college attendance management with live QR sessions, role-based dashboards, and a teacher-reviewed late-attendance flow.

## Features

- Single login page for `admin`, `teacher`, and `student`
- Admin management for departments, sections, subjects, students, teachers, assignments, and timetable
- Teacher dashboard for today's classes, live QR generation, roster view, and late-request approval
- Student dashboard with QR scanning, attendance history, and subject-wise attendance percentages
- Duplicate scan blocking and session-scoped QR validation
- Auto absent marking when the teacher ends a session or when the class window has expired
- Excel attendance report export

## Stack

- Frontend: React + Vite + Axios + React Router
- Backend: Node.js + Express + MongoDB + Mongoose
- Auth: JWT + bcryptjs
- QR: `qrcode` on the server and `html5-qrcode` in the client

## Project Structure

```text
client/   React frontend
server/   Express API and MongoDB models
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Copy the environment examples and update values:

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

3. Seed the first admin user:

```bash
npm --prefix server run seed:admin
```

4. Run the API and frontend in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

## Default Flow

1. Seed an admin account.
2. Log in as admin and create departments, sections, subjects, teachers, students, assignments, and timetable entries.
3. Teacher logs in, starts a scheduled class, and shows the live QR.
4. Student logs in, scans the QR, and is marked present or late.
5. Teacher reviews late requests and ends the session.

## Suggested Enhancements

- Socket-based real-time attendance updates
- Device or geofence checks for stronger anti-cheat rules
- Notification support for attendance warnings
- Charts and monthly analytics for admin reporting
