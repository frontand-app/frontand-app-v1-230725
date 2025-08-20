# Repository and Modal App Mapping

## Modal Apps (scaile account)
```
✅ DEPLOYED:
- ap-mur5iYZkuAO7XKVFRXzcqy │ loop-over-rows      │ deployed
- ap-uu4limg4PdUIm6E5TIRLyi │ crawl4contacts      │ deployed  
- ap-52G6hasHXtX1Gfby6QOD2K │ crawl4contacts-v2   │ deployed
- ap-miyjwbHQdvdkEYossf6PEk │ gmaps-fastapi-craw… │ deployed
- ap-l9eOji2m25i3ukh6KFQmPO │ imprint-reader-fro… │ deployed
- ap-mFABlwLsZBF25sHr3RYMHF │ seo-checker-deploy  │ deployed

❌ STOPPED:
- ap-xZWLoKkaEx0MK1pxruNRq1 │ keyword-kombat-fro… │ stopped
```

## GitHub Repositories

### federicodeponte account
```
✅ CONFIRMED:
- federicodeponte/crawl4contacts    (🌍 AI-Powered Business Contact Extractor)
- federicodeponte/imprint-reader    (AI-powered imprint extraction - 85.9% success rate)
- federicodeponte/crawl4logo        (private)
- federicodeponte/crawl4doctors     (private)
- federicodeponte/crawl4images      (private)
- federicodeponte/crawl4jobs        (private)

❓ MISSING:
- gmaps-fastapi-crawler (not found here)
- crawl4contacts-v2 (not found here)
```

### SCAILE-it account
```
✅ CONFIRMED:
- SCAILE-it/crawlo-google-maps      (private - likely the gmaps source)

❓ MISSING:
- crawl4contacts-v2 (not found here)
- gmaps-fastapi-crawler (not found here)
```

### frontand-app account
```
✅ CURRENT REPO:
- frontand-app/frontand-app-v1-230725 (this frontend repo)
```

### techrocketlist account
```
❌ NO CRAWL REPOS:
- Only contains rocketlist_scripts and rocketlist_deepnote
- No crawl4contacts-v2 or gmaps repositories found
```

## Endpoint Mapping

### ✅ Working Endpoints
- `https://scaile--imprint-reader-frontand-fastapi-app.modal.run/process`
  - Modal: imprint-reader-frontand (deployed)
  - GitHub: federicodeponte/imprint-reader
  - Status: ✅ Returns {"status":"healthy","app":"crawl4imprint","version":"2.0","standard":"Front&"}

### ❌ Invalid Function Call Endpoints (Apps deployed but no web interface)
- `https://scaile--crawl4contacts-v2.modal.run/process`
  - Modal: crawl4contacts-v2 (deployed)
  - GitHub: ❓ (source repo not found)
  - Status: ❌ "modal-http: invalid function call"

- `https://scaile--gmaps-fastapi-crawler.modal.run/process`
  - Modal: gmaps-fastapi-crawler (deployed)
  - GitHub: Likely SCAILE-it/crawlo-google-maps
  - Status: ❌ "modal-http: invalid function call"

### 🚫 Missing Modal Apps
- crawl4logo: GitHub repo exists (federicodeponte/crawl4logo) but no Modal app deployed

## Analysis & Issues

### Problem: "Invalid Function Call" Error
The deployed Modal apps `crawl4contacts-v2` and `gmaps-fastapi-crawler` return "invalid function call" which suggests:
1. **Apps are deployed as function apps, not web apps** (missing FastAPI/ASGI server)
2. **Missing web endpoints** - they may only have function decorators, no @app.web_endpoint
3. **Need to be redeployed** with proper FastAPI setup

### Frontend Configuration Status
✅ **Completed**: Frontend crawl adapters implemented for all 4 types:
- `buildCrawlPayload()` supports: imprint, contacts, logo, gmaps
- WorkflowBase.tsx uses unified crawl adapter
- Workflow configs added for all crawl types

❌ **Backend Issues**:
- Only imprint-reader-frontand works properly (has FastAPI + web endpoints)
- crawl4contacts-v2 and gmaps-fastapi-crawler need FastAPI web interface
- crawl4logo needs Modal deployment

## Next Steps
1. **Find source repositories** for crawl4contacts-v2 and gmaps-fastapi-crawler
2. **Add FastAPI web interfaces** to function-only Modal apps
3. **Deploy crawl4logo** to Modal with proper web endpoints
4. **Test all endpoints** with frontend adapters