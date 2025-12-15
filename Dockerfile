# Frontend - Static PWA served by nginx
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install

FROM nginx:alpine

# Copy static files
COPY index.html /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY icons/ /usr/share/nginx/html/icons/

# Custom nginx config for SPA with proper cache headers
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location = /sw.js { \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        expires 0; \
    } \
    location = /index.html { \
        add_header Cache-Control "no-cache, must-revalidate"; \
        expires 0; \
    } \
    location ~* \.(css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.js$ { \
        expires 1d; \
        add_header Cache-Control "public, max-age=86400"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
