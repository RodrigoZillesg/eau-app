# Production stage - use pre-built dist folder
FROM nginx:alpine

# Copy all source files including dist and nginx.conf
COPY . .

# Move dist to nginx html folder
RUN mv dist/* /usr/share/nginx/html/

# Move nginx config
RUN mv nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]