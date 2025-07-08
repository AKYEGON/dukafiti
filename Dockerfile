# Multi-stage build for DukaFiti
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Set environment for build
ENV NODE_ENV=production

# Build frontend
RUN cd client && npm run build

# Build backend
RUN npx esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:@supabase/supabase-js --external:express --external:express-session --format=esm --target=node20

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 dukafiti

# Copy built application
COPY --from=builder --chown=dukafiti:nodejs /app/dist ./
COPY --from=builder --chown=dukafiti:nodejs /app/client/dist ./public
COPY --from=deps --chown=dukafiti:nodejs /app/node_modules ./node_modules

# Create package.json for production
RUN echo '{"type":"module","scripts":{"start":"node index.js"}}' > package.json

USER dukafiti

EXPOSE 5000

CMD ["npm", "start"]