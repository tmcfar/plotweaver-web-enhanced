#!/usr/bin/env python3
"""
Security audit script for PlotWeaver WebSocket implementation.
Checks for common security vulnerabilities and best practices.
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any


class SecurityAudit:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.issues = []
        self.warnings = []
        self.passed_checks = []
    
    def add_issue(self, severity: str, file_path: str, line: int, description: str):
        """Add a security issue."""
        self.issues.append({
            "severity": severity,
            "file": file_path,
            "line": line,
            "description": description
        })
    
    def add_warning(self, file_path: str, line: int, description: str):
        """Add a security warning."""
        self.warnings.append({
            "file": file_path,
            "line": line,
            "description": description
        })
    
    def add_passed(self, check_name: str, description: str):
        """Add a passed security check."""
        self.passed_checks.append({
            "check": check_name,
            "description": description
        })
    
    def check_hardcoded_secrets(self):
        """Check for hardcoded secrets and sensitive data."""
        patterns = [
            (r'password\s*=\s*["\'][^"\']+["\']', "Hardcoded password"),
            (r'secret\s*=\s*["\'][^"\']+["\']', "Hardcoded secret"),
            (r'api_key\s*=\s*["\'][^"\']+["\']', "Hardcoded API key"),
            (r'token\s*=\s*["\'][^"\']+["\']', "Hardcoded token"),
            (r'SECRET_KEY\s*=\s*["\'][^"\']+["\']', "Hardcoded secret key"),
        ]
        
        # Only scan src/ directory, not virtual environments or node_modules
        python_files = list((self.project_root / "src").rglob("*.py")) if (self.project_root / "src").exists() else []
        python_files.extend(list((self.project_root / "tests").rglob("*.py")) if (self.project_root / "tests").exists() else [])
        
        for file_path in python_files:
            try:
                content = file_path.read_text()
                lines = content.split('\n')
                
                for line_num, line in enumerate(lines, 1):
                    for pattern, description in patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Skip test files and comments
                            if "test" in str(file_path) or line.strip().startswith("#"):
                                continue
                            
                            # Check if it's a placeholder
                            if "change-in-production" in line or "your-secret" in line:
                                self.add_warning(str(file_path), line_num, 
                                               f"{description} (placeholder detected)")
                            else:
                                self.add_issue("HIGH", str(file_path), line_num, description)
            except Exception:
                pass
    
    def check_sql_injection(self):
        """Check for potential SQL injection vulnerabilities."""
        patterns = [
            (r'execute\s*\(\s*["\'][^"\']*\+', "Potential SQL injection"),
            (r'query\s*\(\s*["\'][^"\']*\+', "Potential SQL injection"),
            (r'SELECT\s+.*\+', "Potential SQL injection in SELECT"),
            (r'INSERT\s+.*\+', "Potential SQL injection in INSERT"),
        ]
        
        # Only scan src/ directory, not virtual environments or node_modules
        python_files = list((self.project_root / "src").rglob("*.py")) if (self.project_root / "src").exists() else []
        python_files.extend(list((self.project_root / "tests").rglob("*.py")) if (self.project_root / "tests").exists() else [])
        found_issues = False
        
        for file_path in python_files:
            try:
                content = file_path.read_text()
                lines = content.split('\n')
                
                for line_num, line in enumerate(lines, 1):
                    for pattern, description in patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            self.add_issue("HIGH", str(file_path), line_num, description)
                            found_issues = True
            except Exception:
                pass
        
        if not found_issues:
            self.add_passed("SQL_INJECTION", "No SQL injection vulnerabilities detected")
    
    def check_authentication_implementation(self):
        """Check authentication implementation."""
        auth_files = list(self.project_root.rglob("*auth*.py"))
        
        if not auth_files:
            self.add_issue("HIGH", "project", 0, "No authentication implementation found")
            return
        
        # Check for JWT implementation
        jwt_found = False
        rate_limiting_found = False
        
        for file_path in auth_files:
            try:
                content = file_path.read_text()
                
                if "jwt" in content.lower():
                    jwt_found = True
                
                if "rate" in content.lower() and "limit" in content.lower():
                    rate_limiting_found = True
                
                # Check for weak cryptography
                if re.search(r'algorithm\s*=\s*["\']none["\']', content, re.IGNORECASE):
                    self.add_issue("CRITICAL", str(file_path), 0, 
                                 "JWT algorithm set to 'none' - critical vulnerability")
                
                if re.search(r'verify\s*=\s*False', content):
                    self.add_issue("HIGH", str(file_path), 0, 
                                 "JWT verification disabled")
                    
            except Exception:
                pass
        
        if jwt_found:
            self.add_passed("JWT_AUTH", "JWT authentication implementation found")
        else:
            self.add_issue("MEDIUM", "authentication", 0, "No JWT implementation found")
        
        if rate_limiting_found:
            self.add_passed("RATE_LIMITING", "Rate limiting implementation found")
        else:
            self.add_issue("MEDIUM", "authentication", 0, "No rate limiting found")
    
    def check_websocket_security(self):
        """Check WebSocket security implementation."""
        ws_files = list(self.project_root.rglob("main.py"))
        ws_files.extend(list(self.project_root.rglob("*websocket*.py")))
        
        auth_required = False
        rate_limiting = False
        message_validation = False
        
        for file_path in ws_files:
            try:
                content = file_path.read_text()
                
                # Check for authentication
                if "authenticate" in content.lower() or "token" in content:
                    auth_required = True
                
                # Check for rate limiting
                if "rate_limit" in content.lower() or "throttle" in content.lower():
                    rate_limiting = True
                
                # Check for message size validation
                if "MAX_MESSAGE_SIZE" in content:
                    message_validation = True
                
                # Check for unsafe practices
                if re.search(r'eval\s*\(', content):
                    self.add_issue("CRITICAL", str(file_path), 0, 
                                 "eval() usage detected - critical security risk")
                
                if re.search(r'exec\s*\(', content):
                    self.add_issue("CRITICAL", str(file_path), 0, 
                                 "exec() usage detected - critical security risk")
                    
            except Exception:
                pass
        
        if auth_required:
            self.add_passed("WS_AUTH", "WebSocket authentication implemented")
        else:
            self.add_issue("HIGH", "websocket", 0, "WebSocket authentication not implemented")
        
        if rate_limiting:
            self.add_passed("WS_RATE_LIMIT", "WebSocket rate limiting implemented")
        else:
            self.add_issue("MEDIUM", "websocket", 0, "WebSocket rate limiting not implemented")
        
        if message_validation:
            self.add_passed("WS_VALIDATION", "WebSocket message validation implemented")
        else:
            self.add_issue("MEDIUM", "websocket", 0, "WebSocket message validation not implemented")
    
    def check_input_validation(self):
        """Check for input validation."""
        patterns = [
            (r'request\.json\(\)', "Unvalidated JSON input"),
            (r'request\.form\[', "Unvalidated form input"),
            (r'request\.args\[', "Unvalidated query parameter"),
        ]
        
        # Only scan src/ directory, not virtual environments or node_modules
        python_files = list((self.project_root / "src").rglob("*.py")) if (self.project_root / "src").exists() else []
        python_files.extend(list((self.project_root / "tests").rglob("*.py")) if (self.project_root / "tests").exists() else [])
        validation_found = False
        
        for file_path in python_files:
            try:
                content = file_path.read_text()
                
                # Look for validation frameworks
                if "pydantic" in content or "BaseModel" in content:
                    validation_found = True
                
                lines = content.split('\n')
                for line_num, line in enumerate(lines, 1):
                    for pattern, description in patterns:
                        if re.search(pattern, line):
                            # Check if validation is present nearby
                            context = '\n'.join(lines[max(0, line_num-3):line_num+3])
                            if not re.search(r'valid|schema|BaseModel', context, re.IGNORECASE):
                                self.add_warning(str(file_path), line_num, description)
                                
            except Exception:
                pass
        
        if validation_found:
            self.add_passed("INPUT_VALIDATION", "Input validation framework detected")
    
    def check_error_handling(self):
        """Check for proper error handling."""
        # Only scan src/ directory, not virtual environments or node_modules
        python_files = list((self.project_root / "src").rglob("*.py")) if (self.project_root / "src").exists() else []
        python_files.extend(list((self.project_root / "tests").rglob("*.py")) if (self.project_root / "tests").exists() else [])
        
        for file_path in python_files:
            try:
                content = file_path.read_text()
                lines = content.split('\n')
                
                for line_num, line in enumerate(lines, 1):
                    # Check for bare except clauses
                    if re.match(r'\s*except\s*:', line):
                        self.add_warning(str(file_path), line_num, 
                                       "Bare except clause - may hide errors")
                    
                    # Check for information disclosure in errors
                    if re.search(r'print\s*\(\s*.*error.*\)', line, re.IGNORECASE):
                        if "test" not in str(file_path):
                            self.add_warning(str(file_path), line_num, 
                                           "Error information may be disclosed")
                            
            except Exception:
                pass
    
    def run_audit(self) -> Dict[str, Any]:
        """Run the complete security audit."""
        print("🔍 Running security audit...")
        
        self.check_hardcoded_secrets()
        self.check_sql_injection()
        self.check_authentication_implementation()
        self.check_websocket_security()
        self.check_input_validation()
        self.check_error_handling()
        
        return {
            "issues": self.issues,
            "warnings": self.warnings,
            "passed_checks": self.passed_checks,
            "summary": {
                "critical_issues": len([i for i in self.issues if i["severity"] == "CRITICAL"]),
                "high_issues": len([i for i in self.issues if i["severity"] == "HIGH"]),
                "medium_issues": len([i for i in self.issues if i["severity"] == "MEDIUM"]),
                "warnings": len(self.warnings),
                "passed_checks": len(self.passed_checks)
            }
        }
    
    def print_report(self, results: Dict[str, Any]):
        """Print a formatted security report."""
        summary = results["summary"]
        
        print("\n" + "="*60)
        print("🛡️  SECURITY AUDIT REPORT")
        print("="*60)
        
        # Summary
        print(f"\n📊 SUMMARY:")
        print(f"   Critical Issues: {summary['critical_issues']}")
        print(f"   High Issues:     {summary['high_issues']}")
        print(f"   Medium Issues:   {summary['medium_issues']}")
        print(f"   Warnings:        {summary['warnings']}")
        print(f"   Passed Checks:   {summary['passed_checks']}")
        
        # Critical and High Issues
        critical_high = [i for i in results["issues"] if i["severity"] in ["CRITICAL", "HIGH"]]
        if critical_high:
            print(f"\n🚨 CRITICAL & HIGH SEVERITY ISSUES:")
            for issue in critical_high:
                print(f"   [{issue['severity']}] {issue['file']}:{issue['line']}")
                print(f"       {issue['description']}")
        
        # Medium Issues
        medium = [i for i in results["issues"] if i["severity"] == "MEDIUM"]
        if medium:
            print(f"\n⚠️  MEDIUM SEVERITY ISSUES:")
            for issue in medium:
                print(f"   {issue['file']}:{issue['line']} - {issue['description']}")
        
        # Warnings
        if results["warnings"]:
            print(f"\n💡 WARNINGS:")
            for warning in results["warnings"][:5]:  # Show first 5
                print(f"   {warning['file']}:{warning['line']} - {warning['description']}")
            if len(results["warnings"]) > 5:
                print(f"   ... and {len(results['warnings']) - 5} more")
        
        # Passed Checks
        if results["passed_checks"]:
            print(f"\n✅ PASSED SECURITY CHECKS:")
            for check in results["passed_checks"]:
                print(f"   {check['check']}: {check['description']}")
        
        # Overall Assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if summary["critical_issues"] > 0:
            print("   ❌ CRITICAL - Immediate action required!")
        elif summary["high_issues"] > 0:
            print("   ⚠️  HIGH RISK - Address soon")
        elif summary["medium_issues"] > 0:
            print("   📋 MEDIUM RISK - Plan to address")
        else:
            print("   ✅ GOOD - No critical security issues found")
        
        print("="*60)


if __name__ == "__main__":
    project_root = "/home/tmcfar/dev/pw-web"
    
    auditor = SecurityAudit(project_root)
    results = auditor.run_audit()
    auditor.print_report(results)
    
    # Save detailed report
    with open(f"{project_root}/security_report.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: {project_root}/security_report.json")