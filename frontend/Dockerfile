# PlotWeaver UI Docker Configuration - Production Optimized
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --only=production

# Install all dependencies for building
FROM base AS dev-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEFAULT_MODE_SET=professional-writer
ARG NEXT_PUBLIC_AVAILABLE_MODE_SETS=professional-writer,ai-first,editor,hobbyist
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_ENABLE_LOCKING=true
ARG NEXT_PUBLIC_ENABLE_PREGENERATION=true
ARG NEXT_PUBLIC_ENABLE_CONTINUITY=true
ARG NEXT_PUBLIC_ENABLE_COLLABORATION=true
ARG NEXT_PUBLIC_ENABLE_GIT_INTEGRATION=true
ARG NEXT_PUBLIC_ENABLE_OFFLINE=true
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_ANALYTICS_ID
ARG SENTRY_AUTH_TOKEN

# Set environment variables for build
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_DEFAULT_MODE_SET=$NEXT_PUBLIC_DEFAULT_MODE_SET
ENV NEXT_PUBLIC_AVAILABLE_MODE_SETS=$NEXT_PUBLIC_AVAILABLE_MODE_SETS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_ENABLE_LOCKING=$NEXT_PUBLIC_ENABLE_LOCKING
ENV NEXT_PUBLIC_ENABLE_PREGENERATION=$NEXT_PUBLIC_ENABLE_PREGENERATION
ENV NEXT_PUBLIC_ENABLE_CONTINUITY=$NEXT_PUBLIC_ENABLE_CONTINUITY
ENV NEXT_PUBLIC_ENABLE_COLLABORATION=$NEXT_PUBLIC_ENABLE_COLLABORATION
ENV NEXT_PUBLIC_ENABLE_GIT_INTEGRATION=$NEXT_PUBLIC_ENABLE_GIT_INTEGRATION
ENV NEXT_PUBLIC_ENABLE_OFFLINE=$NEXT_PUBLIC_ENABLE_OFFLINE
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_ANALYTICS_ID=$NEXT_PUBLIC_ANALYTICS_ID
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Build the application with telemetry disabled
ENV NEXT_TELEMETRY_DISABLED=1

# Run build with proper error handling
RUN npm run build && \
    # Generate service worker manifest
    npm run generate-sw && \
    # Create standalone output
    npm run build:standalone

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create nextjs user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets (including PWA icons and manifest)
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy service worker
COPY --from=builder --chown=nextjs:nodejs /app/public/sw.js ./public/sw.js

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/.next/cache && \
    chown -R nextjs:nodejs /app/logs /app/uploads /app/.next

# Security: Remove unnecessary files
RUN rm -rf /app/.env* /app/README.md /app/docs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
