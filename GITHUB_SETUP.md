# 🚀 GitHub Setup Instructions for VIFM Portal

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the **+** icon → **New repository**
3. Repository name: `vifm-portal`
4. Description: "Business Development Portal for VIFM"
5. Set to **Public** (or Private if preferred)
6. **DON'T** initialize with README (we have one)
7. Click **Create repository**

## Step 2: Upload Files to GitHub

### Option A: GitHub Web Interface (Easiest)
1. Click **"uploading an existing file"** link
2. Drag all files from this folder into the browser
3. Commit message: "Initial commit - VIFM Portal"
4. Click **Commit changes**

### Option B: Git Command Line
```bash
# In this folder, run:
git init
git add .
git commit -m "Initial commit - VIFM Portal"
git branch -M main
git remote add origin https://github.com/[YOUR-USERNAME]/vifm-portal.git
git push -u origin main
```

### Option C: GitHub Desktop
1. Click **File** → **Add Local Repository**
2. Select this folder
3. Commit all files
4. Publish to GitHub

## Step 3: Import to Replit

1. Go to [Replit.com](https://replit.com)
2. Click **Create Repl**
3. Click **Import from GitHub**
4. Enter: `https://github.com/[YOUR-USERNAME]/vifm-portal`
5. Click **Import from GitHub**
6. Wait for import (takes ~30 seconds)
7. Click **Run** - Your portal is live!

## Step 4: Get Your HTML Files

You need to add these 4 HTML files from your original documents:

### Required Files:
1. **login.html** - From document #6
2. **vifm-main-menu.html** - From document #9
3. **phase1.html** - From document #7
4. **bd-module.html** - From document #5

### How to Add Them:
1. Copy each HTML file's content from your documents
2. In GitHub, click **Add file** → **Create new file**
3. Name it exactly as shown above
4. Paste the content
5. Commit each file

## Step 5: Final URL

Your portal will be live at:
```
https://vifm-portal.[YOUR-REPLIT-USERNAME].repl.co
```

## 📋 Quick Checklist

- [ ] Created GitHub repository
- [ ] Uploaded core files (index, .replit, etc.)
- [ ] Added login.html
- [ ] Added vifm-main-menu.html
- [ ] Added phase1.html
- [ ] Added bd-module.html
- [ ] Imported to Replit
- [ ] Clicked Run in Replit
- [ ] Portal loads successfully

## 🎯 Success!

Once complete, you'll have:
- GitHub repository for version control
- Replit deployment for hosting
- Live URL to share with team
- Easy updates (push to GitHub → Replit auto-updates)

---

Need help? The test-portal.html file can verify everything is working!
