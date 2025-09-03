# Production stage - use pre-built dist folder
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy everything to container
COPY . .

# Move dist contents to nginx html folder
RUN if [ -d "dist" ]; then \
      cp -r dist/* /usr/share/nginx/html/; \
    else \
      echo "ERROR: dist folder not found!" && ls -la && exit 1; \
    fi

# Copy nginx config
RUN if [ -f "nginx.conf" ]; then \
      cp nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
      echo "ERROR: nginx.conf not found!" && ls -la && exit 1; \
    fi

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]