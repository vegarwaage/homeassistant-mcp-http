ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js and jq (for config parsing)
RUN apk add --no-cache nodejs npm jq

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

# Copy the run script
COPY run.sh /run.sh
RUN chmod a+x /run.sh

# Start the server
CMD ["/run.sh"]
