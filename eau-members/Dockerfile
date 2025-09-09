# Production stage - use pre-built dist folder
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy built dist folder directly (EasyPanel context is root)
COPY eau-members/dist /usr/share/nginx/html

# Copy nginx config
COPY eau-members/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]