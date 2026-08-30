# Use official Node.js 20 Alpine lightweight image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY src/ ./src/

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5003

# Expose server port
EXPOSE 5003

# Start Analytics Microservice
CMD ["node", "src/server.js"]

