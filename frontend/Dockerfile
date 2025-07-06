# PlotWeaver UI Docker Configuration
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEFAULT_MODE_SET=professional-writer
ARG NEXT_PUBLIC_AVAILABLE_MODE_SETS=professional-writer,ai-first,editor,hobbyist
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENABLE_LOCKING=true
ARG NEXT_PUBLIC_ENABLE_PREGENERATION=true
ARG NEXT_PUBLIC_ENABLE_CONTINUITY=true
ARG NEXT_PUBLIC_ENABLE_COLLABORATION=true
ARG NEXT_PUBLIC_ENABLE_GIT_INTEGRATION=true
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_ANALYTICS_ID

# Set environment variables for build
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_DEFAULT_MODE_SET=$NEXT_PUBLIC_DEFAULT_MODE_SET
ENV NEXT_PUBLIC_AVAILABLE_MODE_SETS=$NEXT_PUBLIC_AVAILABLE_MODE_SETS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENABLE_LOCKING=$NEXT_PUBLIC_ENABLE_LOCKING
ENV NEXT_PUBLIC_ENABLE_PREGENERATION=$NEXT_PUBLIC_ENABLE_PREGENERATION
ENV NEXT_PUBLIC_ENABLE_CONTINUITY=$NEXT_PUBLIC_ENABLE_CONTINUITY
ENV NEXT_PUBLIC_ENABLE_COLLABORATION=$NEXT_PUBLIC_ENABLE_COLLABORATION
ENV NEXT_PUBLIC_ENABLE_GIT_INTEGRATION=$NEXT_PUBLIC_ENABLE_GIT_INTEGRATION
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_ANALYTICS_ID=$NEXT_PUBLIC_ANALYTICS_ID

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create logs directory
RUN mkdir -p /app/logs && chown nextjs:nodejs /app/logs

# Create uploads directory for local file storage
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Switch to nextjs user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]