# 🚀 **DEPLOYMENT CONFIGURATION** - CRITICAL REFERENCE

## ⚠️ **IMPORTANT: CORRECT REPOSITORY & DEPLOYMENT SETUP**

### 🎯 **CORRECT GITHUB REPOSITORY**
```bash
# CORRECT REPOSITORY (connected to frontand.app)
https://github.com/frontand-app/frontand-app-v1-230725.git

# WRONG REPOSITORY (not connected to domain)
https://github.com/frontand-app/frontand-platform.git  ❌
```

### 🎯 **CORRECT VERCEL PROJECT**
```bash
# CORRECT PROJECT (serves frontand.app domain)
Project: frontand-app-v1-230725
Team: frontand-tech-persons-projects
URL: frontand-app-v1-230725-n056brfcw-frontand-tech-persons-projects.vercel.app
Domain: frontand.app

# WRONG PROJECT (personal account)
Project: frontand-app-v1-230725
Team: federico-de-pontes-projects  ❌
```

## 🔧 **DEPLOYMENT COMMANDS**

### **Before Any Deployment:**
```bash
# 1. Verify correct repository
git remote -v
# Should show: https://github.com/frontand-app/frontand-app-v1-230725.git

# 2. Verify correct GitHub account
gh auth status
# Should show frontand-app as active account

# 3. Switch if needed
gh auth switch --user frontand-app
```

### **To Deploy:**
```bash
# 1. Commit changes
git add -A
git commit -m "Your commit message"

# 2. Push to trigger automatic deployment
git push origin main

# 3. Verify deployment at frontand.app (not CLI)
curl -I https://www.frontand.app
```

## 🚫 **NEVER DO THESE:**

### ❌ **Wrong Repository:**
```bash
git push origin main  # when remote points to frontand-platform
```

### ❌ **Wrong Vercel CLI:**
```bash
vercel --prod  # creates new personal project
vercel link    # links to personal account
```

### ❌ **Wrong Account:**
```bash
git push origin main  # when gh auth shows SCAILE-it or personal account
```

## ✅ **CORRECT WORKFLOW:**

### **1. Setup (One Time):**
```bash
# Ensure correct remote
git remote set-url origin https://github.com/frontand-app/frontand-app-v1-230725.git

# Ensure correct GitHub account
gh auth switch --user frontand-app

# Remove any incorrect .vercel config
rm -rf .vercel
```

### **2. Deploy Process:**
```bash
# Make changes, test locally
npm run build  # verify builds successfully

# Commit and push
git add -A
git commit -m "Description of changes"
git push origin main

# Automatic deployment will trigger
# Check https://frontand.app in 1-3 minutes
```

## 🎯 **VERIFICATION CHECKLIST:**

### **Before Pushing:**
- [ ] `git remote -v` shows `frontand-app-v1-230725.git`
- [ ] `gh auth status` shows `frontand-app` as active
- [ ] `npm run build` succeeds locally
- [ ] No `.vercel` directory exists (prevents CLI confusion)

### **After Pushing:**
- [ ] `git push origin main` succeeds without permission errors
- [ ] Check https://frontand.app in 1-3 minutes for updates
- [ ] Verify new features work as expected

## 🏗️ **CURRENT ARCHITECTURE:**

### **Repository Structure:**
```
GitHub: frontand-app/frontand-app-v1-230725
    ↓ (webhook)
Vercel: frontand-tech-persons-projects/frontand-app-v1-230725
    ↓ (domain)
Live Site: frontand.app
```

### **Modal Deployments:**
```
Modal Workspace: frontand-app
    ├── tech-crawl4contacts-frontand-wrapper
    ├── tech-gmaps-frontand-wrapper  
    └── tech-crawl4logo
```

## 🎉 **CURRENT STATUS:**

### **✅ LIVE FEATURES:**
- All 3 crawl workflows (crawl4contacts, crawl4gmaps, crawl4logo)
- YC-style `/search` endpoint (replaces `/flows`)
- Enhanced search with categories, sorting, rich stats
- Modal endpoints from frontand-app workspace
- TypeScript errors fixed

### **✅ WORKING DEPLOYMENTS:**
- **Main Site**: https://frontand.app
- **Repository**: https://github.com/frontand-app/frontand-app-v1-230725
- **Vercel Project**: frontand-tech-persons-projects/frontand-app-v1-230725

---

## 📋 **QUICK REFERENCE:**

**To deploy:** `git push origin main` (automatic)
**To verify:** Check https://frontand.app
**GitHub account:** `frontand-app`
**Repository:** `frontand-app-v1-230725`
**Never use:** Vercel CLI, personal accounts, or frontand-platform repo

**🚨 If deployment doesn't work, check this file first!**