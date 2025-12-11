# Backend - Node.js API with SQLite
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY server.js ./

# Create data directory for SQLite
RUN mkdir -p /data

# Environment variables
ENV PORT=3001
ENV DATABASE_PATH=/data/boulder.db
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server.js"]
