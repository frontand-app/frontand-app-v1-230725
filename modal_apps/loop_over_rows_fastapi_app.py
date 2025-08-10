import modal
import time
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple

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


class KeywordKombatRequest(BaseModel):
    keywords: List[str]
    company_url: str
    keyword_variable: str = "keyword"
    enable_google_search: bool = False
    test_mode: bool = False
    mode: Optional[str] = None


modal_app = modal.App("loop-over-rows")

image = modal.Image.debian_slim().pip_install([
    "fastapi",
    "pydantic",
    "google-generativeai",
    "asyncio-throttle",
])

app = FastAPI(title="Loop Over Rows (Unified)", description="Single endpoint with modes: freestyle, keyword-kombat")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health():
    return {"status": "healthy", "app": "loop-over-rows", "version": "1.0", "modes": ["freestyle", "keyword-kombat"]}


class ProcessingResponse(BaseModel):
    results: Any
    processing_time: float
    items_processed: int


@modal_app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
    timeout=1800,
    cpu=2,
    memory=4096,
)
async def process_rows_freestyle(request: FreestyleRequest) -> Dict[str, Any]:
    """Process freestyle mode using Gemini per row."""
    import google.generativeai as genai
    import os
    from asyncio_throttle import Throttler

    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    throttler = Throttler(rate_limit=8, period=1.0)

    async def run_row(row_key: str, row_values: List[Any]) -> Optional[Tuple[str, Dict[str, Any]]]:
        try:
            row_dict = {h: v for h, v in zip(request.headers, row_values)}
            prompt = f"Row: {json.dumps(row_dict)}\n\nInstructions: {request.prompt}\n\nReturn strict JSON only."
            async with throttler:
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
            if not isinstance(obj, dict):
                obj = {"output": obj}
            return row_key, obj
        except Exception:
            return None

    items = list(request.data.items())
    results: List[Dict[str, Any]] = []
    for i in range(0, len(items), request.batch_size):
        batch = items[i:i+request.batch_size]
        outs = await asyncio.gather(*[run_row(k, v) for k, v in batch])
        for out in outs:
            if out is None:
                continue
            row_key, obj = out
            results.append({"row_key": row_key, **obj})

    return {"success": True, "results": results, "processed_count": len(results), "total_count": len(request.data)}


@modal_app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
    timeout=900,
    cpu=2,
    memory=2048,
)
async def process_keyword_kombat(req: KeywordKombatRequest) -> List[Dict[str, Any]]:
    import google.generativeai as genai
    import os
    from asyncio_throttle import Throttler

    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    throttler = Throttler(rate_limit=8, period=1.0)

    research_prompt = f"Analysiere {req.company_url} und gib JSON mit company_name, company_description zurück."
    if req.enable_google_search:
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
        company = {"company_name": req.company_url}

    tpl = f"""INPUT:\nKeyword: "{{{{ keyword }}}}"\n\nSYSTEM:\nDu agierst als deutschsprachiger SEO-Analyst für **{company.get('company_name','')}** – {company.get('company_description','')}.\n\nGib ausschließlich JSON zurück:\n{{\n  \"Keyword\": \"<keyword>\",\n  \"RelevanceScore\": <integer>,\n  \"Rationale\": \"<1–2 Sätze>\"\n}}"""

    async def score(kw: str) -> Optional[Dict[str, Any]]:
        try:
            async with throttler:
                resp = model.generate_content(tpl.replace("{{ keyword }}", kw))
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
            score = obj.get("RelevanceScore", 0)
            if isinstance(score, (int, float)):
                obj["RelevanceScore"] = int(max(10, min(100, score)))
            return obj
        except Exception:
            return None

    kws = req.keywords[:3] if req.test_mode else req.keywords
    outs = await asyncio.gather(*[score(k) for k in kws])
    # Prefer high-confidence results
    results_raw = [o for o in outs if o]
    results = [o for o in results_raw if o.get("RelevanceScore", 0) >= 80]
    if not results:
        if req.test_mode:
            # Ensure UI has data in test mode
            return [{"Keyword": kw, "RelevanceScore": 90, "Rationale": "Testmodus: Beispielausgabe für die UI"} for kw in kws]
        # Relax threshold slightly in production if nothing clears 80
        results = [o for o in results_raw if o.get("RelevanceScore", 0) >= 50]
    return results


@modal_app.function(image=image, timeout=300, memory=1024, min_containers=0)
@modal.asgi_app()
def fastapi_app():
    return app


@app.post("/process")
async def process_unified(body: Dict[str, Any]):
    start = time.time()
    mode = (body.get("mode") or "freestyle").strip()
    try:
        if mode == "keyword-kombat":
            req = KeywordKombatRequest(**body)
            results = process_keyword_kombat.remote(req)
            return ProcessingResponse(results=results, processing_time=time.time() - start, items_processed=len(results))
        # freestyle
        req = FreestyleRequest(**body)
        out = process_rows_freestyle.remote(req)
        # passthrough existing structure
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")

