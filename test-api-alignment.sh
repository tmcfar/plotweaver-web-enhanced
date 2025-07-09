#!/bin/bash

# Test script to verify API alignment between frontend and backend

echo "🔍 Testing PlotWeaver API Alignment..."
echo "====================================="

# Check if BFF server is running
echo "1. Checking BFF server health..."
curl -s http://localhost:8000/api/health | jq '.' || echo "❌ BFF server not responding"

# Test event batch endpoint
echo -e "\n2. Testing event batch endpoint..."
curl -s -X POST http://localhost:8000/api/v1/events/batch \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session-123" \
  -d '{
    "events": [
      {
        "eventId": "test-event-1",
        "sessionId": "test-session-123",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "eventType": "test_event",
        "context": {
          "test": true
        }
      }
    ]
  }' | jq '.' || echo "❌ Event batch endpoint failed"

# Test feedback endpoint
echo -e "\n3. Testing feedback endpoint..."
curl -s -X POST http://localhost:8000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session-123" \
  -d '{
    "feedbackType": "micro",
    "contentType": "test",
    "contentId": "test-123",
    "rating": 1,
    "context": {}
  }' | jq '.' || echo "❌ Feedback endpoint failed"

# Test feedback update (PATCH)
echo -e "\n4. Testing feedback PATCH endpoint..."
curl -s -X PATCH http://localhost:8000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session-123" \
  -d '{
    "feedbackType": "micro",
    "contentType": "test",
    "contentId": "test-123",
    "comment": "This is a test comment"
  }' | jq '.' || echo "❌ Feedback PATCH endpoint failed"

# Test help search
echo -e "\n5. Testing help search endpoint..."
curl -s "http://localhost:8000/api/v1/help/search?q=generation" | jq '.' || echo "❌ Help search endpoint failed"

# Test session feedback
echo -e "\n6. Testing session feedback endpoint..."
curl -s -X POST http://localhost:8000/api/v1/feedback/session \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session-123" \
  -d '{
    "feedbackType": "session",
    "context": {
      "satisfaction": 5,
      "likelihoodToRecommend": 9,
      "sessionDuration": 1800000
    }
  }' | jq '.' || echo "❌ Session feedback endpoint failed"

echo -e "\n✅ API alignment tests completed!"
echo "====================================="

# Check if frontend is running
echo -e "\n7. Checking frontend server..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend is running" || echo "❌ Frontend not responding"

# Summary
echo -e "\n📊 Summary:"
echo "- BFF server should be running on port 8000"
echo "- Frontend should be running on port 3000"
echo "- All API endpoints should return JSON responses"
echo "- No 404 or 400 errors should occur"
