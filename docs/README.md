<div align="center">

```
 █████╗  ██████╗██╗      ██████╗██╗  ██╗██████╗
██╔══██╗██╔════╝██║     ██╔════╝╚██╗██╔╝██╔══██╗
███████║██║     ██║     ██║      ╚███╔╝ ██████╔╝
██╔══██║██║     ██║     ██║      ██╔██╗ ██╔═══╝
██║  ██║╚██████╗███████╗╚██████╗██╔╝ ██╗██║
╚═╝  ╚═╝ ╚═════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝
```

### 🏛️ ACLC College of Tacloban · Event Management System

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

**No more paper. No more chaos. No more "is my name on the list?"**

[Live Demo](#) · [API Docs](#) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

## ✨ What is ACLCxp?

> Imagine Hogwarts — but make it ACLC Tacloban.

**ACLCxp** (ACLC Experience) is a full-stack digital event management platform built for **3,000+ students** at ACLC College of Tacloban. It replaces the old-school clipboard-and-paper attendance system with QR codes, live leaderboards, AI-powered recommendations, and a full house competition system.

Built as a capstone project — but built like a real product.

---

## 🔥 The Problem We're Solving

| Before ACLCxp 😩 | After ACLCxp 🎉 |
|---|---|
| 5–10 minutes of attendance per event | ⚡ 30-second QR scan |
| 500+ paper sheets per semester | 📱 100% digital |
| 15% manual error rate | <1% error rate |
| No analytics, just vibes | 📊 Real-time dashboards |
| House points disputed every week | 🏆 Automated, transparent system |
| ₱116,000/semester in paper costs | 💰 ₱232,000/year saved |

---

## 🏠 The Five Houses

Every student belongs to one. Every event earns points. One house reigns supreme.

| 🔥 CAHEL | 🦅 GIALLIO | 🐉 VIERRDY | ⚡ ROXXO | 🐺 AZUL |
|:---:|:---:|:---:|:---:|:---:|
| `#FF6B35` | `#FFD700` | `#DC143C` | `#4169E1` | `#9370DB` |
| *From ashes we rise* | *Courage above all* | *Strength through fire* | *Wisdom and strength* | *Beyond the horizon* |

Points are earned two ways:
- **Participation** → 5 pts just for showing up
- **Performance** → 50 / 40 / 30 pts for 1st / 2nd / 3rd place

---

## 🚀 Features

### 🎫 QR-Based Attendance
HMAC-SHA256 signed QR codes — unique to every student, impossible to fake, expire every 24 hours. Facilitators scan, system validates, attendance recorded. Done.

### 🗓️ Event Management
Create events with capacity limits, visibility controls (public, house-only, program-specific), waitlists, and categories. Students register, get reminders, show up, earn points.

### 🤖 AI Recommendations (Google Gemini)
Personalized event suggestions based on a student's interests and attendance history. Plus a chatbot that answers "when is the next CS event?" so admins don't have to.

### 📊 Admin Analytics
Live dashboards, exportable reports, audit logs, user management — everything an admin needs to run 100+ events a semester without losing their mind.

### 🔔 Notifications
Email confirmations via Resend, in-app notifications, and event reminders — because students forget, and that's okay.

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                        │
│  React 18 + TypeScript · Vite · Tailwind CSS        │
│  React Router v6 · React Query · Zustand            │
│  Deployed on → Vercel                               │
├─────────────────────────────────────────────────────┤
│                      BACKEND                        │
│  Django 4.2 + Django REST Framework                 │
│  JWT Auth (SimpleJWT) · Python 3.11+                │
│  Deployed on → Railway                              │
├─────────────────────────────────────────────────────┤
│                     DATABASE                        │
│  PostgreSQL 15 (prod) · SQLite (dev)                │
│  17 core tables · Hosted on Railway                 │
├─────────────────────────────────────────────────────┤
│                  THIRD-PARTY SERVICES               │
│  Google Gemini · Cloudinary · Resend                │
└─────────────────────────────────────────────────────┘
```


---

## 👤 User Roles

| Role | Can Do |
|---|---|
| 🎓 **Student** | Register for events, view QR code, check personal merit sheet, view leaderboard |
| 🧑‍🏫 **Facilitator** | Everything above + scan QR codes at events |
| 📋 **Organizer** | Everything above + create events, post results |
| 🏠 **House Leader** | Student access + house analytics dashboard |
| 🛡️ **Admin** | Full system access — users, settings, audit logs, everything |

---

---

## 🚢 Deployment

| Service | Platform | Auto-deploy |
|---|---|---|
| Backend API | Railway | ✅ On push to `main` |
| Frontend | Vercel | ✅ On push to `main` |
| Database | Railway PostgreSQL | — Daily backups |
| Media files | Cloudinary | — |

```bash
# Production build check
cd frontend && npm run build
cd backend && python manage.py check --deploy
```

## 🤝 Contributing

This is a capstone project — but good PRs are always welcome.

```bash
# Branch naming convention
feature/your-feature-name
fix/what-you-fixed
chore/what-you-updated

# Example
git checkout -b feature/qr-scanning
```

1. Fork the repo
2. Create your feature branch
3. Commit with clear messages (`feat: add QR scan endpoint`)
4. Push and open a Pull Request

---

## 👨‍💻 Built By

Made with too much coffee and not enough sleep by students of **ACLC College of Tacloban** as a capstone project.

> *"We replaced 500 sheets of paper per semester with a QR code. We're basically saving trees."*

---

## 📄 License

MIT License — use it, learn from it, build on it.

---

<div align="center">

**⚡ Built for 3,000+ students · Saves ₱232,000/year · Powered by Django + React**

🔥 CAHEL &nbsp;|&nbsp; 🦅 GIALLIO &nbsp;|&nbsp; 🐉 VIERRDY &nbsp;|&nbsp; ⚡ ROXXO &nbsp;|&nbsp; 🦄 AZUL

*May the best house win.*

</div>
