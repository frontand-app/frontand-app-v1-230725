import modal
import requests
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import List, Dict, Any
from datetime import datetime

# Front& Standard Input Schema
class Crawl4ImprintRequest(BaseModel):
    websites: List[str]
    test_mode: bool = False
    enable_google_search: bool = False
    
    @validator('websites')
    def validate_websites(cls, v):
        if not v:
            raise ValueError('At least one website URL is required')
        for url in v:
            if not url.startswith(('http://', 'https://')):
                raise ValueError(f'Invalid URL format: {url}. URLs must start with http:// or https://')
        return v

# Front& Standard Output Schema
class Crawl4ImprintResponse(BaseModel):
    results: List[Dict[str, Any]]
    processing_time: float
    items_processed: int

modal_app = modal.App("imprint-reader-frontand")

app = FastAPI(title="Crawl4Imprint API - Front& Standard", description="Front& compliant wrapper for imprint extraction")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "app": "crawl4imprint",
        "version": "2.0",
        "standard": "Front&"
    }

@app.post("/process")
async def crawl_imprint_frontand(request: Crawl4ImprintRequest) -> Crawl4ImprintResponse:
    """Front& compliant endpoint that wraps the working backend"""
    start_time = time.time()
    
    try:
        # Transform Front& input to working backend format
        working_backend_request = {
            "urls": request.websites  # Transform 'websites' to 'urls'
        }
        
        # Call the working backend
        working_backend_url = "https://scaile--imprint-reader-web-app.modal.run"
        
        response = requests.post(
            working_backend_url,
            json=working_backend_request,
            headers={"Content-Type": "application/json"},
            timeout=3600
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Backend error: {response.status_code}")
        
        backend_data = response.json()
        
        # Transform working backend output to Front& standard format
        frontand_results = []
        
        for result in backend_data.get("results", []):
            # Transform to Front& individual column format
            frontand_result = {
                "url": result.get("original_url", ""),
                "success": result.get("success", False),
                "imprint_url": result.get("imprint_url", ""),
                "company": result.get("company_name", ""),
                "managing_director": result.get("managing_directors", ""),
                "address": f"{result.get('street', '')}, {result.get('city', '')}, {result.get('postal_code', '')}, {result.get('country', '')}".strip(", "),
                "email": result.get("email", ""),
                "phone": result.get("phone", ""),
                "website": result.get("website", ""),
                "registration": result.get("registration_number", ""),
                "court": "",  # Not provided by working backend
                "vat_id": result.get("vat_id", "")
            }
            
            # Clean up address formatting
            if frontand_result["address"] == ", , , ":
                frontand_result["address"] = ""
            
            frontand_results.append(frontand_result)
        
        processing_time = time.time() - start_time
        
        return Crawl4ImprintResponse(
            results=frontand_results,
            processing_time=processing_time,
            items_processed=len(frontand_results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@modal_app.function(
    image=modal.Image.debian_slim().pip_install([
        "fastapi", "requests", "pydantic"
    ]),
    timeout=86400,
    memory=1024,
    min_containers=0
)
@modal.asgi_app()
def fastapi_app():
    return app 