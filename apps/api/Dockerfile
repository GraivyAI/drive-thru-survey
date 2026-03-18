# Build stage for survey API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY tsconfig.base.json ./

# Install workspace dependencies from monorepo root
RUN npm ci

# Copy source code
COPY apps/api/ ./apps/api/

# Build the application
RUN npm run build --workspace=apps/api && ls -la apps/api/dist/ | head -10

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy workspace manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Expose port
EXPOSE 3010

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3010

# Run the application
WORKDIR /app/apps/api
CMD ["node", "dist/main"]