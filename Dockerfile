# Multi-stage Dockerfile for GJS Railway Board Studio
# Stage 1: Build application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production Nginx runtime
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard web port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

