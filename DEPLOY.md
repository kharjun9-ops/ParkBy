# ParkBy - Deployment Guide

## Quick Deploy to Railway (FREE) - Step by Step

### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Click "Login" → Sign in with **GitHub**

### Step 2: Deploy MySQL Database
1. Click **"New Project"**
2. Click **"Provision MySQL"**
3. Wait for it to deploy (takes 30 seconds)
4. Click on the MySQL service
5. Go to **"Variables"** tab
6. Copy these values (you'll need them):
   - `MYSQLHOST`
   - `MYSQLUSER` 
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

### Step 3: Set Up Database Tables
1. Click on MySQL service → **"Data"** tab
2. Click **"Connect"** or use the Query tab
3. Copy and paste everything from `database/schema.sql`
4. Run it to create tables

### Step 4: Deploy Backend
1. In the same Railway project, click **"New"** → **"GitHub Repo"**
2. Select your ParkBy repository
3. Railway will detect it's a Node.js app
4. Click on your backend service → **"Variables"** tab
5. Add these variables:
   ```
   DB_HOST = (paste MYSQLHOST value)
   DB_USER = (paste MYSQLUSER value)
   DB_PASSWORD = (paste MYSQLPASSWORD value)
   DB_NAME = (paste MYSQLDATABASE value)
   DB_PORT = (paste MYSQLPORT value)
   JWT_SECRET = parkby-secret-key-2026
   PORT = 5000
   ```
6. Railway will auto-deploy!

### Step 5: Get Your Backend URL
1. Click on backend service → **"Settings"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://parkby-production.up.railway.app`)

### Step 6: Update Frontend
Update the API URL in these files to your Railway URL:
- `frontend/login.js`
- `frontend/signup.js`  
- `frontend/user.js`
- `frontend/admin.js`

Change:
```javascript
const API = "http://localhost:5000";
```
To:
```javascript
const API = "https://your-railway-url.up.railway.app";
```

### Step 7: Deploy Frontend to GitHub Pages
1. Push frontend folder to GitHub
2. Go to repo → Settings → Pages
3. Select branch and /frontend folder
4. Save and wait for deployment

---

## Test Credentials
After running schema.sql, use:
- **Email:** admin@parkby.com
- **Password:** admin123

Or create a new account via Sign Up!

---

## Troubleshooting

**"Database error"** → Check your DB_* variables in Railway

**"Invalid token"** → Make sure JWT_SECRET is set

**CORS errors** → The backend is already configured for CORS

---

## Free Tier Limits
Railway Free Tier: $5/month credit (enough for small projects)
GitHub Pages: Unlimited for public repos
