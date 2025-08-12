import modal
import time
import json
import asyncio
from typing import List, Dict, Any, Optional
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class FreestyleRequest(BaseModel):
    data: Dict[str, List[Any]]
    headers: List[str]
    prompt: str
    batch_size: int = 10
    enable_google_search: bool = False
    test_mode: bool = False
    mode: Optional[str] = None
    request_id: Optional[str] = None


class KeywordKombatRequest(BaseModel):
    keywords: List[str]
    company_url: str
    keyword_variable: str = "keyword"
    enable_google_search: bool = False
    test_mode: bool = False
    mode: Optional[str] = None


class ProcessResponse(BaseModel):
    results: List[Dict[str, Any]]
    processing_time: float
    items_processed: int


modal_app = modal.App("loop-over-rows-frontand")

image = modal.Image.debian_slim().pip_install([
    "fastapi",
    "pydantic",
    "requests",
    "google-generativeai",
    "asyncio-throttle"
])

app = FastAPI(title="Loop Over Rows - Front& Unified", description="Single endpoint with modes: freestyle, keyword-kombat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    return {"status": "healthy", "app": "loop-over-rows-frontand", "version": "1.0", "modes": ["freestyle", "keyword-kombat"]}


@modal_app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
    timeout=86400,
    cpu=4,
    memory=8192,
    max_containers=1,
)
@app.post("/process")
async def process_unified(body: Dict[str, Any]) -> Any:
    start = time.time()
    print(f"[unified] /process received; mode={body.get('mode')} keys={list(body.keys())}")
    # Ensure request_id exists and is forwarded downstream
    import uuid as _uuid
    rid = body.get('request_id') or str(_uuid.uuid4())
    body['request_id'] = rid

    mode = (body.get("mode") or "freestyle").strip()

    # Branch by mode
    if mode == "keyword-kombat":
        req = KeywordKombatRequest(**body)
        # TEMP: proxy to stable Kombat service until internal mode is hardened
        kombat_url = "https://scaile--keyword-kombat-frontand-fastapi-app.modal.run/process"
        try:
            proxied = requests.post(kombat_url, json={
                "keywords": req.keywords,
                "company_url": req.company_url,
                "keyword_variable": req.keyword_variable,
                "enable_google_search": req.enable_google_search,
                "test_mode": req.test_mode,
                "request_id": rid,
            }, timeout=3600)
            if proxied.status_code != 200:
                raise HTTPException(status_code=proxied.status_code, detail=f"Kombat upstream error: {proxied.text}")
            out = proxied.json()
            print(f"[unified] kombat proxy ok; items={len(out) if isinstance(out, list) else 'n/a'}")
            return out
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Keyword Kombat processing failed: {e}")

    # Default: freestyle → proxy to existing Loop Over Rows engine (single backend endpoint)
    try:
        req = FreestyleRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid freestyle request: {e}")

    proxy_url = "https://scaile--loop-over-rows-fastapi-app.modal.run/process"
    try:
        resp = requests.post(proxy_url, json={
            "data": req.data,
            "headers": req.headers,
            "prompt": req.prompt,
            "batch_size": req.batch_size,
            "enable_google_search": req.enable_google_search,
            "request_id": rid,
        }, timeout=3600)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Upstream error: {resp.text}")
        out = resp.json()
        print(f"[unified] freestyle proxy ok; keys={list(out.keys())}")
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Freestyle processing failed: {e}")


@modal_app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
    timeout=86400,
    cpu=2,
    memory=2048,
)
async def _process_keyword_kombat(keywords: List[str], company_url: str, enable_google_search: bool, test_mode: bool) -> List[Dict[str, Any]]:
    import google.generativeai as genai
    import os
    from asyncio_throttle import Throttler

    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    throttler = Throttler(rate_limit=8, period=1.0)

    # Company research
    research_prompt = f"Analysiere die Webseite {company_url} und gib JSON mit company_name, company_description, industry, target_market zurück."
    if enable_google_search:
        research_prompt = "Recherchiere im Web: " + research_prompt

    async with throttler:
        r = model.generate_content(research_prompt)
        text = (r.text or "{}").strip()
        if "```" in text:
            try:
                text = text.split("```json")[1].split("```")[0]
            except Exception:
                try:
                    text = text.split("```")[1].split("```")[0]
                except Exception:
                    pass
        try:
            company = json.loads(text)
        except Exception:
            company = {
                "company_name": company_url.replace('https://', '').replace('http://', '').split('/')[0],
                "company_description": f"Unternehmen unter {company_url}",
                "industry": "",
                "target_market": ""
            }

    tpl = f"""INPUT:\nKeyword: "{{{{ keyword }}}}"\n\nSYSTEM:\nDu agierst als deutschsprachiger SEO-Analyst für **{company.get('company_name','')}** – {company.get('company_description','')}.\n\nGib ausschließlich JSON zurück:\n{{\n  "Keyword": "<keyword>",\n  "RelevanceScore": <integer>,\n  "Rationale": "<1–2 Sätze>"\n}}"""

    async def score_kw(kw: str) -> Optional[Dict[str, Any]]:
        try:
            async with throttler:
                prompt = tpl.replace("{{ keyword }}", kw)
                resp = model.generate_content(prompt)
                txt = (resp.text or "{}").strip()
                if "```" in txt:
                    try:
                        txt = txt.split("```json")[1].split("```")[0]
                    except Exception:
                        try:
                            txt = txt.split("```")[1].split("```")[0]
                        except Exception:
                            pass
                obj = json.loads(txt)
                if isinstance(obj.get("RelevanceScore"), (int, float)):
                    obj["RelevanceScore"] = int(max(10, min(100, obj["RelevanceScore"])) )
                return obj
        except Exception:
            return None

    results: List[Dict[str, Any]] = []
    batch = (keywords[:3] if test_mode else keywords)
    tasks = [score_kw(k) for k in batch]
    out = await asyncio.gather(*tasks)
    for item in out:
        if item and item.get("RelevanceScore", 0) >= 80:
            results.append(item)
    return results


@modal_app.function(image=image, timeout=86400, memory=1024, min_containers=0)
@modal.asgi_app()
def fastapi_app():
    return app

