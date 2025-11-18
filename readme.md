# ChatApp

A focused real-time chat application (MERN + Socket.io) for learning and small demos — supports private and group chat, profiles, admin tools, file uploads, and app-level AES message encryption.

---

## Key features

- JWT authentication (register / login / logout)  
- 1:1 private chat and group chat (create / join)  
- Real-time updates via Socket.io  
- User profiles (avatar, about, status)  
- Admin dashboard (manage users, groups, reports)  
- File uploads (Multer) and basic media serving  
- Optional email flows (verification / OTP) — pluggable providers  
- AES message encryption utility (app-level, not E2E)

---

## Tech stack

- Frontend: React, Vite, Tailwind CSS, socket.io-client  
- Backend: Node.js, Express, Socket.io, Mongoose (MongoDB)  
- Auth / Security: JWT, bcrypt  
- File uploads: Multer (local uploads/), static serve with MIME headers  
- Email: Nodemailer / Resend / SendGrid / Brevo (pluggable)

---

## Repository structure

backend/
    - controllers/
    - middleware/
    - models/
    - routes/
    - utils/         
    - socket.js
    - server.js

frontend/
    - src/
        - components/
        - pages/
        - context/
        - hooks/
        - services/    # api, authService, chatService
        - utils/
    - index.css
    - main.jsx

---

## Environment (local / before deploy)

Backend .env (example)
```env
PORT=5000
MONGO_URI=<your_mongo_connection_string>
JWT_SECRET=<strong_jwt_secret>
ENCRYPTION_KEY=<aes_key_for_messages>
FRONTEND_URL=http://localhost:5173

# Optional email provider (choose ONE or disable)
SMTP_USER=you@gmail.com
SMTP_PASS=<app-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
EMAIL_FROM=you@gmail.com

# OR Resend / SendGrid / Brevo keys:
RESEND_API_KEY=...
SENDGRID_API_KEY=...
BREVO_API_KEY=...
```

Frontend .env (Vite)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENCRYPTION_KEY=<same_as_backend_or_client_key_if_needed>
```

---

## Minimal API endpoints

- POST /api/auth/register — Register new user  
- POST /api/auth/login — Login (returns token + user)  
- GET  /api/auth/profile — Get current user (protected)  
- PUT  /api/auth/profile — Update profile (multipart for avatar)  
- GET  /api/conversations — List 1:1 conversations  
- POST /api/conversations — Start/get 1:1 conversation (body: { userId })  
- GET  /api/groups/my — Get groups user is part of  
- POST /api/messages — Send message (direct or group)  
- GET  /uploads/... — Static file access (ensure CORS headers)

---

## Quick start (local)

1. Clone repo  
2. Install dependencies in both backend and frontend (`npm install`)  
3. Populate .env files (see examples above)  
4. Start backend: `npm run dev` (or `node server.js`)  
5. Start frontend: `npm run dev` (Vite default)  
6. Open frontend (default http://localhost:5173)

For deployment, ensure secure secrets, set appropriate storage for uploads, and configure a production email provider.

## Deployed URL

- Frontend: https://chatapp90.netlify.app/
- Backend API: https://chatapp-2tg3.onrender.com (set as FRONTEND/Vite env: VITE_API_URL)
- Socket server: wss://chatapp-2tg3.onrender.com (set as VITE_SOCKET_URL)
