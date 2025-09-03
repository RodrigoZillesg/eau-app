# Production stage - use pre-built dist folder
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy everything to container
COPY . .

# Since EasyPanel uses root context, dist is in eau-members/dist
RUN if [ -d "eau-members/dist" ]; then \
      cp -r eau-members/dist/* /usr/share/nginx/html/; \
    elif [ -d "dist" ]; then \
      cp -r dist/* /usr/share/nginx/html/; \
    else \
      echo "ERROR: dist folder not found!" && ls -la && exit 1; \
    fi

# Copy nginx config (try both locations)
RUN if [ -f "eau-members/nginx.conf" ]; then \
      cp eau-members/nginx.conf /etc/nginx/conf.d/default.conf; \
    elif [ -f "nginx.conf" ]; then \
      cp nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
      echo "ERROR: nginx.conf not found!" && ls -la && exit 1; \
    fi

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]