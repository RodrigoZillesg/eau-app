# Production stage - use pre-built dist folder
FROM nginx:alpine

WORKDIR /app

# Copy all source files including dist and nginx.conf
COPY . .

# Debug: Check what we have
RUN ls -la && ls -la dist/ || echo "No dist folder found"

# Move dist to nginx html folder (if it exists)
RUN if [ -d "dist" ]; then mv dist/* /usr/share/nginx/html/; else echo "Warning: dist folder not found"; fi

# Move nginx config (if it exists)
RUN if [ -f "nginx.conf" ]; then mv nginx.conf /etc/nginx/conf.d/default.conf; else echo "Warning: nginx.conf not found"; fi

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]