# Production stage - Simplified for Ubuntu
FROM node:18-alpine

WORKDIR /app

# Copy package files explicitly (context is repo root)
COPY eau-backend/package.json eau-backend/package-lock.json ./

# Install production dependencies using npm ci (we have lock file)
RUN npm ci --omit=dev

# Copy pre-built dist folder
COPY eau-backend/dist ./dist

# Create public folder structure for uploads
RUN mkdir -p ./public/avatars ./public/events ./public/receipts

# Expose port
EXPOSE 3001

# Start application (run as root to avoid permission issues)
CMD ["node", "dist/index.js"]