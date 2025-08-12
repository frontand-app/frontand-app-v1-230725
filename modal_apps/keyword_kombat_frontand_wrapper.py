import modal
import json
import asyncio
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime

# Front& Standard Input Schema
class KeywordKombatRequest(BaseModel):
    keywords: List[str]
    company_url: str
    keyword_variable: str = "keyword"
    test_mode: bool = False
    enable_google_search: bool = False
    
    @validator('keywords')
    def validate_keywords(cls, v):
        if not v:
            raise ValueError('At least one keyword is required')
        return v
    
    @validator('company_url')
    def validate_company_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('Company URL must start with http:// or https://')
        return v

# Front& Standard Output Schema
class KeywordKombatResponse(BaseModel):
    results: List[Dict[str, Any]]
    processing_time: float
    items_processed: int

modal_app = modal.App("keyword-kombat-frontand")

# Image with required dependencies
image = modal.Image.debian_slim().pip_install([
    "fastapi",
    "pydantic", 
    "google-generativeai",
    "aiohttp",
    "asyncio-throttle",
    "requests"
])

app = FastAPI(title="Keyword Kombat API - Front& Standard", description="Front& compliant wrapper for keyword scoring")

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
        "app": "keyword-kombat",
        "version": "1.0",
        "standard": "Front&"
    }

@modal_app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
    max_containers=10,
    timeout=86400,
    cpu=2,
    memory=2048
)
async def process_keywords_with_company_research(keywords: List[str], company_url: str, enable_google_search: bool = False) -> List[Dict[str, Any]]:
    """
    Process keywords with company research and German SEO scoring
    """
    import google.generativeai as genai
    import os
    import requests
    from asyncio_throttle import Throttler
    
    # Configure Gemini
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    
    # Create throttler to respect API limits
    throttler = Throttler(rate_limit=8, period=1.0)  # 8 requests per second to be safe
    
    # Step 1: Research the company
    company_research_prompt = f"""
Analysiere die Webseite {company_url} und erstelle eine prägnante Unternehmensbeschreibung auf Deutsch.

Gib mir folgende Informationen in diesem exakten JSON-Format zurück:

{{
  "company_name": "<Firmenname>",
  "company_description": "<Detaillierte Beschreibung der Produkte, Dienstleistungen, Zielgruppe und Branche in 2-3 Sätzen>",
  "industry": "<Hauptbranche>",
  "target_market": "<Zielgruppe/Markt>"
}}

Wichtig: Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.
"""
    
    try:
        print(f"🔍 Researching company: {company_url}")
        
        # Add Google Search enhancement if enabled
        if enable_google_search:
            search_prompt = f"Recherchiere online Informationen über die Firma unter {company_url}. " + company_research_prompt
        else:
            search_prompt = company_research_prompt
            
        async with throttler:
            company_response = model.generate_content(search_prompt)
            company_info_text = company_response.text.strip()
            
            # Parse company info
            try:
                # Clean the response
                cleaned_response = company_info_text
                if "```json" in cleaned_response:
                    cleaned_response = cleaned_response.split("```json")[1].split("```")[0]
                elif "```" in cleaned_response:
                    cleaned_response = cleaned_response.split("```")[1].split("```")[0]
                
                company_info = json.loads(cleaned_response)
                print(f"✅ Company research completed: {company_info.get('company_name', 'Unknown')}")
                
            except json.JSONDecodeError:
                # Fallback company info
                company_info = {
                    "company_name": company_url.replace('https://', '').replace('http://', '').split('/')[0],
                    "company_description": f"Unternehmen unter {company_url}",
                    "industry": "Unbekannt",
                    "target_market": "B2B/B2C"
                }
                print("⚠️ Using fallback company info due to parsing error")
                
    except Exception as e:
        print(f"❌ Company research failed: {str(e)}")
        # Fallback company info
        company_info = {
            "company_name": company_url.replace('https://', '').replace('http://', '').split('/')[0],
            "company_description": f"Unternehmen unter {company_url}",
            "industry": "Unbekannt", 
            "target_market": "B2B/B2C"
        }
    
    # Step 2: Create the German SEO prompt template with company context
    german_seo_prompt_template = f"""INPUT:
Keyword: "{{{{ keyword }}}}"

SYSTEM:
Du agierst als deutschsprachiger SEO-Analyst und Keyword-Bewertungsexperte für **{company_info.get('company_name', 'das Unternehmen')}** – {company_info.get('company_description', 'ein Unternehmen')}.

────────────────────────────────────────
📌   UNTERNEHMENS-KONTEXT  (BITTE BEI JEDEM SCORE BERÜCKSICHTIGEN)
────────────────────────────────────────
• Unternehmen: {company_info.get('company_name', 'Unbekannt')}
• Beschreibung: {company_info.get('company_description', 'Keine Beschreibung verfügbar')}
• Branche: {company_info.get('industry', 'Unbekannt')}
• Zielmarkt: {company_info.get('target_market', 'Unbekannt')}

────────────────────────────────────────
🎯   AUFGABE
────────────────────────────────────────
Du erhältst ein Keyword. Bewerte es für die Relevanz zum Unternehmen:

1. Vergib einen **RelevanceScore** (10 – 100, ganze Zahl).
2. Füge eine **Rationale** (≤ 2 Sätze) hinzu, warum der Score vergeben wurde.

────────────────────────────────────────
🧮   SCORING-RUBRIK  (PLUS-PUNKTE → MINUS-ABZÜGE)
────────────────────────────────────────

🟢  DIREKTE PRODUKT-/MARKEN-ÜBEREINSTIMMUNG  (max = 50)
+50  Enthält Firmennamen oder exakte Produktnamen
+45  Sehr spezifische Produkt-/Dienstleistungsbegriffe des Unternehmens
+40  Branchenspezifische Fachbegriffe mit direktem Bezug
+30  Allgemeine Branchenbegriffe

🔵  ZIELGRUPPEN- UND MARKT-FIT  (max = 25)
+15  Begriffe, die die exakte Zielgruppe des Unternehmens ansprechen
+10  Allgemeine Zielgruppenbegriffe der Branche
+5   Keywords sind auf Deutsch (bevorzugt) oder Englisch

🟣  KOMMERZIELLER INTENT  (max = 15)
+10  Kaufabsicht erkennbar ("kaufen", "Anbieter", "Lösung", "Service")
+5   Informationsabsicht mit kommerziellem Potenzial

🟠  WETTBEWERBSPOSITION  (max = 10)
+10  Keyword mit geringer Konkurrenz aber hoher Relevanz
+5   Standard-Branchenkeyword

────────────────────────────────────────
🚫   PENALTIES  (nach Addition anwenden; Mindestscore = 10)
────────────────────────────────────────
**Irrelevante Themen**
–50  Keyword hat keinen Bezug zur Branche oder den Produkten des Unternehmens

**Zu allgemein**
–30  Sehr allgemeine Begriffe ohne spezifischen Unternehmensbezug

**Falsche Zielgruppe**
–20  Keywords sprechen eine völlig andere Zielgruppe an

**Negative Begriffe**
–30  "Problem", "funktioniert nicht", "Beschwerden" ohne Lösungsbezug

────────────────────────────────────────
💡   FORMEL
────────────────────────────────────────
Final RelevanceScore = (DIREKT + ZIELGRUPPE + KOMMERZIELL + WETTBEWERB) – PENALTIES
• Obergrenze = 100, Untergrenze = 10 (alles < 10 ⇒ 10).

────────────────────────────────────────
📦   OUTPUT-FORMAT  (STRICT)
────────────────────────────────────────
Gib **ausschließlich** diese JSON-Struktur zurück – keinerlei Text davor oder danach:

{{
  "Keyword": "<keyword text>",
  "RelevanceScore": <integer>,
  "Rationale": "<1–2 sentences>"
}}

REGELN:
• Bewerte das Keyword objektiv basierend auf der Unternehmensrelevanz
• Score zwischen 10-100
• Rationale auf Deutsch, maximal 2 Sätze
• Kein Kommentar außerhalb des JSON-Objekts
• JSON muss syntaktisch valide sein
"""

    # Step 3: Process each keyword
    results = []
    successful_count = 0
    failed_count = 0
    
    async def process_single_keyword(keyword: str) -> Optional[Dict[str, Any]]:
        """Process a single keyword with the AI model"""
        nonlocal successful_count, failed_count
        
        try:
            async with throttler:
                # Build the prompt for this keyword
                prompt = german_seo_prompt_template.replace("{{ keyword }}", keyword)
                
                print(f"🔍 Processing keyword: {keyword}")
                
                # Generate response with retries
                max_retries = 3
                response = None
                
                for attempt in range(max_retries):
                    try:
                        response = model.generate_content(prompt)
                        break
                    except Exception as e:
                        print(f"Attempt {attempt + 1} failed for keyword '{keyword}': {str(e)}")
                        if attempt == max_retries - 1:
                            raise e
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                
                if not response or not response.text:
                    print(f"❌ Empty response for keyword: {keyword}")
                    failed_count += 1
                    return None
                
                # Parse the response
                parsed_result = parse_ai_response(response.text.strip())
                
                if parsed_result and 'RelevanceScore' in parsed_result:
                    score = parsed_result.get('RelevanceScore', 0)
                    if isinstance(score, int) and 10 <= score <= 100:
                        print(f"✅ {keyword}: Score {score}")
                        successful_count += 1
                        return parsed_result
                
                print(f"❌ Failed to parse valid response for keyword: {keyword}")
                failed_count += 1
                return None
                
        except Exception as e:
            print(f"Error processing keyword {keyword}: {str(e)}")
            failed_count += 1
            return None
    
    # Process keywords in batches of 5
    batch_size = 5
    for i in range(0, len(keywords), batch_size):
        batch = keywords[i:i + batch_size]
        
        # Process batch concurrently
        tasks = [process_single_keyword(keyword) for keyword in batch]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect successful results
        for result in batch_results:
            if isinstance(result, dict) and result is not None:
                # Only include results with score >= 80
                if result.get('RelevanceScore', 0) >= 80:
                    results.append(result)
    
    print(f"🎉 Processing complete! {successful_count} successful, {failed_count} failed")
    print(f"📊 {len(results)} keywords scored ≥80 points")
    
    return results

def parse_ai_response(response_text: str) -> Optional[Dict[str, Any]]:
    """Parse the AI response and extract structured data"""
    try:
        # Clean the response text
        cleaned = response_text.strip()
        
        # Remove code fences
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        
        # Clean up common prefixes
        import re
        cleaned = re.sub(r'^(json|JSON|response|Response):\s*', '', cleaned)
        cleaned = cleaned.strip()
        
        # Try to parse as JSON
        result = json.loads(cleaned)
        
        # Validate required fields
        if 'Keyword' in result and 'RelevanceScore' in result and 'Rationale' in result:
            # Ensure score is an integer
            if isinstance(result['RelevanceScore'], (int, float)):
                result['RelevanceScore'] = int(result['RelevanceScore'])
                # Clamp score between 10 and 100
                result['RelevanceScore'] = max(10, min(100, result['RelevanceScore']))
                return result
        
        return None
        
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"JSON parse error: {e}")
        return None

@app.post("/process")
async def keyword_kombat_frontand(request: KeywordKombatRequest) -> KeywordKombatResponse:
    """Front& compliant endpoint for keyword scoring"""
    start_time = time.time()
    
    try:
        if request.test_mode:
            # Return mock data for test mode
            mock_results = []
            for i, keyword in enumerate(request.keywords[:3]):  # Only process first 3 in test mode
                score = 85 + (i * 5)  # Generate scores 85, 90, 95
                mock_results.append({
                    "Keyword": keyword,
                    "RelevanceScore": score,
                    "Rationale": f"Hohe Relevanz für {request.company_url.split('//')[1].split('/')[0]} aufgrund starker Branchenbezug."
                })
            
            processing_time = time.time() - start_time
            
            return KeywordKombatResponse(
                results=mock_results,
                processing_time=processing_time,
                items_processed=len(mock_results)
            )
        
        # Process keywords with the Loop Over Rows backend
        results = await process_keywords_with_company_research.remote(
            keywords=request.keywords,
            company_url=request.company_url,
            enable_google_search=request.enable_google_search
        )
        
        processing_time = time.time() - start_time
        
        return KeywordKombatResponse(
            results=results,
            processing_time=processing_time,
            items_processed=len(results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@modal_app.function(
    image=image,
    timeout=86400,
    memory=1024,
    min_containers=0
)
@modal.asgi_app()
def fastapi_app():
    return app