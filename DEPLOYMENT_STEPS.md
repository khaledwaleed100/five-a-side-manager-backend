# Deployment Guide: Backend & Frontend Separated

## Step 1: Create GitHub Repositories

### Backend Repository
1. Go to https://github.com/new
2. Create a repository named: `five-a-side-manager-backend`
3. Don't initialize with README (we have one)
4. Click Create

### Frontend Repository
1. Go to https://github.com/new
2. Create a repository named: `five-a-side-manager-frontend`
3. Don't initialize with README (we have one)
4. Click Create

---

## Step 2: Push Backend to GitHub

```bash
cd backend
git remote add origin https://github.com/YOUR_USERNAME/five-a-side-manager-backend.git
git branch -M main
git push -u origin main
```

---

## Step 3: Push Frontend to GitHub

```bash
cd ../frontend
git remote add origin https://github.com/YOUR_USERNAME/five-a-side-manager-frontend.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy Backend to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `five-a-side-manager-backend`
4. Railway will auto-detect Node.js
5. Go to Variables tab and add:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `REFRESH_TOKEN_SECRET`: Generate with `openssl rand -base64 32`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your Vercel frontend URL (add later after frontend deployment)

6. Once deployed, go to Settings → Generate Domain
7. Copy the public URL (e.g., `https://five-a-side-manager-backend-production.up.railway.app`)

---

## Step 5: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Select `five-a-side-manager-frontend`
4. Framework: **Angular**
5. Build Command: `npm run build`
6. Output Directory: `dist/frontend`
7. Environment Variables:
   - `NG_APP_API_URL`: Your Railway backend URL from Step 4

8. Click Deploy

---

## Step 6: Update Backend CORS

After frontend deployment, go back to Railway backend:
1. Add the Vercel frontend URL to environment variables if needed
2. Redeploy backend

---

## Post-Deployment Checklist

- [ ] Backend URL works in browser
- [ ] Frontend loads successfully
- [ ] Can login/register
- [ ] Dashboard loads data
- [ ] Admin panel works
- [ ] PWA features enabled (offline mode, install)
