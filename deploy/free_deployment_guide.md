# Free Deployment Guide for Patent Application

This guide will help you deploy your Patent application for free using Render.com.

## Prerequisites

1. Create a free account on [Render.com](https://render.com)
2. Have your GitHub account ready (if you don't have one, create it at [GitHub](https://github.com))

## Step 1: Push your code to GitHub

1. Create a new repository on GitHub
2. Initialize your local repository and push your code:

```bash
cd "/home/abdunodir/Patent syat"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/patent-app.git
git push -u origin main
```

## Step 2: Deploy on Render.com

### Backend API Deployment

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: patent-api
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
5. Add the following environment variable:
   - Key: `MONGO_URI`
   - Value: `mongodb+srv://telba0702_db_user:UeVzOKi62XC2fOwZ@cluster0.dpwaron.mongodb.net/patent?retryWrites=true&w=majority`
6. Click "Create Web Service"

### Frontend Deployment

1. After deploying the backend, note down the URL (e.g., https://patent-api.onrender.com)
2. Create a new file in your client folder: `client/_redirects` with the following content:
   ```
   /api/* https://patent-api.onrender.com/api/:splat 200
   /* /index.html 200
   ```
3. On Render.com, click on "New" and select "Static Site"
4. Connect your GitHub repository
5. Configure the service:
   - Name: patent-client
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
6. Click "Create Static Site"

## Step 3: Update Your Domain (Optional)

If you want to use your own domain (work-intellium.uz):

1. In Render.com, go to your static site settings
2. Navigate to "Custom Domain"
3. Add your domain name and follow the DNS configuration instructions

## Alternative Free Hosting Options

If Render.com doesn't work for you, here are other free hosting options:

1. **Netlify** - Similar to Render, with a generous free tier
2. **Vercel** - Great for frontend applications, also has free tier
3. **Railway.app** - Provides limited free resources
4. **Fly.io** - Offers a free tier with limited resources

## Troubleshooting

- If your application doesn't work immediately after deployment, check the logs in your Render dashboard
- Make sure your MongoDB Atlas IP access list includes '0.0.0.0/0' to allow connections from any IP
- Check that your application doesn't have any hardcoded URLs or port numbers
