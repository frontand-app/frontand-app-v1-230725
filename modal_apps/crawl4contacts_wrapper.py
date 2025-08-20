#!/usr/bin/env python3
"""
🔗 Crawl4Contacts Frontend Wrapper
Provides /process endpoint that calls the existing crawl4contacts-v2 Modal function
WITHOUT modifying the production app!
"""

import modal
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Create a wrapper app that calls the existing production app
wrapper_app = modal.App("tech-crawl4contacts-frontand-wrapper")

# Minimal image for the wrapper
image = modal.Image.debian_slim(python_version="3.11").pip_install([
    "fastapi[standard]>=0.100.0",
    "requests>=2.31.0",
    "pydantic>=2.0.0"
])

# FastAPI app for the wrapper
app = FastAPI(
    title="Crawl4Contacts Frontend Wrapper", 
    description="Frontend-compatible wrapper for crawl4contacts-v2",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models matching our frontend adapter
class ProcessRequest(BaseModel):
    companies: List[str]
    contact_types: List[str]
    test_mode: Optional[bool] = False
    enable_google_search: Optional[bool] = False
    config: Optional[Dict[str, Any]] = None

class ProcessResponse(BaseModel):
    results: List[Dict[str, Any]]
    processing_time: float
    items_processed: int

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "crawl4contacts-wrapper",
        "version": "1.0.0",
        "standard": "Front&"
    }

@app.post("/process")
async def process_contacts(request: ProcessRequest) -> ProcessResponse:
    """
    Frontend-compatible /process endpoint
    Transforms frontend request to match existing crawl4contacts-v2 format
    """
    import time
    import requests
    
    start_time = time.time()
    
    try:
        # Transform companies list to URLs (add https:// if needed)
        urls = []
        for company in request.companies:
            if company.startswith(('http://', 'https://')):
                urls.append(company)
            else:
                # For company names, we'll treat them as search terms
                # The existing app can handle both URLs and company names
                urls.append(company)
        
        # Prepare request for existing crawl4contacts app
        # Using the /extract endpoint which is synchronous
        payload = {
            "job_id": f"frontend-{int(time.time())}",
            "urls": urls[:3] if request.test_mode else urls,  # Limit for test mode
            "options": {
                "contact_types": request.contact_types,
                "timeout": 30 if request.test_mode else 60,
                "max_pages_per_url": 1 if request.test_mode else 3,
                "enable_google_search": request.enable_google_search
            }
        }
        
        # Call the existing production app (note: this is internal Modal function call)
        # Since the existing app has ASGI issues, we'll provide mock data for now
        # TODO: Fix once the ASGI deployment is resolved
        
        if request.test_mode:
            # Return mock data for testing
            mock_results = [
                {
                    "company": request.companies[0] if request.companies else "Test Company",
                    "email": "contact@example.com",
                    "phone": "+1-555-0123",
                    "name": "John Doe",
                    "position": "CEO",
                    "department": "Executive",
                    "source_url": urls[0] if urls else "https://example.com",
                    "confidence": 0.85
                }
            ]
        else:
            # For production, we need to call the actual function
            # For now, return error indicating backend needs fixing
            raise HTTPException(
                status_code=503,
                detail="Production crawl4contacts backend needs ASGI deployment fix"
            )
        
        processing_time = time.time() - start_time
        
        return ProcessResponse(
            results=mock_results,
            processing_time=processing_time,
            items_processed=len(mock_results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# Mount the FastAPI app
@wrapper_app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    return app

if __name__ == "__main__":
    # For local testing
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)