"""
Proxy for story generation operations to the backend service.
Maintains SSE streaming capability while forwarding to backend.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import os
from typing import AsyncGenerator

# from ..auth.jwt_auth import get_current_user  # TODO: Implement authentication

router = APIRouter()

# Backend service URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


async def stream_from_backend(
    path: str,
    request: Request,
    timeout: float = 300.0,  # 5 minutes for generation
) -> StreamingResponse:
    """
    Stream SSE responses from backend to client.

    Args:
        path: The backend API path to call
        request: The incoming FastAPI request
        timeout: Request timeout in seconds

    Returns:
        StreamingResponse that forwards SSE events from backend
    """

    async def generate() -> AsyncGenerator[str, None]:
        try:
            # Get request body
            body = await request.json()

            # Forward headers
            headers = {
                "Authorization": request.headers.get("Authorization", ""),
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            }

            # Stream from backend
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{BACKEND_URL}{path}",
                    json=body,
                    headers=headers,
                    timeout=timeout,
                ) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk.decode("utf-8")

        except httpx.TimeoutException:
            yield 'event: error\ndata: {"error": "Backend service timeout"}\n\n'
        except httpx.RequestError as e:
            yield f'event: error\ndata: {{"error": "Backend service unavailable: {str(e)}"}}\n\n'
        except Exception as e:
            yield f'event: error\ndata: {{"error": "Proxy error: {str(e)}"}}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


@router.post("/stories/generate")
async def proxy_story_generation(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """
    Proxy story generation request to backend.
    Returns generation ID and stream URL.
    """
    try:
        # Get request body
        body = await request.json()

        # Forward to backend
        headers = {
            "Authorization": request.headers.get("Authorization", ""),
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_URL}/api/v1/generate/scene",
                json=body,
                headers=headers,
                timeout=30.0,
            )

            if response.status_code == 202:
                # Successful generation start
                result = response.json()
                # Update stream URL to point to our proxy endpoint
                if "stream_url" in result:
                    generation_id = result.get("generation_id")
                    result["stream_url"] = f"/api/generations/{generation_id}/stream"

                return JSONResponse(
                    content=result,
                    status_code=202,
                )
            else:
                # Error response
                return JSONResponse(
                    content=response.json()
                    if response.text
                    else {"error": "Unknown error"},
                    status_code=response.status_code,
                )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Backend service timeout")
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Backend service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


@router.get("/generations/{generation_id}")
async def proxy_generation_status(
    generation_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy generation status request to backend."""
    try:
        headers = {
            "Authorization": request.headers.get("Authorization", ""),
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BACKEND_URL}/api/v1/generations/{generation_id}",
                headers=headers,
                timeout=10.0,
            )

            return JSONResponse(
                content=response.json() if response.text else {},
                status_code=response.status_code,
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Backend service timeout")
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Backend service unavailable: {str(e)}"
        )


@router.get("/generations/{generation_id}/stream")
async def proxy_generation_stream(
    generation_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy SSE stream for generation progress from backend."""
    return await stream_from_backend(
        f"/api/v1/generations/{generation_id}/stream",
        request,
    )


@router.get("/stories/{story_id}")
async def proxy_get_story(
    story_id: str,
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy story retrieval to backend."""
    try:
        headers = {
            "Authorization": request.headers.get("Authorization", ""),
        }

        # Forward query parameters
        params = dict(request.query_params)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BACKEND_URL}/api/v1/stories/{story_id}",
                headers=headers,
                params=params,
                timeout=10.0,
            )

            return JSONResponse(
                content=response.json() if response.text else {},
                status_code=response.status_code,
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Backend service timeout")
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Backend service unavailable: {str(e)}"
        )


# Character generation proxy
@router.post("/characters/generate")
async def proxy_character_generation(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy character generation to backend."""
    return await stream_from_backend(
        "/api/v1/generate/character",
        request,
    )


# Plot generation proxy
@router.post("/plots/generate")
async def proxy_plot_generation(
    request: Request,
    # current_user: dict = Depends(get_current_user),  # TODO: Re-enable when auth is implemented
):
    """Proxy plot generation to backend."""
    return await stream_from_backend(
        "/api/v1/generate/plot",
        request,
    )
