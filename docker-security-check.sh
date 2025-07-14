#!/bin/bash

# Docker Security Verification Script
# Checks that containers are running as non-root users

echo "🔒 Docker Security Check for PlotWeaver Services"
echo "=============================================="

check_container_user() {
    local container_name=$1
    local expected_user=$2
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        echo "✅ Container '$container_name' is running"
        
        # Check the user the process is running as
        actual_user=$(docker exec "$container_name" whoami 2>/dev/null || echo "ERROR")
        actual_uid=$(docker exec "$container_name" id -u 2>/dev/null || echo "ERROR")
        
        if [ "$actual_user" = "$expected_user" ] && [ "$actual_uid" != "0" ]; then
            echo "✅ Security: Running as user '$actual_user' (UID: $actual_uid) - NON-ROOT ✓"
        elif [ "$actual_uid" = "0" ]; then
            echo "❌ Security: Running as ROOT (UID: 0) - SECURITY RISK!"
        else
            echo "⚠️  Security: Running as user '$actual_user' (UID: $actual_uid) - Check if expected"
        fi
        
        # Check file ownership in key directories
        echo "📁 Checking file ownership:"
        docker exec "$container_name" ls -la /app | head -3
        
    else
        echo "❌ Container '$container_name' is not running"
    fi
    echo ""
}

echo "Checking Frontend Container:"
check_container_user "pw-web-frontend-1" "nextjs"

echo "Checking BFF Container:"
check_container_user "pw-web-bff-1" "plotweaver"

echo "Checking Backend Container:"
check_container_user "pw-web-backend-1" "plotweaver"

echo "🔧 To rebuild containers with security fixes:"
echo "   cd /home/tmcfar/dev/pw-web && docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"
echo ""
echo "🔧 To rebuild backend container:"
echo "   cd /home/tmcfar/dev/pw2 && docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"