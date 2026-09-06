# Use Node.js 22 Alpine
FROM node:22-alpine AS runner

# Application working directory
WORKDIR /usr/src/app

# Copy dependency files first for Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source code
COPY src/ ./src/
COPY index.js ./

# Production environment
ENV NODE_ENV=production

# Default WebSocket Service port
# Render can override this using PORT.
ENV PORT=4001

# Document container port
EXPOSE 4001

# Start WebSocket Service
CMD ["node", "src/server.js"]