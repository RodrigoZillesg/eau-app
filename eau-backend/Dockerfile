# Production stage - Simplified for EasyPanel
FROM node:18-alpine

WORKDIR /app

# Copy package files (EasyPanel uses root context)
COPY eau-backend/package*.json ./

# Install production dependencies
RUN npm install --only=production --no-optional

# Copy pre-built dist folder
COPY eau-backend/dist ./dist

# Create public folder structure for uploads
RUN mkdir -p ./public/avatars ./public/events ./public/receipts

# Expose port
EXPOSE 3001

# Start application (run as root to avoid permission issues)
CMD ["node", "dist/index.js"]