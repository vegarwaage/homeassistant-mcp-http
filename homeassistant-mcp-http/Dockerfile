ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js and jq
RUN apk add --no-cache nodejs npm jq

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files and build configuration
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Copy run script
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Run the script directly
CMD ["/run.sh"]
