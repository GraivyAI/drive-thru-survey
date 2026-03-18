# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package*.json ./
COPY apps/ui/package*.json ./apps/ui/
COPY tsconfig.base.json ./

# Install workspace dependencies from monorepo root
RUN npm ci

# Copy source code
COPY apps/ui/ ./apps/ui/

# Build the application
RUN npm run build --workspace=apps/ui && ls -la apps/ui/dist/ | head -10

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