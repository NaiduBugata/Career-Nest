# 🚀 Career Nest - Complete Deployment Guide

**Deploy your Career Nest application to production in ~60 minutes**

---

## 📋 Table of Contents
1. [MongoDB Atlas Setup](#step-1-mongodb-atlas-setup-10-min)
2. [Backend Deployment (Render.com)](#step-2-backend-deployment-rendercom-15-min)
3. [Frontend Deployment (Vercel)](#step-3-frontend-deployment-vercel-10-min)
4. [Testing & Verification](#step-4-testing--verification-10-min)

---

## ⚡ Quick Overview

| Step | Platform | Time | Free Tier |
|------|----------|------|-----------|
| 1 | MongoDB Atlas | 10 min | ✅ Yes (512MB) |
| 2 | Render.com (Backend) | 15 min | ✅ Yes |
| 3 | Vercel (Frontend) | 10 min | ✅ Yes |
| 4 | Testing | 10 min | - |

**Total Time: ~45-60 minutes**

---

## STEP 1: MongoDB Atlas Setup (10 min)

### 1.1 Create MongoDB Atlas Account

**Go to:** https://www.mongodb.com/cloud/atlas/register

1. Click **"Try Free"**
2. Sign up with:
   - **Email:** your-email@example.com
   - **Password:** Create strong password
   - Click **"Create your Atlas account"**
3. **Verify your email** (check inbox)

### 1.2 Create Free Cluster

1. After login, click **"Build a Database"**
2. Choose **"M0 FREE"** (should be highlighted)
   - Provider: **AWS** (recommended)
   - Region: Choose closest to you:
     - India: **Mumbai (ap-south-1)**
     - US: **N. Virginia (us-east-1)**
     - Europe: **Ireland (eu-west-1)**
   - Cluster Name: **career-nest-cluster**
3. Click **"Create Deployment"**
4. Wait 3-5 minutes for cluster creation

### 1.3 Create Database User

A popup will appear:

1. **Security Quickstart:**
   - Username: `careernest_admin`
   - Click **"Autogenerate Secure Password"**
   - **⚠️ COPY AND SAVE THIS PASSWORD!** (You'll need it)
   - Click **"Create Database User"**

### 1.4 Configure Network Access

Still in the popup:

1. Under **"Where would you like to connect from?"**
2. Click **"My Local Environment"**
3. Click **"Add My Current IP Address"**
4. Then click **"Add Entry"** again
5. Choose **"Allow Access from Anywhere"**
   - IP Address: `0.0.0.0/0`
   - Description: `Allow all`
6. Click **"Add Entry"**
7. Click **"Finish and Close"**

### 1.5 Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Drivers"**
4. Select:
   - Driver: **Node.js**
   - Version: **5.5 or later**
5. **Copy the connection string**, it looks like:
   ```
   mongodb+srv://careernest_admin:<password>@career-nest-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Modify it:**
   - Replace `<password>` with the password you saved earlier
   - Add database name `/career-nest` before the `?`
   
   **Final format:**
   ```
   mongodb+srv://careernest_admin:YOUR_PASSWORD@career-nest-cluster.xxxxx.mongodb.net/career-nest?retryWrites=true&w=majority
   ```

7. **Save this connection string!** (You'll use it in Step 2)

✅ **MongoDB Atlas Setup Complete!**

---

## STEP 2: Backend Deployment (Render.com) (15 min)

### 2.1 Create Render Account

**Go to:** https://render.com

1. Click **"Get Started"**
2. Choose **"Sign up with GitHub"**
3. **Authorize Render** to access your GitHub
4. Select your repositories or choose "All repositories"
5. Click **"Install"**

### 2.2 Create Web Service

1. After login, click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"** → **"Next"**
4. Find **"Career-Nest"** repository
5. Click **"Connect"**

### 2.3 Configure Web Service

Fill in the settings:

**Basic Settings:**
- **Name:** `career-nest-api` (or any name you prefer)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select **"Free"** plan

### 2.4 Add Environment Variables

Scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** and add these **one by one:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your connection string from Step 1.5 |
| `JWT_SECRET` | Generate below ⬇️ |
| `FRONTEND_URL` | `http://localhost:5173` (will update later) |

**To Generate JWT_SECRET:**

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output (128-character string) and use it as `JWT_SECRET`

**Example of environment variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://careernest_admin:MyPass123@career-nest-cluster.abc123.mongodb.net/career-nest?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6....(128 characters)
FRONTEND_URL=http://localhost:5173
```

### 2.5 Deploy Backend

1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)
4. You'll see logs in real-time

**Watch for:**
- ✅ `Installing dependencies`
- ✅ `Build successful`
- ✅ `Server is running on port XXXX`
- ✅ `Deployment successful`

### 2.6 Get Backend URL

After deployment succeeds:

1. At the top, you'll see your service URL:
   ```
   https://career-nest-api.onrender.com
   ```
2. **Copy this URL!** (You'll need it for Step 3)

### 2.7 Test Backend

Click on your service URL or test the health endpoint:

```
https://career-nest-api.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-10-31T...",
  "environment": "production"
}
```

✅ **Backend Deployment Complete!**

---

## STEP 3: Frontend Deployment (Vercel) (10 min)

### 3.1 Update Frontend API URL

First, we need to update the frontend to use the deployed backend URL.

**In VS Code, open PowerShell terminal:**

```powershell
cd "C:\Users\Sarojini Naidu\Desktop\Career Nest\frontend"
```

**Create environment file:**

```powershell
echo 'VITE_API_URL=https://career-nest-api.onrender.com/api' > .env.production
```

**Replace `career-nest-api.onrender.com` with YOUR actual Render URL!**

### 3.2 Search and Replace API URLs

We need to find all files that use `localhost:8000` and update them.

**PowerShell command to find files:**

```powershell
Get-ChildItem -Recurse -Include *.jsx,*.js | Select-String "localhost:8000" | Select-Object Path -Unique
```

**Common files to update:**
- `src/pages/AuthForm.jsx`
- `src/pages/Admin_Dashboard.jsx`
- `src/pages/Organization_Dashboard.jsx`
- `src/pages/Student_Dashboard.jsx`
- `src/pages/Courses.jsx`

**In each file, change:**

```javascript
// OLD (find this):
const response = await axios.post('http://localhost:8000/api/auth/login', ...)

// NEW (replace with this):
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const response = await axios.post(`${API_URL}/auth/login`, ...)
```

**Or simpler - add this at the top of each file:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

Then replace all instances of `'http://localhost:8000/api'` with `API_BASE_URL`

### 3.3 Commit and Push Changes

```powershell
cd "C:\Users\Sarojini Naidu\Desktop\Career Nest"
git add .
git commit -m "Update API URLs for production"
git push
```

### 3.4 Create Vercel Account

**Go to:** https://vercel.com/signup

1. Click **"Continue with GitHub"**
2. **Authorize Vercel** to access GitHub
3. Select your Career-Nest repository
4. Click **"Install"**

### 3.5 Deploy Frontend

1. After authorization, you'll see **"Import Git Repository"**
2. Find **"Career-Nest"** and click **"Import"**
3. **Configure Project:**
   - **Project Name:** `career-nest-frontend`
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables:**
   Click **"Environment Variables"** dropdown
   
   Add:
   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://career-nest-api.onrender.com/api` |
   
   (Use YOUR actual Render URL!)

5. Click **"Deploy"**
6. Wait 2-3 minutes

### 3.6 Get Frontend URL

After deployment:

1. You'll see: **"Congratulations! Your project has been deployed!"**
2. Your URL will be:
   ```
   https://career-nest-frontend.vercel.app
   ```
3. **Copy this URL!**

### 3.7 Update Backend CORS

Now we need to tell the backend to allow requests from the frontend.

**Go back to Render.com:**

1. Open your **career-nest-api** service
2. Go to **"Environment"** tab (left sidebar)
3. Find `FRONTEND_URL` variable
4. Click **"Edit"**
5. Change value from `http://localhost:5173` to:
   ```
   https://career-nest-frontend.vercel.app
   ```
   (Use YOUR actual Vercel URL!)
6. Click **"Save Changes"**
7. Service will automatically redeploy (wait 2-3 minutes)

✅ **Frontend Deployment Complete!**

---

## STEP 4: Testing & Verification (10 min)

### 4.1 Test Backend

**Open in browser:**
```
https://career-nest-api.onrender.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "uptime": 234.56,
  "timestamp": "2025-10-31T12:34:56.789Z",
  "environment": "production"
}
```

### 4.2 Test Frontend

**Open in browser:**
```
https://career-nest-frontend.vercel.app
```

**You should see:**
- ✅ Landing page loads
- ✅ No console errors (press F12 to check)
- ✅ Can navigate to Role selection

### 4.3 Test User Registration

1. **On frontend, click "Student" role**
2. **Click "Register"**
3. **Fill in:**
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123!`
   - Full Name: `Test User`
4. **Click "Register"**

**Expected:** ✅ Registration successful, redirected to dashboard

### 4.4 Test Login

1. **Go back to landing page**
2. **Click "Student" role**
3. **Click "Login"**
4. **Enter:**
   - Username: `testuser`
   - Password: `Test123!`
5. **Click "Login"**

**Expected:** ✅ Login successful, see dashboard

### 4.5 Check Browser Console

Press **F12** → **Console tab**

**Should NOT see:**
- ❌ CORS errors
- ❌ Network errors
- ❌ 404 errors

**Should see:**
- ✅ Successful API calls (200 status)
- ✅ Data loading properly

### 4.6 Test Other Features

Try:
- ✅ Create announcement (Organization role)
- ✅ View courses
- ✅ Register for event
- ✅ View dashboard stats

---

## 🎉 DEPLOYMENT COMPLETE!

### Your Live URLs:

**Frontend (Users access this):**
```
https://career-nest-frontend.vercel.app
```

**Backend (API):**
```
https://career-nest-api.onrender.com
```

**MongoDB:**
```
Hosted on MongoDB Atlas (M0 Free Tier)
```

---

## 📊 Post-Deployment Checklist

- [ ] Backend health check working
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays data
- [ ] API calls successful (check Network tab)
- [ ] No CORS errors
- [ ] Environment variables set correctly
- [ ] Database connected successfully
- [ ] All features tested

---

## 🔧 Common Issues & Solutions

### Issue 1: "Application Error" on Render

**Solution:**
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for error messages
5. Common fix: Check environment variables are correct

### Issue 2: CORS Errors

**Solution:**
```powershell
# Update FRONTEND_URL on Render
# Make sure it matches your Vercel URL exactly
# No trailing slash!
FRONTEND_URL=https://career-nest-frontend.vercel.app
```

### Issue 3: MongoDB Connection Failed

**Solution:**
1. Check MongoDB Atlas
2. Go to Network Access
3. Ensure `0.0.0.0/0` is whitelisted
4. Verify connection string has correct password
5. Check database name is included in URL

### Issue 4: Frontend Can't Reach Backend

**Solution:**
1. Check `.env.production` file exists in frontend
2. Verify `VITE_API_URL` is set correctly
3. Rebuild frontend on Vercel:
   - Go to Vercel dashboard
   - Click "Deployments"
   - Click "..." → "Redeploy"

### Issue 5: Environment Variables Not Working

**Solution on Render:**
1. Click "Environment" tab
2. Verify all variables are present
3. Click "Save Changes"
4. Wait for automatic redeploy

**Solution on Vercel:**
1. Go to project settings
2. Click "Environment Variables"
3. Add/update variables
4. Redeploy from "Deployments" page

---

## 💰 Free Tier Limitations

### Render.com Free Tier:
- ⚠️ **Service sleeps after 15 min of inactivity**
- ⏱️ First request after sleep: **30-50 seconds**
- 💾 **750 hours/month** (enough for one service)
- 🔄 **Auto-deploys** on git push

### Vercel Free Tier:
- ✅ **No sleep** - Always fast
- 🚀 **100 GB bandwidth/month**
- ⚡ **Unlimited deployments**
- 🌐 **Global CDN**

### MongoDB Atlas Free Tier:
- 💾 **512 MB storage**
- 📊 **Good for ~1000 users**
- ✅ **No sleep**
- 🔄 **Automatic backups**

---

## 📈 Monitoring Your App

### Render Dashboard
- View logs in real-time
- Monitor deployments
- Check service status
- View metrics (CPU, Memory)

### Vercel Dashboard
- Analytics
- Deployment history
- Performance insights
- Error tracking

### MongoDB Atlas
- Database size
- Connection count
- Query performance
- Backup status

---

## 🔐 Security Best Practices

✅ **Already Implemented:**
- Strong JWT secrets
- Environment variables
- CORS protection
- MongoDB network restrictions
- HTTPS everywhere (automatic)
- Rate limiting
- Password hashing

❗ **Additional Recommendations:**
- Set up database backups
- Monitor error logs
- Regular dependency updates
- Use secrets management
- Enable 2FA on all accounts

---

## 🚀 Next Steps

1. **Share Your App:**
   ```
   https://career-nest-frontend.vercel.app
   ```

2. **Custom Domain (Optional):**
   - Buy domain (Namecheap, GoDaddy)
   - Add to Vercel project settings
   - Update DNS records

3. **Monitoring & Alerts:**
   - Set up UptimeRobot (free)
   - Get alerts if site goes down

4. **Continuous Deployment:**
   - Already set up!
   - Just push to GitHub:
     ```powershell
     git add .
     git commit -m "New feature"
     git push
     ```
   - Auto-deploys to Render & Vercel

---

## 📞 Support Links

**Render:**
- Docs: https://render.com/docs
- Status: https://status.render.com

**Vercel:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**MongoDB Atlas:**
- Docs: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

---

## 🎊 Congratulations!

Your Career Nest application is now **LIVE** and accessible worldwide!

- ✅ Professional deployment
- ✅ Scalable infrastructure
- ✅ Automatic deployments
- ✅ Free hosting (with limitations)
- ✅ Production-ready

**Share your app and start helping students build their careers! 🚀**

---

*Deployment Guide - Last Updated: October 31, 2025*
