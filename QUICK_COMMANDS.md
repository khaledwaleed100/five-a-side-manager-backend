# Quick Reference Commands

## Push to GitHub

### Backend
```bash
cd "c:\Users\khale\.gemini\antigravity\scratch\five-a-side-manager\backend"
git remote add origin https://github.com/YOUR_USERNAME/five-a-side-manager-backend.git
git branch -M main
git push -u origin main
```

### Frontend
```bash
cd "c:\Users\khale\.gemini\antigravity\scratch\five-a-side-manager\frontend"
git remote add origin https://github.com/YOUR_USERNAME/five-a-side-manager-frontend.git
git branch -M main
git push -u origin main
```

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
# Open http://localhost:4200
```

## Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -base64 32
```

## Get MongoDB Connection String

1. Go to https://www.mongodb.com/cloud/atlas
2. Create cluster → "Connect" → "Drivers"
3. Copy connection string
4. Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

## Check Git Status

```bash
cd backend && git status
cd ../frontend && git status
```

## Push Updates After Changes

```bash
# Backend
cd backend
git add .
git commit -m "Your message here"
git push

# Frontend
cd ../frontend
git add .
git commit -m "Your message here"
git push
```

## Build Frontend for Production

```bash
cd frontend
npm run build
# Output: dist/frontend/
```

## Test Backend Locally

```bash
cd backend
npm install
npm start
# GET http://localhost:3000/
```
