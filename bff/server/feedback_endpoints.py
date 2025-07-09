"""
Feedback and Analytics API endpoints for PlotWeaver
"""

from datetime import datetime, UTC
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field
import uuid

router = APIRouter(prefix="/api/v1", tags=["feedback", "analytics"])

# In-memory storage for development (replace with database in production)
events_storage: Dict[str, List[Dict[str, Any]]] = {}
feedback_storage: Dict[str, List[Dict[str, Any]]] = {}
help_content_storage: Dict[str, Dict[str, Any]] = {}
session_storage: Dict[str, Dict[str, Any]] = {}

# Initialize some sample help content
help_content_storage.update(
    {
        "getting-started": {
            "helpId": "getting-started",
            "title": "Getting Started with PlotWeaver",
            "content": "Welcome to PlotWeaver! This guide will help you create your first story project.",
            "contentType": "guide",
            "category": "basics",
            "tags": ["beginner", "setup"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "high",
        },
        "scene-generation": {
            "helpId": "scene-generation",
            "title": "Scene Generation",
            "content": "Learn how to use AI to generate compelling scenes for your story.",
            "contentType": "guide",
            "category": "generation",
            "tags": ["ai", "scenes"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "high",
        },
        "character-creation": {
            "helpId": "character-creation",
            "title": "Character Creation",
            "content": "Create rich, complex characters with our character development tools.",
            "contentType": "guide",
            "category": "characters",
            "tags": ["characters", "development"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "medium",
        },
        "project-management": {
            "helpId": "project-management",
            "title": "Project Management",
            "content": "Organize your writing projects effectively with PlotWeaver's project tools.",
            "contentType": "guide",
            "category": "projects",
            "tags": ["organization", "projects"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "medium",
        },
        "collaboration": {
            "helpId": "collaboration",
            "title": "Collaboration Features",
            "content": "Work together with other writers using PlotWeaver's collaboration tools.",
            "contentType": "guide",
            "category": "collaboration",
            "tags": ["teamwork", "sharing"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "low",
        },
        "content-generation-basics": {
            "helpId": "content-generation-basics",
            "title": "Content Generation Basics",
            "content": "Learn the fundamentals of AI-powered content generation in PlotWeaver.",
            "contentType": "tooltip",
            "category": "generation",
            "tags": ["ai", "basics"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "high",
        },
        "getting-started-with-generation": {
            "helpId": "getting-started-with-generation",
            "title": "Getting Started with Generation",
            "content": "Step-by-step guide to your first AI generation in PlotWeaver.",
            "contentType": "article",
            "category": "generation",
            "tags": ["tutorial", "beginner"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "high",
        },
        "content-feedback": {
            "helpId": "content-feedback",
            "title": "Content Feedback",
            "content": "Use the thumbs up/down buttons to rate generated content and help improve AI quality.",
            "contentType": "tooltip",
            "category": "feedback",
            "tags": ["rating", "improvement"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "medium",
        },
        "saving-content": {
            "helpId": "saving-content",
            "title": "Saving Content",
            "content": "Save your generated content to your project for future use and editing.",
            "contentType": "tooltip",
            "category": "basics",
            "tags": ["save", "persistence"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "medium",
        },
        "exporting-content": {
            "helpId": "exporting-content",
            "title": "Exporting Content",
            "content": "Export your content in various formats for use in other applications.",
            "contentType": "tooltip",
            "category": "export",
            "tags": ["export", "formats"],
            "lastUpdated": datetime.now(UTC).isoformat(),
            "priority": "medium",
        },
    }
)


# Models
class EventData(BaseModel):
    eventId: str
    sessionId: str
    timestamp: str
    eventType: str
    agentName: Optional[str] = None
    durationMs: Optional[int] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class EventsBatch(BaseModel):
    events: List[EventData]


class FeedbackData(BaseModel):
    feedbackType: str  # 'micro', 'friction', 'session'
    contentType: Optional[str] = None
    contentId: Optional[str] = None
    projectId: Optional[int] = None
    rating: Optional[int] = None
    comment: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class SessionFeedbackData(BaseModel):
    feedbackType: str = "session"
    projectId: Optional[int] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class FrictionFeedbackData(BaseModel):
    feedbackType: str = "friction"
    contentType: str
    contentId: str
    projectId: Optional[int] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class HelpContentRequest(BaseModel):
    helpIds: List[str]


class HelpContent(BaseModel):
    helpId: str
    title: str
    content: str
    contentType: str
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    lastUpdated: Optional[str] = None
    priority: Optional[str] = "medium"


# Utility functions
def get_session_id(request: Request, x_session_id: Optional[str] = None) -> str:
    """Extract session ID from request headers"""
    session_id = x_session_id or request.headers.get("X-Session-ID")
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id


def validate_session(session_id: str) -> bool:
    """Validate session ID format"""
    try:
        uuid.UUID(session_id)
        return True
    except ValueError:
        return False


# Event tracking endpoints
@router.post("/events/batch")
async def submit_events_batch(
    batch: EventsBatch, request: Request, x_session_id: Optional[str] = Header(None)
):
    """
    Submit a batch of tracking events
    """
    session_id = get_session_id(request, x_session_id)

    if not validate_session(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Store events
    if session_id not in events_storage:
        events_storage[session_id] = []

    # Convert and store events
    for event in batch.events:
        event_data = {
            "eventId": event.eventId,
            "sessionId": session_id,
            "timestamp": event.timestamp,
            "eventType": event.eventType,
            "agentName": event.agentName,
            "durationMs": event.durationMs,
            "context": event.context,
            "receivedAt": datetime.now(UTC).isoformat(),
        }
        events_storage[session_id].append(event_data)

    # Keep only last 1000 events per session
    events_storage[session_id] = events_storage[session_id][-1000:]

    return {
        "status": "success",
        "processed": len(batch.events),
        "sessionId": session_id,
        "timestamp": datetime.now(UTC).isoformat(),
    }


# Feedback endpoints
@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackData, request: Request, x_session_id: Optional[str] = Header(None)
):
    """
    Submit general feedback (micro-feedback, etc.)
    """
    session_id = get_session_id(request, x_session_id)

    if not validate_session(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Store feedback
    if session_id not in feedback_storage:
        feedback_storage[session_id] = []

    feedback_data = {
        "feedbackId": str(uuid.uuid4()),
        "sessionId": session_id,
        "feedbackType": feedback.feedbackType,
        "contentType": feedback.contentType,
        "contentId": feedback.contentId,
        "projectId": feedback.projectId,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "context": feedback.context,
        "submittedAt": datetime.now(UTC).isoformat(),
    }

    feedback_storage[session_id].append(feedback_data)

    return {
        "status": "success",
        "feedbackId": feedback_data["feedbackId"],
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.patch("/feedback")
async def update_feedback(
    feedback: FeedbackData, request: Request, x_session_id: Optional[str] = Header(None)
):
    """
    Update existing feedback (e.g., add comment to micro-feedback)
    """
    session_id = get_session_id(request, x_session_id)

    if not validate_session(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Find and update the most recent feedback for this content
    if session_id in feedback_storage:
        for feedback_item in reversed(feedback_storage[session_id]):
            if (
                feedback_item.get("contentType") == feedback.contentType
                and feedback_item.get("contentId") == feedback.contentId
            ):
                # Update the feedback
                if feedback.comment:
                    feedback_item["comment"] = feedback.comment
                if feedback.rating is not None:
                    feedback_item["rating"] = feedback.rating

                feedback_item["updatedAt"] = datetime.now(UTC).isoformat()

                return {
                    "status": "updated",
                    "feedbackId": feedback_item["feedbackId"],
                    "timestamp": datetime.now(UTC).isoformat(),
                }

    # If no existing feedback found, create new one
    return await submit_feedback(feedback, request, x_session_id)


@router.post("/feedback/friction")
async def submit_friction_feedback(
    friction: FrictionFeedbackData,
    request: Request,
    x_session_id: Optional[str] = Header(None),
):
    """
    Submit friction feedback when users have difficulty
    """
    session_id = get_session_id(request, x_session_id)

    if not validate_session(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Store friction feedback
    if session_id not in feedback_storage:
        feedback_storage[session_id] = []

    friction_data = {
        "feedbackId": str(uuid.uuid4()),
        "sessionId": session_id,
        "feedbackType": "friction",
        "contentType": friction.contentType,
        "contentId": friction.contentId,
        "projectId": friction.projectId,
        "context": friction.context,
        "submittedAt": datetime.now(UTC).isoformat(),
    }

    feedback_storage[session_id].append(friction_data)

    return {
        "status": "success",
        "feedbackId": friction_data["feedbackId"],
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.post("/feedback/session")
async def submit_session_feedback(
    session_feedback: SessionFeedbackData,
    request: Request,
    x_session_id: Optional[str] = Header(None),
):
    """
    Submit end-of-session feedback
    """
    session_id = get_session_id(request, x_session_id)

    if not validate_session(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    # Store session feedback
    if session_id not in feedback_storage:
        feedback_storage[session_id] = []

    session_feedback_data = {
        "feedbackId": str(uuid.uuid4()),
        "sessionId": session_id,
        "feedbackType": "session",
        "projectId": session_feedback.projectId,
        "context": session_feedback.context,
        "submittedAt": datetime.now(UTC).isoformat(),
    }

    feedback_storage[session_id].append(session_feedback_data)

    return {
        "status": "success",
        "feedbackId": session_feedback_data["feedbackId"],
        "timestamp": datetime.now(UTC).isoformat(),
    }


# Help system endpoints
@router.post("/help/bulk")
async def get_help_content_bulk(request: HelpContentRequest):
    """
    Get multiple help content items by ID
    """
    result = []

    for help_id in request.helpIds:
        if help_id in help_content_storage:
            result.append(help_content_storage[help_id])

    return result


@router.get("/help/search")
async def search_help_content(q: str):
    """
    Search help content by query
    """
    query = q.lower().strip()

    if not query:
        return []

    results = []

    for help_content in help_content_storage.values():
        # Search in title, content, category, and tags
        searchable_text = " ".join(
            [
                help_content.get("title", "").lower(),
                help_content.get("content", "").lower(),
                help_content.get("category", "").lower(),
                " ".join(help_content.get("tags", [])).lower(),
            ]
        )

        if query in searchable_text:
            results.append(help_content)

    # Sort by priority and relevance
    priority_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(
        key=lambda x: (
            priority_order.get(x.get("priority", "medium"), 1),
            x.get("title", "").lower().find(query),
        )
    )

    return results[:10]  # Return top 10 results


@router.get("/help/{help_id}")
async def get_help_content(help_id: str):
    """
    Get specific help content by ID
    """
    if help_id not in help_content_storage:
        raise HTTPException(status_code=404, detail="Help content not found")

    return help_content_storage[help_id]


# Analytics endpoints for debugging (development only)
@router.get("/analytics/events/{session_id}")
async def get_session_events(session_id: str):
    """
    Get events for a specific session (development only)
    """
    if session_id not in events_storage:
        return {"events": [], "count": 0}

    return {
        "events": events_storage[session_id],
        "count": len(events_storage[session_id]),
    }


@router.get("/analytics/feedback/{session_id}")
async def get_session_feedback(session_id: str):
    """
    Get feedback for a specific session (development only)
    """
    if session_id not in feedback_storage:
        return {"feedback": [], "count": 0}

    return {
        "feedback": feedback_storage[session_id],
        "count": len(feedback_storage[session_id]),
    }


@router.get("/analytics/stats")
async def get_analytics_stats():
    """
    Get overall analytics statistics (development only)
    """
    total_events = sum(len(events) for events in events_storage.values())
    total_feedback = sum(len(feedback) for feedback in feedback_storage.values())

    return {
        "totalSessions": len(events_storage),
        "totalEvents": total_events,
        "totalFeedback": total_feedback,
        "helpContentItems": len(help_content_storage),
        "lastActivity": datetime.now(UTC).isoformat(),
    }
