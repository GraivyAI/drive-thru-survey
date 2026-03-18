# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and configs
COPY apps/ui/package*.json ./apps/ui/
COPY tsconfig.base.json ./

# Install dependencies
WORKDIR /app/apps/ui
RUN npm ci

# Copy source code
WORKDIR /app
COPY apps/ui/ ./apps/ui/

# Build the application
WORKDIR /app/apps/ui
RUN npm run build && ls -la dist/ | head -10

# Runtime stage
FROM nginx:alpine AS runtime

# Copy built application
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/ui/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]