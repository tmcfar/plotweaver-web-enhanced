#!/bin/bash

echo "🚀 PlotWeaver Quick Start Script"
echo "================================"

# Function to run a command and check its status
run_command() {
    echo -e "\n▶️  $1"
    eval "$2"
    if [ $? -eq 0 ]; then
        echo "✅ Success"
    else
        echo "❌ Failed (continuing anyway)"
    fi
}

# 1. Make scripts executable
chmod +x *.sh *.js

# 2. Run diagnostics
run_command "Running diagnostics" "node diagnose.js"

# 3. Clean and setup
run_command "Running clean setup" "./setup-clean.sh"

# 4. Fix imports
run_command "Fixing imports" "node fix-imports.js"

# 5. Check if we should use minimal mode
echo -e "\n❓ Would you like to start in minimal mode? (more stable) [Y/n]"
read -r response
if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
    echo "Starting normal mode..."
    npm run dev
else
    echo "Starting minimal mode..."
    ./start-minimal.sh
fi
