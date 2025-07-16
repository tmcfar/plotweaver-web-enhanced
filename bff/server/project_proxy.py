"""
Proxy for project management operations to the backend service.
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional
import logging

# from ..auth.jwt_auth import get_current_user  # TODO: Implement authentication

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Backend service URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


async def proxy_to_backend(
    request: Request,
    path: str,
    method: str = "GET",
    timeout: float = 30.0,
) -> JSONResponse:
    """
    Generic proxy function to forward requests to the backend service.

    Args:
        request: The incoming FastAPI request
        path: The backend API path to call
        method: HTTP method to use
        timeout: Request timeout in seconds

    Returns:
        JSONResponse with the backend's response
    """
    try:
        # Get request body if present
        body = None
        if method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.json()
            except ValueError:
                pass  # No JSON body

        # Forward headers (especially Authorization)
        # Include cookies for session management
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        
        # Forward Authorization header if present
        if "Authorization" in request.headers:
            headers["Authorization"] = request.headers["Authorization"]
            
        # Forward cookies if present
        if "Cookie" in request.headers:
            headers["Cookie"] = request.headers["Cookie"]

        # Forward query parameters
        params = dict(request.query_params) if request.query_params else None

        # Build full URL
        url = f"{BACKEND_URL}{path}"
        
        logger.info(f"Proxying {method} request to: {url}")

        # Make request to backend
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                json=body,
                headers=headers,
                params=params,
                timeout=timeout,
                follow_redirects=True,  # Follow any redirects
            )
            
            # Log response details
            logger.info(f"Backend response: {response.status_code}, Content-Type: {response.headers.get('Content-Type')}")
            
            # Handle different response types
            content_type = response.headers.get("Content-Type", "")
            
            # If response is JSON, parse and return it
            if "application/json" in content_type:
                try:
                    json_content = response.json()
                    return JSONResponse(
                        content=json_content,
                        status_code=response.status_code,
                    )
                except Exception as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    logger.error(f"Response text: {response.text[:500]}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Backend returned invalid JSON: {str(e)}"
                    )
            
            # If response is HTML (error page), convert to JSON error
            elif "text/html" in content_type:
                logger.warning(f"Backend returned HTML for {url}, likely a 404 or error page")
                return JSONResponse(
                    content={
                        "error": f"Backend endpoint not found: {path}",
                        "status_code": response.status_code,
                        "detail": "The backend returned an HTML error page instead of JSON"
                    },
                    status_code=response.status_code if response.status_code != 200 else 404,
                )
            
            # For other content types, return as-is
            else:
                return JSONResponse(
                    content={"data": response.text, "content_type": content_type},
                    status_code=response.status_code,
                )

    except httpx.TimeoutException:
        logger.error(f"Backend timeout for {url}")
        raise HTTPException(status_code=504, detail="Backend service timeout")
    except httpx.RequestError as e:
        logger.error(f"Backend request error for {url}: {str(e)}")
        raise HTTPException(
            status_code=503, detail=f"Backend service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected proxy error for {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


# Project management endpoints
@router.get("/projects")
async def proxy_list_projects(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy project list request to backend."""
    return await proxy_to_backend(request, "/api/v1/projects", method="GET")


@router.post("/projects")
async def proxy_create_project(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy project creation request to backend."""
    return await proxy_to_backend(request, "/api/v1/projects", method="POST")


@router.get("/projects/{project_id}")
async def proxy_get_project(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy get project request to backend."""
    return await proxy_to_backend(request, f"/api/v1/projects/{project_id}", method="GET")


@router.post("/projects/{project_id}/activate")
async def proxy_activate_project(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy activate project request to backend."""
    return await proxy_to_backend(request, f"/api/v1/projects/{project_id}/activate", method="POST")


@router.delete("/projects/{project_id}")
async def proxy_delete_project(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy delete project request to backend."""
    return await proxy_to_backend(request, f"/api/v1/projects/{project_id}", method="DELETE")


@router.get("/projects/active")
async def proxy_get_active_project(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy get active project request to backend."""
    return await proxy_to_backend(request, "/api/v1/projects/active", method="GET")


# Auth endpoints
@router.post("/auth/register")
async def proxy_register(request: Request):
    """Proxy registration request to backend."""
    return await proxy_to_backend(request, "/api/v1/auth/register", method="POST")


@router.post("/auth/login")
async def proxy_login(request: Request):
    """Proxy login request to backend."""
    return await proxy_to_backend(request, "/api/v1/auth/login", method="POST")


@router.post("/auth/logout")
async def proxy_logout(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy logout request to backend."""
    return await proxy_to_backend(request, "/api/v1/auth/logout", method="POST")


@router.post("/auth/refresh")
async def proxy_refresh(request: Request):
    """Proxy token refresh request to backend."""
    return await proxy_to_backend(request, "/api/v1/auth/refresh", method="POST")


@router.get("/auth/user")
async def proxy_get_user(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy get user request to backend."""
    return await proxy_to_backend(request, "/api/v1/auth/user", method="GET")


@router.patch("/auth/user")
async def proxy_update_user(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy update user request to backend."""
    return await proxy_to_backend(request, "/api/v1/auth/user", method="PATCH")
