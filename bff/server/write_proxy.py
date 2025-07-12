"""
Proxy for all write operations to the backend service.
According to the architecture, all write operations should go through the backend.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os

# from ..auth.jwt_auth import get_current_user  # TODO: Implement authentication

router = APIRouter()

# Backend service URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


async def proxy_to_backend(
    request: Request,
    path: str,
    method: str = "POST",
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
        headers = {
            "Authorization": request.headers.get("Authorization", ""),
            "Content-Type": "application/json",
        }

        # Build full URL
        url = f"{BACKEND_URL}{path}"

        # Make request to backend
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                json=body,
                headers=headers,
                timeout=timeout,
            )

            # Return backend response
            return JSONResponse(
                content=response.json() if response.text else {},
                status_code=response.status_code,
                headers=dict(response.headers),
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Backend service timeout")
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Backend service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


# Git Write Operations
@router.post("/git/commit/{project_id}")
async def proxy_git_commit(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy git commit operation to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/commit/{project_id}", method="POST"
    )


@router.post("/git/push/{project_id}")
async def proxy_git_push(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy git push operation to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/push/{project_id}", method="POST"
    )


@router.post("/git/branch/{project_id}")
async def proxy_create_branch(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy branch creation to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/branches/{project_id}", method="POST"
    )


@router.put("/git/branch/{project_id}/switch")
async def proxy_switch_branch(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy branch switching to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/branches/{project_id}/switch", method="PUT"
    )


# File Operations
@router.post("/git/files/{project_id}")
async def proxy_create_file(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy file creation to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/files/{project_id}", method="POST"
    )


@router.put("/git/files/{project_id}/{file_path:path}")
async def proxy_update_file(
    project_id: str,
    file_path: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy file update to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/files/{project_id}/{file_path}", method="PUT"
    )


@router.delete("/git/files/{project_id}/{file_path:path}")
async def proxy_delete_file(
    project_id: str,
    file_path: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy file deletion to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/files/{project_id}/{file_path}", method="DELETE"
    )


# Stage/Unstage Operations
@router.post("/git/stage/{project_id}")
async def proxy_stage_files(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy file staging to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/stage/{project_id}", method="POST"
    )


@router.post("/git/unstage/{project_id}")
async def proxy_unstage_files(
    project_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy file unstaging to backend."""
    return await proxy_to_backend(
        request, f"/api/v1/git/unstage/{project_id}", method="POST"
    )
