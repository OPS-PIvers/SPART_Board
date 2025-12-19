# GitHub Actions Auto-Deployment Setup Guide

This guide will help you set up automatic Firebase deployment when you push to the `main` branch.

## 📋 Prerequisites

- Firebase project created (spartboard)
- GitHub repository for this project
- Firebase CLI installed locally: `npm install -g firebase-tools`

## 🔧 Step-by-Step Setup

### Step 1: Initialize Firebase Hosting (if not done already)

```bash
firebase login
firebase init hosting
```

**Answers:**
- Project: Select "spartboard"
- Public directory: `dist`
- Single-page app: `Yes`
- Overwrite index.html: `No`

This creates `firebase.json` and `.firebaserc` files (they're gitignored, so they won't be committed).

### Step 2: Generate Firebase Service Account

1. Go to Firebase Console: https://console.firebase.google.com/project/spartboard/settings/serviceaccounts/adminsdk

2. Click **"Generate new private key"**

3. Click **"Generate key"** - This downloads a JSON file

4. **IMPORTANT:** Keep this file secure! It contains credentials.

### Step 3: Set Up GitHub Secrets

1. Go to your GitHub repository

2. Navigate to **Settings** → **Secrets and variables** → **Actions**

3. Click **"New repository secret"** and add the following secrets:

#### Firebase Service Account
- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** Paste the **entire contents** of the JSON file from Step 2

#### Firebase Configuration (from your .env.local file)
- **Name:** `VITE_FIREBASE_API_KEY`
- **Value:** `AIzaSyAb4i-hffRWb3Y6g12EjrZk5K2CC38iQtw`

- **Name:** `VITE_FIREBASE_AUTH_DOMAIN`
- **Value:** `spartboard.firebaseapp.com`

- **Name:** `VITE_FIREBASE_PROJECT_ID`
- **Value:** `spartboard`

- **Name:** `VITE_FIREBASE_STORAGE_BUCKET`
- **Value:** `spartboard.firebasestorage.app`

- **Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value:** `759666600376`

- **Name:** `VITE_FIREBASE_APP_ID`
- **Value:** `1:759666600376:web:5ce9c24b893e1e7afd874d`

#### Gemini API Key
- **Name:** `VITE_GEMINI_API_KEY`
- **Value:** Your Gemini API key (from .env.local)

### Step 4: Verify Workflow File

The workflow file has been created at [.github/workflows/firebase-deploy.yml](/.github/workflows/firebase-deploy.yml)

It triggers on pushes to the `main` branch and:
1. Checks out your code
2. Sets up Node.js 20
3. Installs dependencies
4. Builds the project (with environment variables from secrets)
5. Deploys to Firebase Hosting

### Step 5: Test the Deployment

1. **Commit and push your changes:**

```bash
git add .
git commit -m "Add Firebase auto-deployment workflow"
git push origin main
```

2. **Monitor the deployment:**
   - Go to your GitHub repository
   - Click **"Actions"** tab
   - Watch the "Deploy to Firebase Hosting" workflow run

3. **Check deployment status:**
   - If successful, your app will be live at: `https://spartboard.web.app`
   - You can also check: `https://spartboard.firebaseapp.com`

## 🚀 How It Works

### Automatic Deployments
Every time you push to `main`, GitHub Actions will:
1. Build your React app with Vite
2. Deploy the `dist` folder to Firebase Hosting
3. Your live site updates automatically (usually takes 2-3 minutes)

### Manual Deployments (Local)
You can still deploy manually from your computer:

```bash
npm run build
firebase deploy --only hosting
```

## 🔒 Security Notes

### Secrets Management
- **NEVER commit .env.local** to GitHub (already in .gitignore)
- **NEVER commit the Firebase service account JSON** file
- All sensitive data is stored in GitHub Secrets (encrypted)

### Firebase API Keys
- Firebase API keys in client code are safe (protected by domain restrictions in Firebase Console)
- **However**, the Gemini API key should ideally be moved to Cloud Functions in production

## 🐛 Troubleshooting

### Build Fails in GitHub Actions

**Check the Actions logs:**
1. Go to GitHub → Actions tab
2. Click on the failed workflow run
3. Expand the failed step to see error details

**Common issues:**
- Missing secrets: Make sure all 8 secrets are set correctly
- TypeScript errors: Fix locally first, then push
- Dependency issues: Delete `node_modules` and `package-lock.json`, run `npm install`

### Deployment Succeeds but App Doesn't Work

**Firebase Console Authorization:**
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"
3. Domains should include:
   - `spartboard.web.app`
   - `spartboard.firebaseapp.com`

**Firestore/Storage Rules:**
Make sure your security rules are published in Firebase Console.

### Environment Variables Not Working

**Verify secrets are set:**
- GitHub Settings → Secrets and variables → Actions
- All 8 secrets should be listed

**Verify naming:**
- All environment variables must start with `VITE_`
- Vite only exposes `VITE_*` prefixed variables to the client

## 📊 Deployment Status

You can add a status badge to your README:

```markdown
![Deploy Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/firebase-deploy.yml/badge.svg)
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repository name.

## 🎯 Next Steps

### Optional Enhancements

1. **Add Preview Deployments (PRs):**
   - Deploy to preview channels for pull requests
   - Test changes before merging

2. **Add Build Caching:**
   - Speed up builds by caching node_modules

3. **Add Linting/Testing:**
   - Run tests before deployment
   - Prevent broken code from being deployed

4. **Set up Staging Environment:**
   - Create a `develop` branch that deploys to a staging Firebase project
   - Test in staging before merging to `main`

## 📚 Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)

---

**Created:** 2025-12-19
**Project:** SPART Board / Classroom Dashboard Pro
**Firebase Project ID:** spartboard
