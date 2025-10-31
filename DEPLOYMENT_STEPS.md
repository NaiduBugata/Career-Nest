# 🚀 Career Nest - Step-by-Step Deployment Guide

This guide will walk you through deploying Career Nest to production, step by step.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#step-1-mongodb-atlas-setup)
3. [Backend Deployment (Heroku)](#step-2-backend-deployment-heroku)
4. [Frontend Deployment (Vercel)](#step-3-frontend-deployment-vercel)
5. [Alternative Deployment Options](#alternative-deployment-options)
6. [Post-Deployment Testing](#step-4-post-deployment-testing)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Git installed and configured
- [ ] Node.js (v18+) installed
- [ ] A GitHub account
- [ ] A credit/debit card (for account verification - most platforms have free tiers)
- [ ] Your Career Nest project ready

**Estimated Time:** 45-60 minutes for complete deployment

---

## STEP 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account

1. **Go to MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Click "Try Free"

2. **Sign Up:**
   ```
   Email: your-email@example.com
   Password: Create a strong password
   First Name: Your name
   Last Name: Your last name
   ```
   - Click "Create your Atlas account"
   - Verify your email address

3. **Complete Setup:**
   - Click the verification link in your email
   - Log in to MongoDB Atlas

### 1.2 Create a Free Cluster

1. **Choose Deployment Option:**
   - Click "Build a Database"
   - Select **"M0 FREE"** (Shared cluster)
   - Click "Create"

2. **Configure Cluster:**
   ```
   Provider: AWS (recommended) or Google Cloud or Azure
   Region: Choose closest to your users
           (e.g., Mumbai for India, N. Virginia for US)
   Cluster Name: career-nest-cluster
   ```
   - Click "Create Cluster"
   - Wait 3-5 minutes for cluster creation

### 1.3 Create Database User

1. **Security Quickstart - Create User:**
   ```
   Username: careernest_admin
   Password: Click "Autogenerate Secure Password"
   ```
   - **IMPORTANT:** Copy and save this password securely!
   - Click "Create User"

2. **Or Create User Later:**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password
   - Set "Database User Privileges" to "Read and write to any database"
   - Click "Add User"

### 1.4 Configure Network Access

1. **Add IP Address:**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere"
   ```
   IP Address: 0.0.0.0/0
   Comment: Allow from anywhere
   ```
   - Click "Confirm"

   ⚠️ **Security Note:** For production, restrict to specific IPs later

### 1.5 Get Connection String

1. **Get Connection String:**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Click "Connect your application"
   - **Driver:** Node.js
   - **Version:** 5.5 or later
   
2. **Copy Connection String:**
   ```
   mongodb+srv://careernest_admin:<password>@career-nest-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   
3. **Modify Connection String:**
   - Replace `<password>` with your database user password
   - Add database name after `.net/`:
   ```
   mongodb+srv://careernest_admin:YOUR_PASSWORD@career-nest-cluster.xxxxx.mongodb.net/career-nest?retryWrites=true&w=majority
   ```

4. **Save This Connection String** - You'll need it for deployment!

---

## STEP 2: Backend Deployment (Heroku)

### 2.1 Prepare Your Project

1. **Open PowerShell in Your Project:**
   ```powershell
   cd "C:\Users\Sarojini Naidu\Desktop\Career Nest"
   ```

2. **Initialize Git Repository (if not already done):**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit for deployment"
   ```

3. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Repository name: `career-nest`
   - Description: "Student Career Development Platform"
   - Make it **Private** (recommended)
   - Click "Create repository"

4. **Push to GitHub:**
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/career-nest.git
   git branch -M main
   git push -u origin main
   ```

### 2.2 Install Heroku CLI

1. **Download Heroku CLI:**
   - Visit: https://devcenter.heroku.com/articles/heroku-cli
   - Download for Windows (64-bit installer)
   - Run the installer
   - Follow installation wizard

2. **Verify Installation:**
   ```powershell
   heroku --version
   ```
   Should show: `heroku/x.x.x win32-x64 node-vXX.X.X`

3. **Restart PowerShell** if command not found

### 2.3 Create Heroku Account & App

1. **Sign Up for Heroku:**
   - Visit: https://signup.heroku.com/
   - Fill in details and verify email
   - **No credit card required for free tier**

2. **Login to Heroku:**
   ```powershell
   heroku login
   ```
   - Press any key to open browser
   - Click "Log In"
   - Close browser and return to terminal

3. **Create Heroku App for Backend:**
   ```powershell
   cd backend
   heroku create career-nest-api
   ```
   
   **Note:** If name is taken, try:
   ```powershell
   heroku create career-nest-api-YOUR-INITIALS
   # Example: heroku create career-nest-api-sn
   ```

4. **Your Backend URL will be:**
   ```
   https://career-nest-api.herokuapp.com
   ```
   **Save this URL!**

### 2.4 Generate Strong JWT Secret

1. **Generate Random Secret:**
   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   
2. **Copy the output** (128-character string)
   Example: `a1b2c3d4e5f6...` (64 bytes = 128 hex characters)

### 2.5 Configure Environment Variables

1. **Set Environment Variables on Heroku:**
   ```powershell
   # Set Node Environment
   heroku config:set NODE_ENV=production

   # Set MongoDB URI (replace with your connection string)
   heroku config:set MONGODB_URI="mongodb+srv://careernest_admin:YOUR_PASSWORD@career-nest-cluster.xxxxx.mongodb.net/career-nest?retryWrites=true&w=majority"

   # Set JWT Secret (use the generated secret from step 2.4)
   heroku config:set JWT_SECRET="your-128-character-secret-from-step-2.4"

   # Set Frontend URL (we'll update this later after frontend deployment)
   heroku config:set FRONTEND_URL="http://localhost:5173"
   ```

2. **Verify Configuration:**
   ```powershell
   heroku config
   ```

### 2.6 Prepare Backend for Deployment

1. **Ensure package.json has start script:**
   ```powershell
   # Check if start script exists
   cat package.json | Select-String "start"
   ```
   
   Should contain:
   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

2. **Create Procfile (tells Heroku how to run the app):**
   ```powershell
   # Create Procfile in backend directory
   echo "web: node server.js" > Procfile
   ```

3. **Commit Changes:**
   ```powershell
   git add .
   git commit -m "Add Procfile for Heroku deployment"
   ```

### 2.7 Deploy Backend to Heroku

1. **Add Heroku Remote:**
   ```powershell
   heroku git:remote -a career-nest-api
   # Or if you used custom name: heroku git:remote -a career-nest-api-YOUR-INITIALS
   ```

2. **Deploy Backend Only (Subtree Push):**
   ```powershell
   # Go back to root directory
   cd ..
   
   # Push only backend folder to Heroku
   git subtree push --prefix backend heroku main
   ```

3. **Wait for Deployment** (2-5 minutes)
   You'll see:
   ```
   remote: -----> Build succeeded!
   remote: -----> Launching...
   remote:        Released v1
   remote:        https://career-nest-api.herokuapp.com/ deployed to Heroku
   ```

### 2.8 Verify Backend Deployment

1. **Check App Status:**
   ```powershell
   cd backend
   heroku ps
   ```
   Should show: `web.1: up`

2. **View Logs:**
   ```powershell
   heroku logs --tail
   ```
   Look for: "Server is running on port XXXX"

3. **Test API:**
   ```powershell
   # Test health endpoint
   Invoke-RestMethod https://career-nest-api.herokuapp.com/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "uptime": 123.45,
     "timestamp": "2025-10-31T...",
     "environment": "production"
   }
   ```

4. **Open in Browser:**
   ```powershell
   heroku open
   ```

**✅ Backend Deployed Successfully!**

---

## STEP 3: Frontend Deployment (Vercel)

### 3.1 Update Frontend API URL

1. **Find API Configuration:**
   ```powershell
   cd ../frontend
   ```

2. **Search for API URL in code:**
   ```powershell
   # Find files with API URLs
   Get-ChildItem -Recurse -Include *.jsx,*.js | Select-String "localhost:8000" | Select-Object Path -Unique
   ```

3. **Create API Configuration File:**
   ```powershell
   # Create config file
   New-Item -Path "src\config.js" -ItemType File -Force
   ```

4. **Edit `src/config.js`:**
   ```javascript
   const config = {
     API_URL: import.meta.env.VITE_API_URL || 'https://career-nest-api.herokuapp.com/api'
   };

   export default config;
   ```

5. **Update API Calls:**
   You need to update files that call the API. Common files:
   - `src/pages/AuthForm.jsx`
   - `src/pages/Admin_Dashboard.jsx`
   - `src/pages/Organization_Dashboard.jsx`
   - `src/pages/Student_Dashboard.jsx`
   - `src/pages/Courses.jsx`

   **Example change in AuthForm.jsx:**
   ```javascript
   // OLD:
   const response = await axios.post('http://localhost:8000/api/auth/login', ...)

   // NEW:
   import config from '../config';
   const response = await axios.post(`${config.API_URL}/auth/login`, ...)
   ```

6. **Or use environment variable (Recommended):**
   
   Create `.env.production` in frontend folder:
   ```env
   VITE_API_URL=https://career-nest-api.herokuapp.com/api
   ```

   Update all API calls to use:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
   ```

### 3.2 Install Vercel CLI

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Verify Installation:**
   ```powershell
   vercel --version
   ```

### 3.3 Sign Up for Vercel

1. **Sign Up:**
   - Visit: https://vercel.com/signup
   - Sign up with GitHub (recommended) or email
   - Authorize Vercel to access your GitHub

2. **Login via CLI:**
   ```powershell
   vercel login
   ```
   - Choose your signup method
   - Verify in browser

### 3.4 Deploy Frontend to Vercel

1. **Commit Frontend Changes:**
   ```powershell
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

2. **Deploy to Vercel:**
   ```powershell
   # Make sure you're in frontend directory
   cd frontend
   
   # Deploy
   vercel --prod
   ```

3. **Follow Prompts:**
   ```
   Set up and deploy "frontend"? [Y/n] y
   Which scope? [Your Account]
   Link to existing project? [y/N] N
   What's your project's name? career-nest-frontend
   In which directory is your code located? ./
   Want to override settings? [y/N] N
   ```

4. **Wait for Deployment** (2-3 minutes)

5. **Your Frontend URL will be:**
   ```
   https://career-nest-frontend.vercel.app
   ```
   Or custom domain if you have one.

### 3.5 Update Backend CORS Settings

1. **Update Heroku Backend Environment:**
   ```powershell
   cd ../backend
   
   # Update FRONTEND_URL with your Vercel URL
   heroku config:set FRONTEND_URL="https://career-nest-frontend.vercel.app"
   ```

2. **Verify Update:**
   ```powershell
   heroku config
   ```

3. **Restart Heroku App:**
   ```powershell
   heroku restart
   ```

**✅ Frontend Deployed Successfully!**

---

## STEP 4: Post-Deployment Testing

### 4.1 Test Complete Flow

1. **Open Your Frontend:**
   ```
   https://career-nest-frontend.vercel.app
   ```

2. **Test User Registration:**
   - Click on "Student" or "Organization"
   - Click "Register"
   - Fill in details
   - Submit

3. **Test Login:**
   - Use registered credentials
   - Verify you can log in

4. **Test Dashboard:**
   - Verify dashboard loads
   - Check if data displays correctly

5. **Test API Endpoints:**
   - Try creating an event
   - Try posting an announcement
   - Try enrolling in a course

### 4.2 Check for Errors

1. **Check Backend Logs:**
   ```powershell
   cd backend
   heroku logs --tail
   ```
   Look for any errors

2. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

### 4.3 Monitor Performance

1. **Heroku Dashboard:**
   - Visit: https://dashboard.heroku.com/apps/career-nest-api
   - Check metrics, logs, and dyno status

2. **Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Check deployment status and analytics

---

## Alternative Deployment Options

### Option A: Railway.app (Easier Alternative to Heroku)

#### Deploy Backend to Railway:

1. **Sign Up:**
   - Visit: https://railway.app
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your `career-nest` repository
   - Choose `backend` folder

3. **Add MongoDB Plugin:**
   - Click "New" → "Database" → "MongoDB"
   - Railway will create a MongoDB instance
   - Get connection string from variables

4. **Set Environment Variables:**
   - Go to your backend service
   - Click "Variables" tab
   - Add:
     ```
     NODE_ENV=production
     JWT_SECRET=your-secret
     FRONTEND_URL=your-frontend-url
     MONGODB_URI=mongodb://... (auto-filled by Railway)
     ```

5. **Deploy:**
   - Railway auto-deploys on git push
   - Get your backend URL from dashboard

### Option B: Render.com (Free Tier Alternative)

#### Deploy Backend to Render:

1. **Sign Up:**
   - Visit: https://render.com
   - Sign up with GitHub

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Choose `career-nest` repo

3. **Configure Service:**
   ```
   Name: career-nest-api
   Region: Choose nearest
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables:**
   - Click "Advanced"
   - Add environment variables (same as Heroku)

5. **Create Web Service:**
   - Click "Create Web Service"
   - Wait for deployment

6. **Free Tier Note:**
   - Free tier sleeps after 15 min of inactivity
   - First request after sleep takes 30+ seconds

### Option C: Full Stack on Vercel

You can deploy both frontend and backend on Vercel:

1. **Backend as Serverless Functions:**
   - Convert Express routes to Vercel serverless functions
   - Create `api/` folder in root
   - More complex, requires code restructuring

---

## Common Issues & Solutions

### Issue 1: "Application Error" on Heroku

**Solution:**
```powershell
# Check logs
heroku logs --tail

# Common fixes:
# 1. Ensure PORT environment variable is used
# In server.js: const PORT = process.env.PORT || 8000

# 2. Restart dyno
heroku restart

# 3. Check build logs
heroku logs --source app
```

### Issue 2: CORS Errors

**Solution:**
```powershell
# Update FRONTEND_URL
heroku config:set FRONTEND_URL="https://your-exact-frontend-url.vercel.app"

# Ensure no trailing slash
# Ensure protocol (https://) is included
```

### Issue 3: MongoDB Connection Failed

**Solution:**
1. Check MongoDB Atlas IP whitelist (0.0.0.0/0)
2. Verify connection string format
3. Ensure password doesn't have special characters (encode if needed)
4. Check database user has correct permissions

### Issue 4: Environment Variables Not Working

**Solution:**
```powershell
# Verify variables are set
heroku config

# Set variables in quotes
heroku config:set VAR_NAME="value with spaces"

# Restart app after setting variables
heroku restart
```

### Issue 5: Build Failed

**Solution:**
```powershell
# Check package.json engines field
# Add to backend/package.json:
{
  "engines": {
    "node": "18.x",
    "npm": "10.x"
  }
}

# Commit and redeploy
git add .
git commit -m "Add engines to package.json"
git subtree push --prefix backend heroku main
```

### Issue 6: Frontend Can't Reach Backend

**Solutions:**
1. Check API URL is correct (https://, not http://)
2. Verify CORS is configured in backend
3. Check Network tab in browser DevTools
4. Test backend URL directly in browser
5. Check if backend is sleeping (free tier limitation)

---

## 🎉 Deployment Complete!

### Your Live URLs:

**Backend API:**
```
https://career-nest-api.herokuapp.com
```

**Frontend App:**
```
https://career-nest-frontend.vercel.app
```

**Health Check:**
```
https://career-nest-api.herokuapp.com/health
```

---

## 📊 Post-Deployment Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] MongoDB Atlas connected
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Health check endpoint working
- [ ] User registration working
- [ ] User login working
- [ ] Dashboards loading
- [ ] API calls successful
- [ ] No console errors
- [ ] No server errors in logs

---

## 🔐 Security Reminders

1. ✅ Never commit `.env` file
2. ✅ Use strong JWT secrets (128+ characters)
3. ✅ Enable MongoDB IP whitelist in production
4. ✅ Use HTTPS for all production URLs
5. ✅ Regularly update dependencies
6. ✅ Monitor logs for suspicious activity
7. ✅ Set up database backups
8. ✅ Use environment variables for all secrets

---

## 📞 Need Help?

**Heroku Support:**
- Docs: https://devcenter.heroku.com
- Support: https://help.heroku.com

**Vercel Support:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**MongoDB Atlas Support:**
- Docs: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

---

## 🚀 Next Steps

1. **Custom Domain:** Add your own domain to Vercel/Heroku
2. **Analytics:** Set up Google Analytics or Vercel Analytics
3. **Monitoring:** Set up error tracking (Sentry, LogRocket)
4. **Backups:** Configure automated MongoDB backups
5. **CI/CD:** Set up automatic deployments on git push
6. **Performance:** Optimize images, enable caching
7. **SEO:** Add meta tags, sitemap, robots.txt

---

**🎊 Congratulations! Your Career Nest is now live and accessible worldwide!**

*Last Updated: October 31, 2025*
