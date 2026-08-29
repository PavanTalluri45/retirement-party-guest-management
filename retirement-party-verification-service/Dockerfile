# Use official Node.js 20 Alpine lightweight image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY src/ ./src/
COPY index.js ./

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5002

# Expose server port
EXPOSE 5002

# Start Verification Microservice
CMD ["node", "src/server.js"]
