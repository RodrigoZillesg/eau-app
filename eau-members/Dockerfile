# Production stage - use pre-built dist folder
FROM nginx:alpine

# Copy everything to temporary location
COPY . /tmp/source

# Copy pre-built application
RUN cp -r /tmp/source/dist/* /usr/share/nginx/html/ 2>/dev/null || true

# Copy nginx config
RUN cp /tmp/source/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

# Clean up
RUN rm -rf /tmp/source

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]