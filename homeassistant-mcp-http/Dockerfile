ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js and jq (for config parsing)
RUN apk add --no-cache nodejs npm jq bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source files and build configuration
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Copy and set up start script
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Use exec form and run directly with bash
CMD ["bash", "/app/run.sh"]
