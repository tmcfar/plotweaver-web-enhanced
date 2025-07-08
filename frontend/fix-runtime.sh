#!/bin/bash

echo "🔧 PlotWeaver Runtime Fix Script"
echo "================================"

# 1. Fix the Select empty value issue
echo -e "\n1️⃣ Fixing Select component empty value issue..."
sed -i 's/<SelectItem value="">No template<\/SelectItem>/<SelectItem value="none">No template<\/SelectItem>/g' \
  src/components/projects/CreateProjectWizard.tsx

# Also fix the corresponding check
sed -i "s/value={formData.templateId || ''}/value={formData.templateId || 'none'}/g" \
  src/components/projects/CreateProjectWizard.tsx

sed -i "s/templateId: value || undefined/templateId: value === 'none' ? undefined : value/g" \
  src/components/projects/CreateProjectWizard.tsx

# 2. Use minimal layout temporarily
echo -e "\n2️⃣ Switching to minimal layout..."
if [ -f app/layout.tsx ]; then
    mv app/layout.tsx app/layout.complex.tsx
fi
cp app/layout.minimal.tsx app/layout.tsx

# 3. Clear Next.js cache
echo -e "\n3️⃣ Clearing Next.js cache..."
rm -rf .next

echo -e "\n✅ Fixes applied!"
echo -e "\nNow run: npm run dev"
