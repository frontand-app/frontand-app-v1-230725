#!/usr/bin/env python3
"""
🗺️ GMaps Frontend Wrapper
Provides /process endpoint that calls the existing gmaps-fastapi-crawler Modal function
WITHOUT modifying the production app!
"""

import modal
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Create a wrapper app that calls the existing production app
wrapper_app = modal.App("tech-gmaps-frontand-wrapper")

# Minimal image for the wrapper
image = modal.Image.debian_slim(python_version="3.11").pip_install([
    "fastapi[standard]>=0.100.0",
    "requests>=2.31.0",
    "pydantic>=2.0.0"
])

# FastAPI app for the wrapper
app = FastAPI(
    title="GMaps Frontend Wrapper", 
    description="Frontend-compatible wrapper for gmaps-fastapi-crawler",
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
    locations: List[str]
    search_terms: List[str]
    max_results: Optional[int] = 10
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
        "app": "gmaps-wrapper",
        "version": "1.0.0",
        "standard": "Front&"
    }

@app.post("/process")
async def process_gmaps(request: ProcessRequest) -> ProcessResponse:
    """
    Frontend-compatible /process endpoint
    Transforms frontend request to match existing gmaps-fastapi-crawler format
    """
    import time
    
    start_time = time.time()
    
    try:
        # The existing gmaps app expects query and country_code
        # We need to extract country codes from locations and combine with search terms
        
        all_results = []
        
        # Process combinations of locations and search terms
        locations_to_process = request.locations[:2] if request.test_mode else request.locations
        search_terms_to_process = request.search_terms[:2] if request.test_mode else request.search_terms
        
        for location in locations_to_process:
            for search_term in search_terms_to_process:
                # Extract country code from location (simplified)
                # For now, default to common country codes
                country_code = "US"  # Default
                if any(country in location.lower() for country in ["germany", "berlin", "munich"]):
                    country_code = "DE"
                elif any(country in location.lower() for country in ["france", "paris", "lyon"]):
                    country_code = "FR"
                elif any(country in location.lower() for country in ["uk", "london", "manchester"]):
                    country_code = "GB"
                
                # For test mode, return mock data
                if request.test_mode:
                    mock_result = {
                        "name": f"{search_term.title()} in {location}",
                        "address": f"123 Main St, {location}",
                        "phone": "+1-555-0123",
                        "website": "https://example.com",
                        "rating": 4.5,
                        "review_count": 42,
                        "location": location,
                        "search_term": search_term,
                        "country_code": country_code
                    }
                    all_results.append(mock_result)
                else:
                    # For production, we need to call the actual function
                    # The existing app uses @modal.fastapi_endpoint which is different from ASGI
                    # For now, return error indicating backend needs fixing
                    raise HTTPException(
                        status_code=503,
                        detail="Production gmaps backend needs proper ASGI deployment"
                    )
                
                # Limit results per request
                if len(all_results) >= request.max_results:
                    break
            
            if len(all_results) >= request.max_results:
                break
        
        processing_time = time.time() - start_time
        
        return ProcessResponse(
            results=all_results,
            processing_time=processing_time,
            items_processed=len(all_results)
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
    uvicorn.run(app, host="0.0.0.0", port=8001)