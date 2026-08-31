# Use official Node.js 20 Alpine lightweight image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY src/ ./src/
COPY index.js ./

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=4001

# Expose WebSocket server port
EXPOSE 4001

# Start WebSocket Service
CMD ["node", "src/server.js"]

