#!/usr/bin/env python3
"""
PlotWeaver API Endpoint Tester
Quick tool to test API endpoints during implementation
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def test_endpoint(method, path, data=None, name=None):
    """Test a single endpoint and print results"""
    url = f"{BASE_URL}{path}"
    name = name or f"{method} {path}"
    
    print(f"\n{Colors.BLUE}Testing: {name}{Colors.END}")
    print(f"URL: {url}")
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url)
        else:
            print(f"{Colors.RED}Unknown method: {method}{Colors.END}")
            return
            
        # Print results
        if response.status_code < 300:
            print(f"{Colors.GREEN}✓ Status: {response.status_code}{Colors.END}")
        else:
            print(f"{Colors.RED}✗ Status: {response.status_code}{Colors.END}")
            
        # Print response
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:200]}...")
        except:
            print(f"Response: {response.text[:200]}...")
            
        # Check CORS headers
        cors = response.headers.get('Access-Control-Allow-Origin')
        if cors:
            print(f"{Colors.GREEN}CORS: {cors}{Colors.END}")
        else:
            print(f"{Colors.YELLOW}No CORS headers{Colors.END}")
            
    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}✗ Connection failed - is the backend running?{Colors.END}")
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {e}{Colors.END}")

def phase1_tests():
    """Test Phase 1 endpoints"""
    print(f"\n{Colors.YELLOW}=== PHASE 1: Project Management ==={Colors.END}")
    
    # Test project list
    test_endpoint("GET", "/api/v1/projects", name="List Projects")
    
    # Test project creation
    test_endpoint("POST", "/api/v1/projects", 
                  data={"name": f"Test Project {datetime.now().strftime('%H%M%S')}",
                        "description": "API test project"},
                  name="Create Project")
    
    # Test specific project (assuming ID 1 exists)
    test_endpoint("GET", "/api/v1/projects/1", name="Get Project #1")
    
    # Test project activation
    test_endpoint("POST", "/api/v1/projects/1/activate", name="Activate Project #1")

def phase2_tests():
    """Test Phase 2 endpoints"""
    print(f"\n{Colors.YELLOW}=== PHASE 2: Writing Flow ==={Colors.END}")
    
    test_endpoint("GET", "/api/v1/projects/1/context", name="Get Project Context")
    test_endpoint("GET", "/api/generate/test", name="Test Generation Endpoint")

def main():
    if len(sys.argv) > 1:
        phase = sys.argv[1]
        if phase == "1":
            phase1_tests()
        elif phase == "2":
            phase2_tests()
        else:
            print(f"Unknown phase: {phase}")
    else:
        print("PlotWeaver API Tester")
        print("====================")
        print("Usage: python test_api.py [phase]")
        print("\nAvailable phases:")
        print("  1 - Project Management")
        print("  2 - Writing Flow")
        print("\nRunning all tests...")
        phase1_tests()
        phase2_tests()

if __name__ == "__main__":
    main()
