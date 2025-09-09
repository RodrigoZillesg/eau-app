# Frontend - serve pre-built static files
FROM nginx:alpine

# Debug: Show current directory
RUN pwd && ls -la

# Remove ALL default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy dist folder - Note: context depends on EasyPanel setup
# If context is eau-members folder:
COPY ./dist/. /usr/share/nginx/html/
# Debug: Show what was copied
RUN ls -la /usr/share/nginx/html/

# Copy nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]