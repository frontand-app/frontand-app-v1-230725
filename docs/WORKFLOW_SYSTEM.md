# Front& Standardized Workflow System

## Overview

We've built a highly standardized frontend system that makes it incredibly easy to add new AI-powered workflows to the Front& platform. This system provides:

✅ **Unified UI Components** - Consistent interface across all workflows  
✅ **Automatic Routing** - Universal workflow runner handles all apps  
✅ **Configuration-Driven** - Add workflows via simple config files  
✅ **Developer-Friendly** - Comprehensive schema for Modal app integration  
✅ **Consumer-Focused** - ChatGPT-like simplicity for end users  

## Current Workflows

### 🔵 Live Workflows
- **Loop Over Rows** - AI batch processing for CSV data

### 🟡 Coming Soon (Frontend Ready)
- **Crawl4Logo** - Extract company logos from websites
- **Crawl4Contacts** - Find contact information from companies  
- **Co-Storm Blog Gen** - Generate comprehensive blog posts
- **Check AI Mentions** - Monitor brand mentions across the web
- **Crawl4Imprint** - Extract legal/compliance information
- **Transform Image** - AI-powered image transformations

## System Architecture

```
Frontend (React/TypeScript)
├── WorkflowBase Component (Universal UI)
├── Workflow Registry (Configuration)
├── Universal Router (Handles all workflows)
└── Homepage Integration (Auto-displays workflows)

Backend (Modal + FastAPI)
├── Standardized Input/Output Schema
├── CORS Configuration
├── Error Handling Standards
└── Progress Tracking
```

## For Frontend Developers

### Adding a New Workflow

1. **Register in Config** (`src/config/workflows.ts`):
```typescript
'my-new-workflow': {
  id: 'my-new-workflow',
  title: 'My New Workflow',
  description: 'What this workflow does',
  icon: MyIcon,
  color: 'purple',
  inputs: [/* field definitions */],
  endpoint: 'https://username--app-name-fastapi-app.modal.run/process',
  outputType: 'table'
}
```

2. **That's it!** The system automatically:
   - Creates the UI interface
   - Handles routing (`/flows/my-new-workflow`)
   - Adds to homepage
   - Manages state and processing

### Supported Input Types

- `text` - Single line text input
- `textarea` - Multi-line text input  
- `url` - URL validation and input
- `file` - File upload with drag & drop
- `image` - Image upload with preview
- `csv` - CSV data with parsing
- `select` - Dropdown selection
- `multiselect` - Multiple choice selection

### Output Types

- `table` - Structured data display with search/export
- `json` - Raw JSON data display
- `text` - Plain text content
- `image` - Image display with download
- `file` - File download link

## For Backend Developers

### Quick Start

1. **Read the Schema**: [`docs/MODAL_APP_SCHEMA.md`](./MODAL_APP_SCHEMA.md)

2. **Basic Modal App Structure**:
```python
import modal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Required: CORS for browser compatibility
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.post("/process")
async def process_workflow(request: dict):
    # Your processing logic
    return {"results": [...]}

@modal.asgi_app()
def fastapi_app():
    return app
```

3. **Deploy**: `modal deploy your_app.py`

4. **Add to Frontend**: Register in `workflows.ts` with your endpoint

### Standards

- **Input**: Accept `test_mode` and `enable_google_search` parameters
- **Output**: Return structured data based on `outputType`
- **CORS**: Always include CORS middleware
- **Errors**: Use proper HTTP status codes
- **Progress**: For long operations, implement progress tracking

## Benefits

### For Users
- **Consistent Experience** - Same interface patterns across all workflows
- **Easy Discovery** - All workflows visible on homepage
- **Predictable Behavior** - Loading states, error handling, results display

### For Developers
- **Fast Development** - Add workflows in minutes, not hours
- **No UI Code** - Focus on backend logic, UI is automatic
- **Standards Compliance** - Built-in best practices
- **Scalable Architecture** - System grows with new workflows

### For Platform
- **Maintainable Codebase** - Single source of truth for UI patterns
- **Quality Assurance** - Consistent error handling and validation
- **Performance Optimized** - Shared components and efficient rendering

## File Structure

```
src/
├── components/
│   └── WorkflowBase.tsx          # Universal workflow UI component
├── config/
│   └── workflows.ts              # Workflow registry and configuration
├── pages/
│   ├── WorkflowRunner.tsx        # Universal workflow router
│   └── Index.tsx                 # Homepage with auto-workflow display
└── docs/
    ├── MODAL_APP_SCHEMA.md       # Complete backend development guide
    └── WORKFLOW_SYSTEM.md        # This document
```

## Examples

### Workflow Configuration Example
```typescript
'transform-image': {
  id: 'transform-image',
  title: 'Transform Image',
  description: 'Transform images with AI - change colors, styles, formats',
  icon: Palette,
  color: 'pink',
  
  inputs: [
    {
      id: 'image',
      label: 'Source Image',
      type: 'image',
      accept: 'image/*',
      required: true
    },
    {
      id: 'transformation',
      label: 'Transformation Type',
      type: 'select',
      options: [
        { id: 'color-change', label: 'Change Colors', value: 'color-change' },
        { id: 'upscale', label: 'Upscale/Enhance', value: 'upscale' }
      ]
    }
  ],
  
  endpoint: 'https://scaile--transform-image-fastapi-app.modal.run/process',
  outputType: 'image',
  downloadable: true
}
```

### Modal App Example
```python
@app.post("/process")
async def transform_image(request: TransformRequest):
    # Process the image transformation
    result_url = process_image(request.image, request.transformation)
    
    return {
        "url": result_url,
        "format": "png",
        "size": {"width": 512, "height": 512}
    }
```

## Testing

### Frontend Testing
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:8080/flows/your-workflow-id`
3. Test the complete user flow

### Backend Testing  
1. Test endpoint directly with curl
2. Verify CORS headers
3. Test error scenarios
4. Validate response format

## Next Steps

### For New Workflows
1. Choose a workflow from the "Coming Soon" list
2. Follow the Modal App Schema guide
3. Implement the backend processing
4. Test integration with frontend
5. Deploy and update workflow status to "live"

### For Platform Improvements
- Add more input field types as needed
- Enhance progress tracking capabilities  
- Implement workflow categories/filtering
- Add workflow analytics and monitoring

## Support

- **Frontend Issues**: Check `WorkflowBase.tsx` component
- **Backend Integration**: Read `MODAL_APP_SCHEMA.md`
- **Configuration**: Review `workflows.ts` examples
- **Testing**: Use development server for rapid iteration

---

**The Front& workflow system makes it incredibly fast to ship new AI-powered workflows while maintaining consistency and quality. Happy building! 🚀** 