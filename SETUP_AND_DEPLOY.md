# Complete Setup & Deployment Guide

## ✅ What I've Done

1. **Fixed Backend Issues**:
   - Fixed missing export in `config/db.js`
   - Updated `environment.ts` to use Railway URL instead of Render placeholder
   - Added `.env.example` with all required variables documented

2. **Fixed Frontend Issues**:
   - Updated production environment configuration
   - Added `.env.example` for environment setup
   - Updated README with comprehensive guide

3. **Initialized Separate Git Repos**:
   - ✅ Backend: Git repository initialized and committed
   - ✅ Frontend: Git repository initialized and committed
   - ✅ Both have `.gitignore` files
   - ✅ Both have comprehensive READMEs

4. **Created Documentation**:
   - `DEPLOYMENT_STEPS.md` - Complete deployment walkthrough
   - Updated backend and frontend READMEs

---

## 📋 Step-by-Step Deployment

### Step 1: Create GitHub Repositories

**Create Backend Repo:**
1. Go to https://github.com/new
2. Repository name: `five-a-side-manager-backend`
3. Description: "Node.js backend for 5-a-side football manager"
4. **Do NOT initialize** with README/LICENSE/gitignore (we have them)
5. Click "Create repository"

**Create Frontend Repo:**
1. Go to https://github.com/new
2. Repository name: `five-a-side-manager-frontend`
3. Description: "Angular PWA frontend for 5-a-side football manager"
4. **Do NOT initialize** with README/LICENSE/gitignore (we have them)
5. Click "Create repository"

---

### Step 2: Push Backend to GitHub

Copy and paste these commands in order:

```bash
# Navigate to backend folder
cd "c:\Users\khale\.gemini\antigravity\scratch\five-a-side-manager\backend"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/five-a-side-manager-backend.git

# Ensure you're on main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

---

### Step 3: Push Frontend to GitHub

Copy and paste these commands in order:

```bash
# Navigate to frontend folder
cd "c:\Users\khale\.gemini\antigravity\scratch\five-a-side-manager\frontend"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/five-a-side-manager-frontend.git

# Ensure you're on main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

---

### Step 4: Deploy Backend to Railway

1. **Go to https://railway.app**
2. Click "Create a new project"
3. Select "Deploy from GitHub repo"
4. Search for `five-a-side-manager-backend`
5. Click "Connect"
6. Railway will auto-detect Node.js ✅

**Configure Environment Variables:**
1. Go to "Variables" tab
2. Add these variables:

| Variable | Value | How to Generate |
|----------|-------|-----------------|
| `MONGO_URI` | Your MongoDB Atlas string | See below ⬇️ |
| `JWT_SECRET` | Random 32-char string | `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | Random 32-char string | `openssl rand -base64 32` |
| `NODE_ENV` | `production` | Copy as-is |
| `FRONTEND_URL` | Will add later | After step 5 |

**Getting MongoDB URI:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign in / Create account
3. Create a cluster (free tier is fine)
4. Click "Connect"
5. Choose "Drivers"
6. Copy the connection string
7. Replace `<password>` and `<dbname>` with your values

**Deploy:**
1. Railway will auto-deploy on commit
2. Go to "Settings" → "Generate Domain"
3. Copy your Railway URL (e.g., `https://five-a-side-manager-backend-production.up.railway.app`)

---

### Step 5: Deploy Frontend to Vercel

1. **Go to https://vercel.com**
2. Click "Add New..." → "Project"
3. Search for `five-a-side-manager-frontend`
4. Click "Import"
5. Framework: Select **Angular** (auto-detected)
6. Build Command: `npm run build` ✅
7. Output Directory: `dist/frontend` ✅

**Set Environment Variables:**
1. Click "Environment Variables"
2. Add: `NG_APP_API_URL` = Your Railway backend URL from Step 4
   - Example: `https://five-a-side-manager-backend-production.up.railway.app`
3. Click "Deploy"

**Vercel will auto-deploy on commit!**

---

### Step 6: Update Backend CORS (If needed)

After frontend deployment, if you get CORS errors:

1. Go back to Railway backend dashboard
2. Add/Update `FRONTEND_URL` variable with your Vercel URL
   - Example: `https://five-a-side-manager-frontend.vercel.app`
3. Redeploy (manual redeploy button or push new commit)

---

## 🧪 Testing Your Deployment

1. **Test Backend API:**
   ```bash
   curl https://your-railway-url.up.railway.app/
   ```
   Should return server response

2. **Test Frontend:**
   - Open your Vercel URL in browser
   - Should load without CORS errors
   - Try logging in (test API connection)

3. **Check PWA:**
   - Open DevTools → Application tab
   - Service Worker should be registered
   - Install icon should appear in URL bar

---

## 🛠️ Troubleshooting

### Backend won't deploy
- ❌ Check `NODE_ENV` is set to `production`
- ❌ Verify `MONGO_URI` is correct (no typos)
- ❌ Check Railway logs (Deployments tab)

### Frontend won't deploy
- ❌ Check `NG_APP_API_URL` is correct in Vercel env vars
- ❌ Verify build command is `npm run build`
- ❌ Check output directory is `dist/frontend`

### API calls fail in production
- ❌ Backend CORS might be blocking Vercel domain
- ❌ Add frontend URL to backend `FRONTEND_URL` variable
- ❌ Check Network tab in DevTools for CORS errors

### PWA won't install
- ❌ Must be HTTPS (Vercel/Railway provide this ✅)
- ❌ Check manifest.webmanifest loads
- ❌ Check service worker in DevTools

---

## 📚 Project Structures

### Backend (`/backend`)
```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/           # Business logic
├── middlewares/          # Auth, rate limit, errors
├── models/               # MongoDB schemas
├── routes/               # API endpoints
├── services/             # Utilities (team balancing)
├── server.js             # Express app
├── package.json
├── .env                  # Environment variables
├── .env.example          # Template for .env
├── .gitignore
└── README.md
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── app/
│   │   ├── core/         # Services, guards
│   │   ├── features/     # Components (auth, matches, etc)
│   │   ├── shared/       # Utilities
│   │   └── app.routes.ts # Routing
│   ├── environments/     # API URLs
│   └── styles.css        # Global styles
├── angular.json          # Angular config
├── package.json
├── .env.local            # Environment variables
├── .env.example          # Template
├── vercel.json           # Vercel config
├── .gitignore
└── README.md
```

---

## 🔒 Security Checklist

- [ ] `JWT_SECRET` is random and long
- [ ] `MONGO_URI` doesn't contain database name in URL
- [ ] `.env` files are in `.gitignore` ✅
- [ ] Backend CORS allows only your frontend URL
- [ ] Both apps use HTTPS
- [ ] Rate limiting is enabled on backend

---

## 📞 Environment Variables Summary

### Backend `.env`
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
PORT=3000
JWT_SECRET=<random-32-char-string>
REFRESH_TOKEN_SECRET=<random-32-char-string>
NODE_ENV=production
FRONTEND_URL=https://five-a-side-manager-frontend.vercel.app
```

### Frontend Environment Variables (Vercel)
```
NG_APP_API_URL=https://five-a-side-manager-backend-production.up.railway.app
```

---

## ✨ Features Now Ready for Production

✅ User authentication with JWT  
✅ MongoDB database  
✅ Team balancing algorithm  
✅ Admin dashboard  
✅ Match management  
✅ Player management  
✅ PWA with offline support  
✅ Responsive design  
✅ Rate limiting  
✅ Security headers (Helmet)  

---

## 📖 Need Help?

- Backend issues: Check `backend/README.md`
- Frontend issues: Check `frontend/README.md`
- General deployment: See `DEPLOYMENT_STEPS.md`
