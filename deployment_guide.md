# Deployment Guide: 5-A-Side Manager

Follow these steps to deploy your full-stack application to production.

## 1. Backend Deployment (Node.js & MongoDB)

We recommend using **Render**, **Railway**, or **Vercel** for the backend.

### Prerequisites

- A **MongoDB Atlas** account (free tier is fine).
- Get your connection string (e.g., `mongodb+srv://...`).

### Steps

1. **Prepare Environment Variables**:
   Set the following variables in your hosting provider's dashboard:
   - `PORT`: `3000` (or leave as default)
   - `MONGO_URI`: Your MongoDB Atlas string.
   - `JWT_SECRET`: A long random string (e.g., `openssl rand -base64 32`).
   - `REFRESH_TOKEN_SECRET`: Another long random string.
   - `NODE_ENV`: `production`

2. **Deploy to Render/Railway**:
   - Connect your GitHub repository.
   - Set Build Command: `npm install` (in the `backend` folder).
   - Set Start Command: `node server.js`.

---

## 2. Frontend Deployment (Angular PWA)

We recommend **Vercel** or **Firebase Hosting**.

### Steps

1. **Update Production Environment**:
   Modify `frontend/src/environments/environment.prod.ts`:

   ```typescript
   export const environment = {
     production: true,
     apiUrl: "https://your-backend-url.com", // Use your deployed backend URL
   };
   ```

2. **Build for Production**:
   Run the following command in the `frontend` folder:

   ```bash
   npm run build --prod
   ```

   This generates a `dist/` folder containing the static files and the Service Worker.

3. **Deploy to Vercel**:
   - Connect your GitHub repository.
   - Framework Preset: **Angular**.
   - Output Directory: `dist/frontend/browser` (verify this path in your `angular.json`).
   - Build Command: `npm run build`.

---

## 3. Post-Deployment Checklist

- [ ] **CORS**: Ensure your backend `server.js` allows requests from your frontend domain.
- [ ] **PWA**: Verify the manifest and service worker load correctly via Chrome DevTools -> Application tab.
- [ ] **HTTPS**: Ensure both are served over HTTPS for the PWA features to work.
