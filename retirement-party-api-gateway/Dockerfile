FROM node:20-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY src ./src
COPY index.js ./

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "index.js"]

