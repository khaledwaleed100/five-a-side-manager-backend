# Deployment Guide: 5-A-Side Manager (Unified Deployment)

We have simplified the deployment process! Instead of deploying the frontend and backend separately (which causes CORS and cookie issues), we will deploy them together as a **single application** on Render.

## Prerequisites

1. A **MongoDB Atlas** account (free tier is fine).
2. A **Render.com** account (free tier is fine).
3. A GitHub repository containing the entire `five-a-side-manager` project.

## Step 1: Push to GitHub
Ensure both the `frontend` and `backend` folders are pushed to your GitHub repository in the main root folder.

## Step 2: Deploy to Render

1. Go to Render.com and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service with the following settings:
   - **Name**: `five-a-side-manager`
   - **Environment**: `Node`
   - **Root Directory**: `backend` (⚠️ **CRITICAL STEP**)
   - **Build Command**: `npm run build`
     *(This will install backend dependencies, then automatically switch to the frontend, install frontend dependencies, and build the Angular app.)*
   - **Start Command**: `npm start`
     *(This starts the Express server, which will now also serve your Angular app!)*

## Step 3: Environment Variables
Add the following Environment Variables in the Render dashboard for your service:

- `PORT`: `3000` (Optional)
- `MONGO_URI`: Your MongoDB Atlas connection string.
- `JWT_SECRET`: A secure random string (e.g., `my_super_secret_jwt_key_123`).
- `REFRESH_TOKEN_SECRET`: A secure random string.
- `NODE_ENV`: `production`

## Step 4: Done!
Once Render finishes building, your app will be live at `https://five-a-side-manager-xxxxx.onrender.com`.

### Why is this better?
- **No CORS Issues**: The frontend and backend are on the exact same domain.
- **No Cross-Origin Cookies**: Secure HttpOnly cookies work flawlessly without complex same-site proxy configurations.
- **One Build Process**: You click "Deploy" once, and it builds everything.
