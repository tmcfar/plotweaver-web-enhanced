#!/bin/bash

# Complete API Integration Test Script for PlotWeaver

echo "PlotWeaver API Integration Test"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:5000"
BFF_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    echo "Method: $method"
    echo "URL: $url"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status)"
        echo "Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "\n${YELLOW}=== Backend API Tests ===${NC}"

# Test backend health
test_endpoint "GET" "$BACKEND_URL/api/health" "" "200" "Backend Health Check"

# Test project endpoints
test_endpoint "GET" "$BACKEND_URL/api/v1/projects" "" "200" "List Projects"

# Test mode sets
test_endpoint "GET" "$BACKEND_URL/api/v1/mode-sets" "" "200" "Get Mode Sets"

# Test worldbuilding endpoint
test_endpoint "POST" "$BACKEND_URL/api/v1/analyze-concept" \
    '{"concept_text":"A mystery novel","project_path":"/tmp/test"}' \
    "200" "Analyze Concept (Backend)"

echo -e "\n${YELLOW}=== BFF API Tests ===${NC}"

# Test BFF health
test_endpoint "GET" "$BFF_URL/api/health" "" "200" "BFF Health Check"

# Test worldbuilding through BFF
test_endpoint "POST" "$BFF_URL/api/worldbuilding/analyze-concept" \
    '{"concept_text":"A mystery novel","project_path":"/tmp/test"}' \
    "200" "Analyze Concept (BFF)"

# Test setup paths
test_endpoint "GET" "$BFF_URL/api/worldbuilding/setup-paths" "" "200" "Get Setup Paths"

# Test preview endpoints
test_endpoint "GET" "$BFF_URL/api/preview/current" "" "200" "Get Current Preview"

# Test mode set endpoints
test_endpoint "GET" "$BFF_URL/api/user/mode-set" "" "200" "Get User Mode Set"

echo -e "\n${YELLOW}=== Frontend Integration Tests ===${NC}"

# Check if frontend is running
frontend_check=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$frontend_check" == "200" ]; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not running on port 3000${NC}"
fi

# Check environment configuration
echo -e "\n${YELLOW}=== Environment Configuration ===${NC}"

if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
    grep -E "NEXT_PUBLIC_API_URL|NEXT_PUBLIC_BFF_URL" frontend/.env.local
else
    echo -e "${RED}✗ .env.local missing${NC}"
fi

# Check TypeScript compilation
echo -e "\n${YELLOW}=== TypeScript Compilation ===${NC}"

cd frontend
echo "Running TypeScript check..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
tsc_exit_code=${PIPESTATUS[0]}

if [ $tsc_exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "${YELLOW}⚠ TypeScript compilation has errors${NC}"
fi

cd ..

# Check for direct fetch calls
echo -e "\n${YELLOW}=== Code Quality Checks ===${NC}"

echo "Checking for direct fetch() calls in components..."
direct_fetch_count=$(grep -r "fetch(" frontend/src/components --include="*.tsx" --include="*.ts" | grep -v "worldbuildingApi" | wc -l)

if [ $direct_fetch_count -eq 0 ]; then
    echo -e "${GREEN}✓ No direct fetch() calls found${NC}"
else
    echo -e "${YELLOW}⚠ Found $direct_fetch_count direct fetch() calls${NC}"
    echo "Files with direct fetch():"
    grep -r "fetch(" frontend/src/components --include="*.tsx" --include="*.ts" | grep -v "worldbuildingApi" | cut -d: -f1 | sort | uniq
fi

# Summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All API integration tests passed!${NC}"
else
    echo -e "\n${RED}❌ Some tests failed. Please check the errors above.${NC}"
fi

# Recommendations
echo -e "\n${YELLOW}=== Recommendations ===${NC}"

if [ "$frontend_check" != "200" ]; then
    echo "1. Start the frontend: cd frontend && npm run dev"
fi

if [ $direct_fetch_count -gt 0 ]; then
    echo "2. Replace direct fetch() calls with API service methods"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "3. Create frontend/.env.local with proper API URLs"
fi

echo -e "\n${BLUE}API integration update complete!${NC}"
