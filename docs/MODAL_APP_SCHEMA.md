# Front& Modal App Development Schema

## Overview

This document defines the standardized schema for creating Modal apps that integrate seamlessly with the Front& platform. Following these standards ensures your workflows are consistent, maintainable, and provide excellent user experience.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Input Standards](#input-standards)
3. [Output Standards](#output-standards)
4. [Processing Types](#processing-types)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Example Implementation](#example-implementation)

## Quick Start

### 1. Workflow Registration

First, register your workflow in `src/config/workflows.ts`:

```typescript
'your-workflow-id': {
  id: 'your-workflow-id',
  title: 'Your Workflow Name',
  description: 'Brief description of what your workflow does',
  icon: YourIcon, // Lucide React icon
  color: 'blue', // blue, green, purple, etc.
  
  inputs: [
    // Define your input fields (see Input Standards below)
  ],
  
  templates: [
    // Optional: predefined templates for users
  ],
  
  endpoint: 'https://your-username--your-app-name-fastapi-app.modal.run/process',
  supportsGoogleSearch: true, // Optional
  supportsTestMode: true, // Optional
  
  estimatedTime: {
    base: 15, // Base processing time in seconds
    perItem: 5, // Additional time per item (for batch processing)
    withSearch: 8 // Additional time when Google Search is enabled
  },
  
  outputType: 'table', // 'table', 'json', 'text', 'image', 'file'
  downloadable: true // Whether results can be downloaded
}
```

### 2. Modal App Structure

```python
import modal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

# Define your input model
class WorkflowRequest(BaseModel):
    # Standard fields
    test_mode: Optional[bool] = False
    enable_google_search: Optional[bool] = False
    
    # Your custom fields based on workflow.inputs
    your_field: str
    optional_field: Optional[str] = None

# Define your output model
class WorkflowResponse(BaseModel):
    # For table output
    results: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    
    # For other output types
    content: Optional[str] = None
    url: Optional[str] = None
    
    # Metadata
    processing_time: Optional[float] = None
    items_processed: Optional[int] = None

app = FastAPI()

# Required: CORS middleware for browser compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process_workflow(request: WorkflowRequest) -> WorkflowResponse:
    # Your processing logic here
    pass
```

## Input Standards

### Field Types

The platform supports the following input field types:

#### Text Fields
```typescript
{
  id: 'field_id',
  label: 'Field Label',
  type: 'text',
  placeholder: 'Example text...',
  required: true,
  helpText: 'Additional help text for users'
}
```

#### Textarea Fields
```typescript
{
  id: 'description',
  label: 'Description',
  type: 'textarea',
  placeholder: 'Enter detailed description...',
  required: false
}
```

#### URL Fields
```typescript
{
  id: 'website_url',
  label: 'Website URL',
  type: 'url',
  placeholder: 'https://example.com',
  required: true,
  validation: (value) => {
    if (!value.startsWith('http')) return 'URL must start with http:// or https://';
    return null;
  }
}
```

#### File Upload Fields
```typescript
{
  id: 'image_file',
  label: 'Upload Image',
  type: 'file',
  accept: 'image/*', // or specific types like '.jpg,.png'
  required: true,
  helpText: 'Supported formats: JPG, PNG, WebP'
}
```

#### CSV Fields
```typescript
{
  id: 'csv_data',
  label: 'CSV Data',
  type: 'csv',
  required: true,
  helpText: 'Include headers in the first row'
}
```

#### Select Fields
```typescript
{
  id: 'output_format',
  label: 'Output Format',
  type: 'select',
  options: [
    { id: 'png', label: 'PNG', value: 'png' },
    { id: 'jpg', label: 'JPG', value: 'jpg' }
  ],
  required: true
}
```

#### Multi-Select Fields
```typescript
{
  id: 'features',
  label: 'Features to Extract',
  type: 'multiselect',
  options: [
    { id: 'emails', label: 'Email Addresses', value: 'emails' },
    { id: 'phones', label: 'Phone Numbers', value: 'phones' }
  ],
  required: true
}
```

### Input Validation

```typescript
// Custom validation function
validation: (value: any) => {
  if (value.length < 3) return 'Must be at least 3 characters';
  if (!/^[a-zA-Z]+$/.test(value)) return 'Only letters allowed';
  return null; // null means validation passed
}
```

## Output Standards

### Table Output (Recommended for Data Processing)

```python
# For workflows that process multiple items
class TableResponse(BaseModel):
    results: List[Dict[str, Any]]  # Array of objects
    columns: Optional[List[str]] = None  # Optional column definitions
    
# Example response
{
    "results": [
        {"name": "John Doe", "email": "john@example.com", "score": 8.5},
        {"name": "Jane Smith", "email": "jane@example.com", "score": 9.2}
    ],
    "columns": ["name", "email", "score"]
}
```

### JSON Output (for Complex Data)

```python
class JsonResponse(BaseModel):
    content: Dict[str, Any]
    
# Example response
{
    "content": {
        "analysis": {...},
        "recommendations": [...],
        "metadata": {...}
    }
}
```

### Text Output (for Generated Content)

```python
class TextResponse(BaseModel):
    content: str
    
# Example response
{
    "content": "Generated blog post content here..."
}
```

### Image Output (for Image Processing)

```python
class ImageResponse(BaseModel):
    url: str  # Public URL to the image
    format: str
    size: Optional[Dict[str, int]] = None
    
# Example response
{
    "url": "https://your-storage.com/image.png",
    "format": "png",
    "size": {"width": 512, "height": 512}
}
```

### File Output (for Generated Files)

```python
class FileResponse(BaseModel):
    url: str  # Download URL
    filename: str
    size: int  # File size in bytes
    format: str
    
# Example response
{
    "url": "https://your-storage.com/report.pdf",
    "filename": "analysis_report.pdf",
    "size": 1024000,
    "format": "pdf"
}
```

## Processing Types

### 1. Fast Synchronous Processing (< 30 seconds)

For quick operations that complete within 30 seconds:

```python
@app.post("/process")
async def process_workflow(request: WorkflowRequest) -> WorkflowResponse:
    start_time = time.time()
    
    # Your processing logic
    results = process_data(request.data)
    
    processing_time = time.time() - start_time
    
    return WorkflowResponse(
        results=results,
        processing_time=processing_time,
        items_processed=len(results)
    )
```

### 2. Async Processing with Polling (> 30 seconds)

For longer operations, use async processing:

```python
from modal import Dict as ModalDict

# Shared state for tracking jobs
job_storage = ModalDict()

class AsyncJobResponse(BaseModel):
    job_id: str
    status: str  # 'processing', 'completed', 'failed'
    estimated_completion: Optional[int] = None  # seconds

@app.post("/process")
async def start_async_process(request: WorkflowRequest) -> AsyncJobResponse:
    job_id = generate_job_id()
    
    # Start processing in background
    process_async.spawn(job_id, request)
    
    return AsyncJobResponse(
        job_id=job_id,
        status="processing",
        estimated_completion=estimate_time(request)
    )

@app.get("/status/{job_id}")
async def get_job_status(job_id: str) -> AsyncJobResponse:
    job_data = job_storage.get(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return AsyncJobResponse(**job_data)

@app.get("/results/{job_id}")
async def get_job_results(job_id: str) -> WorkflowResponse:
    job_data = job_storage.get(job_id)
    
    if not job_data or job_data["status"] != "completed":
        raise HTTPException(status_code=404, detail="Results not ready")
    
    return WorkflowResponse(**job_data["results"])

@modal.function()
async def process_async(job_id: str, request: WorkflowRequest):
    # Update status
    job_storage[job_id] = {"status": "processing", "progress": 0}
    
    try:
        # Your long-running processing
        results = long_process(request)
        
        # Store results
        job_storage[job_id] = {
            "status": "completed",
            "results": results.dict()
        }
    except Exception as e:
        job_storage[job_id] = {
            "status": "failed",
            "error": str(e)
        }
```

### 3. Real-time Progress Updates

For operations where users need progress feedback:

```python
@app.get("/progress/{job_id}")
async def get_progress(job_id: str):
    job_data = job_storage.get(job_id)
    
    return {
        "progress": job_data.get("progress", 0),  # 0-100
        "current_step": job_data.get("current_step", ""),
        "estimated_remaining": job_data.get("estimated_remaining", 0)
    }

# In your processing function, update progress
async def process_with_progress(job_id: str, items: List[Any]):
    total_items = len(items)
    
    for i, item in enumerate(items):
        # Process item
        result = process_item(item)
        
        # Update progress
        progress = int((i + 1) / total_items * 100)
        job_storage[job_id] = {
            **job_storage[job_id],
            "progress": progress,
            "current_step": f"Processing item {i+1}/{total_items}"
        }
```

## Error Handling

### Standard Error Response

```python
from fastapi import HTTPException
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None

# Usage
@app.post("/process")
async def process_workflow(request: WorkflowRequest):
    try:
        # Validation errors
        if not request.required_field:
            raise HTTPException(
                status_code=400, 
                detail="Required field is missing"
            )
        
        # Processing errors
        results = process_data(request.data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )
```

### Error Categories

1. **400 Bad Request**: Invalid input, validation errors
2. **401 Unauthorized**: Authentication required
3. **403 Forbidden**: Insufficient permissions
4. **404 Not Found**: Resource not found
5. **429 Too Many Requests**: Rate limiting
6. **500 Internal Server Error**: Processing failures

## Best Practices

### 1. Input Validation

```python
from pydantic import validator

class WorkflowRequest(BaseModel):
    urls: List[str]
    
    @validator('urls')
    def validate_urls(cls, v):
        if not v:
            raise ValueError('At least one URL is required')
        
        for url in v:
            if not url.startswith(('http://', 'https://')):
                raise ValueError(f'Invalid URL: {url}')
        
        return v
```

### 2. Progress Tracking

```python
async def process_with_tracking(items: List[Any], job_id: str):
    for i, item in enumerate(items):
        # Update progress
        update_progress(job_id, i / len(items), f"Processing {item.name}")
        
        # Process item
        result = await process_item(item)
        
        yield result
```

### 3. Resource Management

```python
@modal.function(
    timeout=3600,  # 1 hour timeout
    memory=1024,   # 1GB memory
    cpu=2.0        # 2 CPU cores
)
async def heavy_processing(data):
    # Resource-intensive processing
    pass
```

### 4. Caching

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def expensive_operation(input_hash: str):
    # Cache expensive operations
    return process(input_hash)
```

### 5. Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/process")
@limiter.limit("10/minute")  # 10 requests per minute
async def process_workflow(request: Request, data: WorkflowRequest):
    # Your processing logic
    pass
```

## Example Implementation

### Complete Modal App Example

```python
import modal
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import List, Dict, Any, Optional

# Modal setup
stub = modal.Stub("crawl4logo")

# Input model
class Crawl4LogoRequest(BaseModel):
    urls: List[str]
    format: str = "png"
    size: str = "512"
    test_mode: bool = False
    enable_google_search: bool = False
    
    @validator('urls')
    def validate_urls(cls, v):
        if not v:
            raise ValueError('At least one URL is required')
        return v

# Output model
class Crawl4LogoResponse(BaseModel):
    results: List[Dict[str, Any]]
    processing_time: float
    items_processed: int

# FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def crawl_logos(request: Crawl4LogoRequest) -> Crawl4LogoResponse:
    start_time = time.time()
    
    try:
        # Limit URLs in test mode
        urls_to_process = request.urls[:1] if request.test_mode else request.urls
        
        # Process each URL
        results = []
        for url in urls_to_process:
            try:
                logo_data = extract_logo(url, request.format, request.size)
                results.append({
                    "url": url,
                    "logo_url": logo_data["logo_url"],
                    "size": logo_data["size"],
                    "format": request.format,
                    "status": "success"
                })
            except Exception as e:
                results.append({
                    "url": url,
                    "error": str(e),
                    "status": "failed"
                })
        
        processing_time = time.time() - start_time
        
        return Crawl4LogoResponse(
            results=results,
            processing_time=processing_time,
            items_processed=len(results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_logo(url: str, format: str, size: str) -> Dict[str, Any]:
    # Your logo extraction logic here
    # This is a placeholder implementation
    return {
        "logo_url": f"https://storage.example.com/logo_{hash(url)}.{format}",
        "size": {"width": int(size), "height": int(size)}
    }

# Deploy the app
@stub.function(
    image=modal.Image.debian_slim().pip_install([
        "fastapi",
        "requests",
        "beautifulsoup4",
        "pillow"
    ]),
    timeout=300,
    memory=512
)
@modal.asgi_app()
def fastapi_app():
    return app
```

### Deployment

```bash
# Deploy your Modal app
modal deploy your_app.py

# Your endpoint will be available at:
# https://your-username--your-app-name-fastapi-app.modal.run/process
```

## Testing Your Integration

### 1. Test Endpoint Manually

```bash
curl -X POST "https://your-username--your-app-name-fastapi-app.modal.run/process" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://stripe.com"],
    "format": "png",
    "size": "512",
    "test_mode": true
  }'
```

### 2. Test with Front& Platform

1. Add your workflow to `src/config/workflows.ts`
2. Run the development server: `npm run dev`
3. Navigate to `http://localhost:8080/flows/your-workflow-id`
4. Test the complete user flow

### 3. Error Testing

Test various error scenarios:
- Invalid input data
- Network timeouts
- Server errors
- Rate limiting

## Support

For questions or issues with Modal app integration:

1. Check the [Modal documentation](https://modal.com/docs)
2. Review existing workflow implementations in the codebase
3. Test your endpoint independently before integration
4. Ensure CORS is properly configured

---

**Happy building! 🚀** 