# Temporarily disable problematic features
cd frontend

# Remove Next.js API routes that don't work with Vite
rm -rf src/app/api/
rm -rf src/pages/api/

# Remove Sentry imports temporarily
sed -i 's/import.*@sentry\/nextjs.*;//g' src/lib/monitoring/sentry.ts

# Comment out problematic dependencies
