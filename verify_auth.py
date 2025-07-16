#!/usr/bin/env python3
"""
PlotWeaver Auth System Verification
Run this to verify all auth components are working correctly.
"""

import subprocess
import time
import requests
import json
from typing import Tuple, Dict, Any


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    END = "\033[0m"


def check_service(name: str, url: str) -> Tuple[bool, str]:
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=2)
        return True, f"{Colors.GREEN}✓ Running{Colors.END}"
    except:
        return False, f"{Colors.RED}✗ Not running{Colors.END}"


def check_cors(
    service: str, url: str, origin: str = "http://localhost:3000"
) -> Tuple[bool, str]:
    """Check CORS configuration"""
    headers = {"Origin": origin, "Access-Control-Request-Method": "POST"}
    try:
        response = requests.options(url, headers=headers, timeout=2)
        if "access-control-allow-origin" in response.headers:
            allowed = response.headers.get("access-control-allow-origin")
            return True, f"{Colors.GREEN}✓ CORS OK ({allowed}){Colors.END}"
        else:
            return False, f"{Colors.RED}✗ CORS not configured{Colors.END}"
    except:
        return False, f"{Colors.RED}✗ Service not reachable{Colors.END}"


def test_auth_endpoint(url: str, data: Dict[str, Any]) -> Tuple[bool, str]:
    """Test auth endpoint"""
    headers = {"Content-Type": "application/json", "Origin": "http://localhost:3000"}
    try:
        response = requests.post(url, json=data, headers=headers, timeout=5)
        if response.status_code == 200:
            result = response.json()
            if "access_token" in result:
                return True, f"{Colors.GREEN}✓ Mock auth working{Colors.END}"
            else:
                return False, f"{Colors.YELLOW}⚠ Response missing token{Colors.END}"
        else:
            return False, f"{Colors.RED}✗ Status {response.status_code}{Colors.END}"
    except Exception as e:
        return False, f"{Colors.RED}✗ Error: {str(e)}{Colors.END}"


def check_file_exists(path: str, description: str) -> Tuple[bool, str]:
    """Check if a file exists"""
    import os

    if os.path.exists(path):
        return True, f"{Colors.GREEN}✓ {description} exists{Colors.END}"
    else:
        return False, f"{Colors.RED}✗ {description} missing{Colors.END}"


def main():
    print(f"\n{Colors.BLUE}=== PlotWeaver Auth System Verification ==={Colors.END}\n")

    all_good = True

    # 1. Check services
    print("1. Service Status:")
    services = [
        ("Flask Backend", "http://localhost:5000/api/v1/auth/providers"),
        ("FastAPI BFF", "http://localhost:8000/api/health"),
        ("Frontend", "http://localhost:3000"),
    ]

    service_status = {}
    for name, url in services:
        ok, status = check_service(name, url)
        service_status[name] = ok
        all_good &= ok
        print(f"   {name:<15} {status}")

    # 2. Check CORS
    print("\n2. CORS Configuration:")
    if service_status.get("Flask Backend"):
        ok, status = check_cors("Flask Auth", "http://localhost:5000/api/v1/auth/login")
        all_good &= ok
        print(f"   Flask Auth      {status}")

    if service_status.get("FastAPI BFF"):
        ok, status = check_cors("BFF", "http://localhost:8000/api/health")
        all_good &= ok
        print(f"   BFF             {status}")

    # 3. Check auth functionality
    print("\n3. Auth Functionality:")
    if service_status.get("Flask Backend"):
        ok, status = test_auth_endpoint(
            "http://localhost:5000/api/v1/auth/login",
            {"email": "test@example.com", "password": "test"},
        )
        all_good &= ok
        print(f"   Login Endpoint  {status}")

    # 4. Check file setup
    print("\n4. File Configuration:")
    files = [
        ("~/dev/pw-web/frontend/.env", "Frontend .env"),
        ("~/dev/pw-web/frontend/src/services/auth.ts", "Auth service"),
        ("~/dev/pw-web/frontend/src/hooks/useAuth.ts", "Auth hook"),
        ("~/dev/pw-web/frontend/src/components/auth/LoginForm.tsx", "Login component"),
    ]

    import os

    for path, desc in files:
        full_path = os.path.expanduser(path)
        ok, status = check_file_exists(full_path, desc)
        all_good &= ok
        print(f"   {status}")

    # Summary
    print(f"\n{Colors.BLUE}=== Summary ==={Colors.END}")
    if all_good:
        print(
            f"{Colors.GREEN}✓ All auth components are properly configured!{Colors.END}"
        )
        print("\nYou can now:")
        print("1. Visit http://localhost:3000/login")
        print("2. Test the login functionality")
        print("3. Implement real authentication in Flask backend")
    else:
        print(f"{Colors.YELLOW}⚠ Some components need attention{Colors.END}")

        if not service_status.get("Flask Backend"):
            print(f"\n{Colors.YELLOW}Start Flask backend:{Colors.END}")
            print("  cd ~/dev/pw2 && source venv/bin/activate")
            print("  python -m plotweaver.ui.app")

        if not service_status.get("FastAPI BFF"):
            print(f"\n{Colors.YELLOW}Start BFF:{Colors.END}")
            print("  cd ~/dev/pw-web/bff && source venv/bin/activate")
            print("  python -m uvicorn server.main:app --reload")

        if not service_status.get("Frontend"):
            print(f"\n{Colors.YELLOW}Start frontend:{Colors.END}")
            print("  cd ~/dev/pw-web/frontend")
            print("  npm run dev")


if __name__ == "__main__":
    main()
