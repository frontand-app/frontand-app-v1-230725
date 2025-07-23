# 🎯 Cursor Chat Context - Front& Clean Version

> **Use this file to provide complete context when starting a new Cursor chat session**

## 📋 **Current Project Status: COMPLETE & CLEAN**

### ✅ **Repository Information**
- **GitHub Repo**: `frontand-app/frontand-app-v1-230725`
- **Local Directory**: `~/Downloads/frontand-app-v1-clean`
- **Main Branch**: `master` (clean version with Google Search toggle)
- **Backup Branch**: `backup/legacy-complex-version` (all legacy features preserved)

### ✅ **Live Deployment**
- **Vercel Project**: `frontand-app-v1-clean`
- **Production URL**: https://frontand-app-v1-clean-git-master-frontand-tech-persons-projects.vercel.app/flows/loop-over-rows
- **Status**: ✅ Live and working perfectly
- **Auto-Deployment**: ✅ Connected to GitHub (push to master = auto-deploy)

### ✅ **Key Features**
- **Google Search Toggle**: ✅ Working (enables AI web search capabilities)
- **CSV Data Input**: ✅ File upload and paste functionality
- **AI Processing**: ✅ Connected to Modal API
- **Clean Interface**: ✅ No legacy Dashboard/Flow Library/Creators features
- **Test Mode**: ✅ Process only 1 row toggle available

---

## 🔧 **Technical Architecture**

### **Frontend Stack**
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components  
- **Build Tool**: Vite (fast development and builds)
- **UI Components**: Modern shadcn/ui design system

### **Backend Integration**
- **API**: Modal.com serverless functions
- **AI Model**: Google Gemini 2.0 Flash (with optional web search)
- **Processing**: Batch CSV row processing with AI analysis

### **Deployment**
- **Host**: Vercel (automatic GitHub deployment)
- **Domain**: frontand-tech-persons-projects team
- **Branch Strategy**: `master` for production, `backup/*` for legacy

---

## 🌐 **Modal Integration Details**

### **Current Modal Endpoint**
```
https://scaile--loop-over-rows-fastapi-app.modal.run/process
```

### **API Request Format**
```json
{
  "data": {"row1": ["keyword1"], "row2": ["keyword2"]},
  "headers": "CSV Column Name",
  "prompt": "AI processing instruction",
  "batch_size": 10,
  "enable_google_search": true
}
```

### **Response Format**
```json
{
  "results": {
    "row1": {"result": "AI analysis", "rationale": "Explanation"},
    "row2": {"result": "AI analysis", "rationale": "Explanation"}
  },
  "headers": ["Input", "AI Result", "Rationale"]
}
```

### **Google Search Toggle**
- **Frontend**: Switch component with Globe icon
- **Backend**: Enables Gemini's web search capabilities
- **Implementation**: `enable_google_search` parameter in API calls

---

## 📁 **Key File Locations**

### **Main Application Files**
- **Main Component**: `src/pages/FlowRunner-simple.tsx` (core workflow logic)
- **Layout**: `src/components/Layout.tsx` (navigation, clean design)
- **Routing**: `src/App.tsx` (simplified routing)
- **Styles**: `src/index.css` (Tailwind + custom styles)

### **Documentation Files**
- **Modal Integration**: `MODAL_INTEGRATION.md` (API documentation)
- **Project Info**: `README.md` (overview and setup)
- **Version Info**: `FRONTAND_VERSION_ROADMAP.md` (project timeline)

### **Configuration Files**
- **Vite Config**: `vite.config.ts` (build configuration)
- **Tailwind**: `tailwind.config.ts` (styling configuration)
- **Package**: `package.json` (dependencies and scripts)

---

## 🚀 **Development Workflow**

### **Local Development**
```bash
cd ~/Downloads/frontand-app-v1-clean
npm run dev  # Starts on http://localhost:5173
```

### **Making Changes**
```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin master
# → Vercel automatically deploys! ✨
```

### **Building for Production**
```bash
npm run build  # Creates dist/ folder
npm run preview  # Preview production build locally
```

---

## ✅ **What's CLEAN (No Legacy)**

### **Removed Features** ❌
- Dashboard page with complex navigation
- Flow Library marketplace
- Creators/monetization features  
- User authentication/login system
- Credits/billing system
- Multiple workflow types

### **Current Clean Features** ✅
- Single workflow: "Loop Over Rows"
- CSV data input (upload or paste)
- AI processing with Google Search toggle
- Results table with download
- Clean, simple navigation
- Test mode (process 1 row only)

---

## 📋 **Backup Information**

### **Legacy Features Preserved**
All complex features are safely backed up in the `backup/legacy-complex-version` branch:
- Complete Dashboard with user management
- Flow Library with multiple workflows
- Creators board and monetization
- Authentication system
- Credit management system

### **Accessing Legacy Code**
```bash
git checkout backup/legacy-complex-version  # Switch to legacy
git checkout master  # Switch back to clean
```

---

## 🎯 **Current Development Goals**

### **Next Steps (if needed)**
1. **Enhanced Modal Integration**: Real-time processing status
2. **Improved UI**: Better loading states and error handling  
3. **Performance**: Optimize large CSV processing
4. **Features**: Additional AI model options

### **Architecture Decisions Made**
- ✅ Clean single-purpose application
- ✅ GitHub-connected auto-deployment
- ✅ Modal.com for AI processing
- ✅ Google Search toggle functionality
- ✅ Legacy features safely preserved in backup branch

---

## 🔗 **Important URLs**

- **Live App**: https://frontand-app-v1-clean-git-master-frontand-tech-persons-projects.vercel.app/flows/loop-over-rows
- **GitHub Repo**: https://github.com/frontand-app/frontand-app-v1-230725
- **Vercel Dashboard**: https://vercel.com/frontand-tech-persons-projects/frontand-app-v1-clean
- **Modal API**: https://scaile--loop-over-rows-fastapi-app.modal.run

---

## 🎉 **Project Status: PERFECT**

✅ **Single clean repository**  
✅ **GitHub auto-deployment working**  
✅ **Google Search toggle functional**  
✅ **Modal integration connected**  
✅ **Legacy features safely backed up**  
✅ **No version confusion or duplicates**  

**Ready for development with complete GitHub context!** 🚀

---

*Last Updated: July 23, 2025*  
*Repository: frontand-app/frontand-app-v1-230725*  
*Branch: master (clean version)*
