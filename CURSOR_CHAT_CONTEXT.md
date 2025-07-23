# Front& App - Comprehensive Cursor Chat Context
*Complete project documentation for starting new Cursor sessions*

## 🎯 **Project Overview**
**Front&** is a React-based AI workflow runner that processes CSV data through Google's Gemini 2.0 Flash model with optional Google Search integration. The app allows users to upload CSV files, define AI prompts, and process data row-by-row with AI-generated insights.

### **Current Status: V1 Clean Baseline**
- **GitHub**: `frontand-app/frontand-app-v1-230725` 
- **Live URL**: https://frontand-app-v1-clean-50qt0bjx1-frontand-tech-persons-projects.vercel.app/
- **Status**: ✅ Fully functional, auto-deploys from GitHub
- **Key Feature**: Google Search toggle working correctly

---

## 🌐 **Deployment History & URLs**

### **Current Clean Deployment**
- **Primary**: https://frontand-app-v1-clean-50qt0bjx1-frontand-tech-persons-projects.vercel.app/
- **Status**: ✅ Active, auto-deploys from GitHub master branch
- **Features**: Google Search toggle, CSV upload, AI processing

### **Previous Deployment URLs (Legacy/Archived)**
- **asc2.vercel.app**: Complex version with authentication
- **2f20hf2c2.vercel.app**: Password-protected legacy version  
- **frontand-app-git-main.vercel.app**: Old main branch deployment
- **Multiple other variants**: Cleaned up during repository consolidation

### **Vercel Project Management**
- **Active Project**: `frontand-app-v1-230725` (connected to GitHub)
- **Deleted Projects**: All legacy projects removed to avoid confusion
- **Auto-Deploy**: Enabled on push to master branch

---

## 🔌 **Modal.com Integration**

### **API Endpoint**
- **URL**: `https://federicodeponte--ai-form-form-ai-simple.modal.run/`
- **Method**: POST
- **Authentication**: None required (public endpoint)

### **Request Format**
```json
{
  "data": {
    "row1": {"col1": "value1", "col2": "value2"},
    "row2": {"col1": "value3", "col2": "value4"}
  },
  "headers": ["col1", "col2"],
  "prompt": "Your AI prompt here",
  "use_google_search": true/false
}
```

### **Response Format**
```json
{
  "results": [
    {
      "row": "row1",
      "result": "AI generated response",
      "rationale": "Explanation of reasoning"
    }
  ]
}
```

---

## 🔍 **Google Search Toggle Feature**

### **Implementation Details**
- **Location**: `src/pages/FlowRunner-simple.tsx` lines 200-210
- **UI Component**: Checkbox with "Use Google Search" label
- **State Management**: `useGoogleSearch` boolean state
- **API Integration**: Passed as `use_google_search` parameter

### **Verification Status**
- ✅ **Visible**: Toggle appears in UI
- ✅ **Functional**: State changes correctly
- ✅ **API Integration**: Parameter sent to Modal
- ✅ **Backend Processing**: Google Search enabled/disabled

---

## 📁 **Repository Management**

### **Current Repository Structure**
- **GitHub**: `frontand-app/frontand-app-v1-230725`
- **Branches**:
  - `master`: Clean V1 baseline (current)
  - `backup/legacy-complex-version`: Legacy code backup
- **Protected**: No force push protection (allows clean updates)

### **Git Workflow**
```bash
# Standard workflow
git add .
git commit -m "feat: description"
git push origin master

# Emergency revert
git reset --hard HEAD~1
git push --force origin master
```

---

## 🚀 **Deployment Process**

### **Automatic Deployment**
1. **Push to GitHub master** → Vercel auto-deploys
2. **Build Process**: Vite build → Static files
3. **Deploy URL**: Updates automatically
4. **Verification**: Manual testing of Google Search toggle

### **Manual Deployment**
```bash
# Via Vercel CLI
vercel --prod
vercel promote [deployment-url]

# Force redeploy
vercel --force --prod
```

---

## 🚨 **Emergency Recovery Procedures**

### **Deployment Issues**
```bash
# Revert to last known good deployment
git log --oneline | head -5
git reset --hard [good-commit-hash]
git push --force origin master

# Vercel cache clear
vercel --force --prod
```

### **Google Search Toggle Missing**
1. Check `src/pages/FlowRunner-simple.tsx` lines 200-210
2. Verify `useGoogleSearch` state management
3. Confirm checkbox component rendering
4. Test API parameter passing

### **API Connection Issues**
1. Verify Modal endpoint: `https://federicodeponte--ai-form-form-ai-simple.modal.run/`
2. Check request format in `src/lib/api.ts`
3. Test direct API call with curl
4. Redeploy Modal function if needed

---

## 🎯 **Context Summary for Cursor**

### **What happened during our session:**
1. **Identified confusion** from multiple deployment URLs and repositories
2. **Located the clean version** in a separate directory and GitHub repo
3. **Connected GitHub to Vercel** for automatic deployments
4. **Verified Google Search toggle** functionality across all deployments
5. **Renamed repository** to `frontand-app-v1-230725` for clarity
6. **Cleaned up legacy projects** by backing up code and deleting old deployments
7. **Created comprehensive documentation** for future development

### **Current working state:**
- ✅ **Repository**: Clean, connected to Vercel, auto-deploys
- ✅ **Deployment**: Live and functional at frontand-app-v1-clean-50qt0bjx1-frontand-tech-persons-projects.vercel.app
- ✅ **Google Search**: Toggle visible and working correctly
- ✅ **Documentation**: Complete project context and version roadmap
- ✅ **Legacy Code**: Safely backed up in dedicated branch

### **For next Cursor session:**
1. **Clone repo**: `git clone https://github.com/frontand-app/frontand-app-v1-230725`
2. **Verify deployment**: Run verification scripts
3. **Check Google Search**: Confirm toggle functionality
4. **Review roadmap**: Plan next version features

---

## 📞 **Key Resources**

### **URLs**
- **Live App**: https://frontand-app-v1-clean-50qt0bjx1-frontand-tech-persons-projects.vercel.app/
- **GitHub**: https://github.com/frontand-app/frontand-app-v1-230725
- **Vercel Dashboard**: https://vercel.com/frontand-app/frontand-app-v1-230725

### **Quick Recovery Commands**
```bash
# Clone fresh copy
git clone https://github.com/frontand-app/frontand-app-v1-230725
cd frontand-app-v1-230725

# Verify deployment
python3 verify_deployment.py

# Force redeploy
vercel --force --prod
```

---

*This comprehensive context enables starting new Cursor sessions with complete project understanding and immediate productivity.*

**Last Updated**: January 2025
**Version**: V1 Clean Baseline
**Status**: ✅ Production Ready
