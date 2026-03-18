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

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built application
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY apps/ui/nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy startup script
COPY apps/ui/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Start nginx with environment variable validation
CMD ["/docker-entrypoint.sh"]