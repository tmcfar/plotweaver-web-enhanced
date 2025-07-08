"""Worldbuilding endpoints for BFF layer."""

import asyncio
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, HTTPException, Request

from .constants import BACKEND_URL

router = APIRouter(prefix="/api/worldbuilding", tags=["worldbuilding"])

# HTTP client for backend calls
client = httpx.AsyncClient(
    base_url=BACKEND_URL,
    timeout=30.0,
    follow_redirects=True
)


@router.post("/analyze-concept")
async def analyze_concept(request: Request) -> Dict[str, Any]:
    """Analyze story concept and create setup plan."""
    try:
        data = await request.json()
        
        # Forward to backend
        response = await client.post(
            "/api/v1/analyze-concept",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Backend error")
            )
        
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/setup-progress")
async def get_setup_progress(project_path: Optional[str] = None) -> Dict[str, Any]:
    """Get current worldbuilding setup progress."""
    try:
        params = {}
        if project_path:
            params["project_path"] = project_path
            
        response = await client.get(
            "/api/v1/setup-progress",
            params=params
        )
        
        if response.status_code == 404:
            return {
                "has_worldbuilding": False,
                "message": "No worldbuilding setup found"
            }
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Backend error")
            )
        
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/setup-steps/{step_id}/complete")
async def complete_setup_step(step_id: str, request: Request) -> Dict[str, Any]:
    """Complete a worldbuilding setup step."""
    try:
        data = await request.json()
        
        response = await client.post(
            f"/api/v1/setup-steps/{step_id}/complete",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Backend error")
            )
        
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/assumptions/{assumption_key}/override")
async def override_assumption(assumption_key: str, request: Request) -> Dict[str, Any]:
    """Override a worldbuilding assumption."""
    try:
        data = await request.json()
        
        response = await client.put(
            f"/api/v1/assumptions/{assumption_key}/override",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Backend error")
            )
        
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/setup-paths")
async def get_setup_paths() -> Dict[str, Any]:
    """Get available worldbuilding setup paths."""
    try:
        response = await client.get("/api/v1/setup-paths")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Backend error")
            )
        
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_worldbuilding_status(project_path: Optional[str] = None) -> Dict[str, Any]:
    """Check if project has worldbuilding setup."""
    try:
        params = {}
        if project_path:
            params["project_path"] = project_path
            
        response = await client.get(
            "/api/v1/worldbuilding/status",
            params=params
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json().get("error", "Backend error")
            )
        
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
