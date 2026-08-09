# ⚽ Five-a-Side Manager

A full-stack web application for organizing 5-a-side football matches. Manage your squad, generate AI-balanced teams, track player stats, and get AI-powered insights — all in one place.

**Live:** [five-a-side-manager-frontend.vercel.app](https://five-a-side-manager-frontend.vercel.app) &nbsp;|&nbsp; **API:** Hosted on [Render](https://render.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | JWT access tokens + HTTP-only refresh token cookies with rotation |
| 👥 **Player Management** | Add players with 10 attributes, auto-calculated overall rating (1–99) |
| 📸 **Player Avatars** | Upload player photos stored on Cloudinary |
| ⚽ **Match Management** | Schedule matches, build rosters, generate balanced teams |
| 🤖 **AI Team Balancer** | Position-aware algorithm splits teams by overall rating |
| 🧠 **AI Player Report** | Gemini generates a natural-language performance summary per player |
| 🏆 **AI MVP Suggestion** | Gemini suggests the MVP when no one is manually flagged |
| 📅 **AI Conflict Detector** | Detects scheduling conflicts and suggests alternative time slots |
| 📊 **Stats Leaderboard** | Goals, assists, MVP counts aggregated across all completed matches |
| 🔥 **Performance Trends** | Players automatically tagged as `hot`, `stable`, or `cold` |
| 📧 **Email Notifications** | Match confirmation emails sent to the manager via Resend |
| 🔒 **Security** | Rate limiting, helmet, CORS, bcrypt passwords, security-question password reset |
| 📱 **PWA** | Offline support via Dexie.js, installable on mobile |
| 🌓 **Dual Theme** | Midnight Blue (dark) + Pitch Green (light) — persists across sessions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Render (Backend)                        │
│  Express.js + MongoDB Atlas + Gemini AI + Cloudinary        │
│                                                              │
│  /api/auth    /api/players    /api/matches                   │
│  /api/stats   /api/feedback   /api/admin   /api/notes        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (HTTPS)
┌──────────────────────────▼──────────────────────────────────┐
│                   Vercel (Frontend)                          │
│   Angular 21 PWA  ·  Tailwind CSS  ·  Dexie.js (offline)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 21, Tailwind CSS 3, Dexie.js, html-to-image |
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (access 15m) + HTTP-only refresh token (7d) with rotation |
| **AI** | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| **File Storage** | Cloudinary (player avatars) |
| **Email** | Resend SDK |
| **Testing** | Jest + Supertest + mongodb-memory-server (backend) · Jasmine/Karma (frontend) |
| **Deployment** | Render (backend + frontend unified) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/five-a-side-manager-backend.git
cd five-a-side-manager-backend
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
npm install
npm run dev
```
Server starts at `http://localhost:3000`

### 3. Frontend setup (separate terminal)
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
App opens at `http://localhost:4200`

---

## 🔧 Environment Variables

See [`backend/.env.example`](./backend/.env.example) for the full reference. Key variables:

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | 32-char random string for access tokens |
| `REFRESH_TOKEN_SECRET` | ✅ | 32-char random string for refresh tokens |
| `NODE_ENV` | ✅ | Set to `production` on Render |
| `GEMINI_API_KEY` | Optional | Enables AI features (2, 3, 4) |
| `CLOUDINARY_CLOUD_NAME` | Optional | Enables player avatar uploads |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary auth |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary auth |
| `RESEND_API_KEY` | Optional | Enables match creation emails |
| `EMAIL_FROM` | Optional | Verified sender address |
| `ADMIN_EMAIL` | Seed only | Used by `npm run seed-admin` |
| `ADMIN_PASSWORD` | Seed only | Used by `npm run seed-admin` |

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📡 API Reference

All routes require `Authorization: Bearer <accessToken>` unless marked **Public**.

### Auth — `/api/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns access token |
| POST | `/refresh` | Public | Rotate refresh token |
| POST | `/logout` | Private | Clear refresh token |
| PUT | `/profile` | Private | Update name/password |
| POST | `/security-question` | Public | Get user's security question |
| POST | `/verify-security-answer` | Public | Verify answer, get reset token |
| POST | `/reset-password` | Public | Reset password with token |

### Players — `/api/players`
| Method | Route | Description |
|---|---|---|
| GET | `/` | Get all players |
| POST | `/` | Create player |
| PUT | `/:id` | Update player |
| DELETE | `/:id` | Delete player |
| POST | `/:id/avatar` | Upload avatar (multipart/form-data) |
| GET | `/:id/ai-report` | Get Gemini AI performance report |

### Matches — `/api/matches`
| Method | Route | Description |
|---|---|---|
| GET | `/` | Get all matches |
| POST | `/` | Create match (includes conflict check) |
| GET | `/:id` | Get single match |
| PUT | `/:id` | Update match |
| DELETE | `/:id` | Delete match |
| POST | `/:id/generate` | Generate balanced teams |
| POST | `/:id/complete` | Complete match + update stats |

### Stats — `/api/stats`
| Method | Route | Description |
|---|---|---|
| GET | `/leaderboard` | Goals/assists/MVP leaderboard |
| GET | `/summary` | Dashboard overview (counts, top scorer, hot players) |

### Admin — `/api/admin` *(Admin only)*
| Method | Route | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/stats` | System-wide stats |
| GET | `/feedback` | All user feedback |

---

## 🧪 Running Tests

### Backend (Jest)
```bash
cd backend
npm test
```

Tests are in `backend/tests/`:
- `authController.test.js` — register, login, token flow
- `playerController.test.js` — CRUD, auth guards
- `matchController.test.js` — create, complete, generate teams
- `balancingService.test.js` — team balancing algorithm

### Frontend (Jasmine/Karma)
```bash
cd frontend
npm test -- --watch=false
```

---

## 🚢 Deploying to Render

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Set the **Root Directory** to `./` (the project root, not `/backend`).
4. Set **Build Command**: `cd backend && npm install && cd ../frontend && npm install --legacy-peer-deps && npm run build`
5. Set **Start Command**: `cd backend && npm start`
6. Add all environment variables from `.env.example` in the Render dashboard.
7. Click **Deploy**.

> **MongoDB Atlas Network Access:** Add `0.0.0.0/0` or Render's static IPs to Atlas → Network Access.

### Seed the Admin User
After first deploy, run from your local machine (with your production `.env`):
```bash
cd backend
npm run seed-admin
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

ISC License — see [LICENSE](./LICENSE) for details.
