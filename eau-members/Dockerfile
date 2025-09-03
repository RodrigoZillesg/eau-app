# Production stage - use pre-built dist folder
FROM nginx:alpine

# Copy all files first to access nginx.conf and dist
COPY . /tmp/app

# Copy pre-built application
COPY /tmp/app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY /tmp/app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]