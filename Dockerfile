# ============================================
# SCHOOL MANAGEMENT SYSTEM - DOCKERFILE
# Multi-stage build for Next.js 15 with standalone output
# ============================================

# ============================================
# STAGE 1: Dependencies
# Install all dependencies (including devDependencies)
# ============================================
FROM node:20-alpine AS deps

# Install security updates and required packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
# Use npm ci for reproducible builds (uses package-lock.json)
# Configure npm for better reliability on slow networks
# Use cache mount to persist npm cache between builds (requires BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# ============================================
# STAGE 2: Builder
# Build the Next.js application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment variables for build
# Next.js collects anonymous telemetry data - disable for production
ENV NEXT_TELEMETRY_DISABLED=1

# Provide placeholder environment variables for build
# These prevent build errors when code references env vars at module level
# Real values will be provided at runtime
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV DATABASE_PROVIDER=azure

# Build the Next.js application
# The standalone output will be in .next/standalone
RUN npm run build

# ============================================
# STAGE 3: Runner
# Production image with minimal size
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
# Don't run as root in containers (security best practice)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js standalone output includes only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port 3000 (Next.js default)
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
# Docker will check if the app is healthy every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
# Use node instead of npm for faster startup and better signal handling
CMD ["node", "server.js"]
