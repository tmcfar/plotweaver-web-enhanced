#!/bin/bash

# Test script for PlotWeaver worldbuilding integration

echo "Testing PlotWeaver Worldbuilding Integration..."
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:5000"
BFF_URL="http://localhost:8000"
PROJECT_PATH="/home/tmcfar/dev/pw2/test_project"

# Test 1: Check backend health
echo -e "\n${YELLOW}Test 1: Backend Health Check${NC}"
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${BACKEND_URL}/api/health)
if [ "$BACKEND_HEALTH" == "200" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding (HTTP $BACKEND_HEALTH)${NC}"
    echo "Please start the backend: cd ~/dev/pw2 && python -m plotweaver.ui.app"
    exit 1
fi

# Test 2: Check BFF health
echo -e "\n${YELLOW}Test 2: BFF Health Check${NC}"
BFF_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${BFF_URL}/api/health)
if [ "$BFF_HEALTH" == "200" ]; then
    echo -e "${GREEN}✓ BFF is running${NC}"
else
    echo -e "${RED}✗ BFF is not responding (HTTP $BFF_HEALTH)${NC}"
    echo "Please start the BFF: cd ~/dev/pw-web && python run_bff.py"
    exit 1
fi

# Test 3: Test concept analysis through BFF
echo -e "\n${YELLOW}Test 3: Concept Analysis (BFF -> Backend)${NC}"
CONCEPT_RESPONSE=$(curl -s -X POST ${BFF_URL}/api/worldbuilding/analyze-concept \
  -H "Content-Type: application/json" \
  -d '{
    "concept_text": "A detective story set in 1920s Chicago where a private investigator must solve a series of mysterious disappearances",
    "project_path": "'"$PROJECT_PATH"'",
    "user_preferences": {
      "time_investment": "moderate"
    }
  }')

if echo "$CONCEPT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Concept analysis successful${NC}"
    echo "Response preview:"
    echo "$CONCEPT_RESPONSE" | python -m json.tool | head -20
else
    echo -e "${RED}✗ Concept analysis failed${NC}"
    echo "Response: $CONCEPT_RESPONSE"
fi

# Test 4: Test setup paths endpoint
echo -e "\n${YELLOW}Test 4: Get Setup Paths${NC}"
PATHS_RESPONSE=$(curl -s ${BFF_URL}/api/worldbuilding/setup-paths)

if echo "$PATHS_RESPONSE" | grep -q '"paths"'; then
    echo -e "${GREEN}✓ Setup paths retrieved successfully${NC}"
    echo "Available paths:"
    echo "$PATHS_RESPONSE" | python -m json.tool | grep -E '"type"|"name"' | head -10
else
    echo -e "${RED}✗ Failed to get setup paths${NC}"
    echo "Response: $PATHS_RESPONSE"
fi

# Test 5: Test WebSocket connection
echo -e "\n${YELLOW}Test 5: WebSocket Connection Test${NC}"
# This would require a WebSocket client, so we'll just check if the endpoint exists
WS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -H "Upgrade: websocket" ${BFF_URL}/ws?token=test)
if [ "$WS_CHECK" == "426" ] || [ "$WS_CHECK" == "401" ]; then
    echo -e "${GREEN}✓ WebSocket endpoint exists${NC}"
else
    echo -e "${YELLOW}⚠ WebSocket endpoint status: $WS_CHECK${NC}"
fi

echo -e "\n${GREEN}Integration test complete!${NC}"
echo -e "\nNext steps:"
echo "1. Start the frontend: cd ~/dev/pw-web/frontend && npm run dev"
echo "2. Create a new project and test the worldbuilding flow"
echo "3. Check git commits in the project directory"
