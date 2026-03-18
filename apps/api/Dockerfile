# Build stage for survey API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and tsconfig
COPY apps/api/package*.json ./apps/api/
COPY tsconfig.base.json ./

# Install dependencies
WORKDIR /app/apps/api
RUN npm ci

# Copy source code
WORKDIR /app
COPY apps/api/ ./apps/api/

# Build the application
WORKDIR /app/apps/api
RUN npx nest build && ls -la dist/ | head -10

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/apps/api/dist ./dist

# Expose port
EXPOSE 3010

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3010

# Run the application
CMD ["node", "dist/main"]