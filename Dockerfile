# Frontend - Static PWA served by nginx
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install

FROM nginx:alpine

# Build arguments
ARG ENVIRONMENT=main
ARG API_URL=https://boulder-edge-api.varga.media

# Copy static files
COPY index.html /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY icons/ /usr/share/nginx/html/icons/

# Override config.js with build-time API URL
RUN echo "window.BOULDER_CONFIG = { apiUrl: '${API_URL}' };" > /usr/share/nginx/html/js/config.js

# Generate nginx config based on environment
RUN if [ "$ENVIRONMENT" = "pre" ]; then \
    echo 'server { \
        listen 80; \
        root /usr/share/nginx/html; \
        index index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate" always; \
        add_header Pragma "no-cache" always; \
        expires 0; \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
    }' > /etc/nginx/conf.d/default.conf; \
else \
    echo 'server { \
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
        location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
        } \
        location ~* \.(js|css)$ { \
            expires 1d; \
            add_header Cache-Control "public, max-age=86400"; \
        } \
    }' > /etc/nginx/conf.d/default.conf; \
fi

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
