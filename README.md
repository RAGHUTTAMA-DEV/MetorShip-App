# 🤝 Real-Time Mentorship Platform

A full-stack real-time mentorship booking and collaboration platform built using **MERN stack** (MongoDB, Express, React, Node.js) and **Socket.IO** for live chat and whiteboard sessions. Designed to connect learners with industry experts and mentors.

---

## 🚀 Features

### 👥 User Roles
- **Learners**: Search mentors, book sessions, chat, rate mentors.
- **Mentors**: Set availability, accept/reject sessions, conduct sessions.
- **Admins**: Manage users, view analytics, moderate reviews.

### 🧠 Core Modules
- **Real-Time Booking System** with calendar and time slot management.
- **Live Chat** via Socket.IO for each session.
- **Collaborative Whiteboard** with drawing, text, eraser tools.
- **AI Chatbot** to assist with tech questions & mentor suggestions.
- **Mentor Discovery** based on skills, rating, availability.
- **File Sharing** during mentorship sessions.
- **Feedback & Ratings** for mentors after sessions.

---

## 📚 Tech Stack

| Layer         | Technology                 |
|---------------|-----------------------------|
| Frontend      | React.js + Tailwind CSS     |
| Backend       | Node.js + Express.js        |
| Real-Time     | Socket.IO                   |
| Database      | MongoDB + Mongoose          |
| Auth          | JWT + Bcrypt                |
| AI Features   | OpenAI API (optional)       |
| File Uploads  | Cloudinary / Firebase       |
| Deployment    | Vercel (frontend), Render / Railway (backend)

---

## 🗂️ Folder Structure

.
├── client/ # React frontend
│ ├── components/
│ ├── pages/
│ └── services/
├── server/ # Node.js backend
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── sockets/
│ └── utils/
└── README.md

yaml
Copy
Edit

---

## 🔐 Authentication & Roles

- **JWT-based** session tokens.
- Role-based route protection (`learner`, `mentor`, `admin`).
- Editable user profiles with avatar and skills.

---

## 🧩 Key APIs (Backend)

| Method | Endpoint                         | Description |
|--------|----------------------------------|-------------|
| POST   | `/api/auth/signup`               | Register a new user |
| GET    | `/api/mentors?skill=react`       | Search mentors by skill |
| POST   | `/api/bookings`                  | Book a session |
| PUT    | `/api/bookings/:id/status`       | Confirm/reject booking |
| GET    | `/api/chat/:roomId`              | Fetch chat messages |
| POST   | `/api/ai/match`                  | AI-based mentor suggestions |
| POST   | `/api/reviews`                   | Submit mentor review |

---

## 🔄 Real-Time Features

- **Socket.IO Integration**
  - Join/leave chat rooms.
  - Real-time messaging.
  - Live collaborative whiteboard sync.

---

## 🧪 Future Improvements

- Video calling integration (WebRTC / Daily.co)
- Payment gateway for paid mentorships
- Smart calendar syncing (Google/Outlook)
- Availability AI optimizer
- Role-specific dashboards

---

## 📸 Screenshots (Add Later)

- Mentor discovery page
- Booking modal with calendar
- Chat + whiteboard interface
- Admin analytics dashboard

---

## 🛠️ Setup Instructions

```bash
# Clone repository
git clone https://github.com/yourusername/mentorship-platform.git
cd mentorship-platform

# Backend setup
cd server
npm install
npm run dev

# Frontend setup
cd client
npm install
npm run dev