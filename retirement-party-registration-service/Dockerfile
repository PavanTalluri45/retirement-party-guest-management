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

# Default port
# Render can override this with its PORT environment variable.
ENV PORT=5001

# Document the container port
EXPOSE 5001

# Start Registration Service
CMD ["node", "index.js"]