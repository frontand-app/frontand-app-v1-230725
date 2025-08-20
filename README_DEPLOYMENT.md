# 🚀 **DEPLOYMENT GUIDE** - Never Get Lost Again!

## ⚡ **QUICK DEPLOY (Recommended)**

```bash
# Safe deployment with automatic checks
npm run deploy
```

This script automatically:
- ✅ Verifies correct GitHub account (`frontand-app`)
- ✅ Verifies correct repository (`frontand-app-v1-230725`)
- ✅ Removes confusing `.vercel` configs
- ✅ Tests build locally
- ✅ Pushes to correct repo
- ✅ Triggers automatic Vercel deployment

## 🔍 **MANUAL VERIFICATION**

```bash
# Check if setup is correct
npm run deploy:check
```

Should show:
```
origin  https://github.com/frontand-app/frontand-app-v1-230725.git (fetch)
origin  https://github.com/frontand-app/frontand-app-v1-230725.git (push)
github.com
  ✓ Logged in to github.com account frontand-app (keyring)
  - Active account: true
Ready to deploy!
```

## 🚨 **IF SOMETHING GOES WRONG**

### **Wrong Repository Error:**
```bash
git remote set-url origin https://github.com/frontand-app/frontand-app-v1-230725.git
```

### **Wrong GitHub Account:**
```bash
gh auth switch --user frontand-app
```

### **Vercel CLI Confusion:**
```bash
rm -rf .vercel  # Remove CLI config
# Never use vercel CLI - only use git push
```

## 📋 **DEPLOYMENT CHECKLIST**

### **Before Every Deployment:**
- [ ] Changes tested locally (`npm run dev`)
- [ ] Build works (`npm run build`)
- [ ] Changes committed to git
- [ ] Using correct account/repo (`npm run deploy:check`)

### **Deployment Process:**
1. `npm run deploy` (automatic safe deployment)
2. Wait 1-3 minutes
3. Check https://frontand.app
4. Verify new features work

## 🎯 **KEY FACTS TO REMEMBER**

### **✅ CORRECT:**
- **Repository**: `frontand-app/frontand-app-v1-230725`
- **GitHub Account**: `frontand-app`
- **Deployment Method**: `git push origin main` (automatic)
- **Live URL**: https://frontand.app

### **❌ NEVER USE:**
- `frontand-app/frontand-platform` repository
- `SCAILE-it` or personal GitHub accounts
- `vercel --prod` or any Vercel CLI commands
- Personal Vercel projects

## 🏗️ **CURRENT ARCHITECTURE**

```
Local Development
    ↓ (npm run deploy)
GitHub: frontand-app/frontand-app-v1-230725
    ↓ (webhook - automatic)
Vercel: frontand-tech-persons-projects/frontand-app-v1-230725
    ↓ (domain mapping)
Live Site: https://frontand.app
```

## 🎉 **WHAT'S CURRENTLY DEPLOYED**

- ✅ All 3 crawl workflows LIVE (contacts, gmaps, logo)
- ✅ YC-style `/search` endpoint (replaces `/flows`)
- ✅ Enhanced search with categories & sorting
- ✅ Modal endpoints from frontand-app workspace
- ✅ TypeScript errors fixed
- ✅ Professional UI with rich stats

---

**🎯 Remember: `npm run deploy` is all you need!**