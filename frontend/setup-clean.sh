#!/bin/bash

echo "🧹 PlotWeaver Frontend Cleanup and Setup Script"
echo "=============================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Clean up
echo -e "\n1️⃣ Cleaning up old files..."
rm -rf .next
rm -rf node_modules/.cache
rm -f package-lock.json

# 2. Install missing dependencies
echo -e "\n2️⃣ Installing dependencies..."
npm install

# Install potentially missing packages
PACKAGES=(
    "@radix-ui/react-radio-group"
    "axios"
    "react-hot-toast"
    "sonner"
    "clsx"
    "tailwind-merge"
    "localforage"
)

echo -e "\n3️⃣ Installing potentially missing packages..."
for package in "${PACKAGES[@]}"; do
    if ! npm list "$package" >/dev/null 2>&1; then
        echo "Installing $package..."
        npm install "$package"
    fi
done

# 4. Type check
echo -e "\n4️⃣ Running type check..."
npm run type-check || echo "Type check failed - continuing anyway"

# 5. Create a test script
echo -e "\n5️⃣ Creating test startup script..."
cat > start-minimal.sh << 'EOF'
#!/bin/bash
echo "Starting PlotWeaver in minimal mode..."

# Use minimal layout if it exists
if [ -f app/layout.simple.tsx ]; then
    mv app/layout.tsx app/layout.full.tsx 2>/dev/null
    cp app/layout.simple.tsx app/layout.tsx
    echo "✅ Using minimal layout"
fi

# Start development server
npm run dev
EOF

chmod +x start-minimal.sh

echo -e "\n✅ Setup complete!"
echo -e "\n📋 Next steps:"
echo "1. Run diagnose script: node diagnose.js"
echo "2. Fix imports automatically: node fix-imports.js"
echo "3. Start minimal version: ./start-minimal.sh"
echo "4. Or start normal version: npm run dev"
