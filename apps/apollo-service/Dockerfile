# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy all project files
COPY . .

# Clean existing node_modules
RUN rm -rf node_modules

# Install all dependencies from monorepo
RUN pnpm install -r --no-frozen-lockfile

# Build only apollo-service
RUN pnpm --filter @mcpfactory/apollo-service build

# Prepare production directory with only production dependencies
RUN pnpm deploy --filter @mcpfactory/apollo-service --legacy /prod

# Copy built files to production directory
RUN cp -r /app/apps/apollo-service/dist /prod/dist

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy production directory from builder
COPY --from=builder /prod .

# Force IPv4 first to avoid IPv6 connection issues with Neon
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

CMD ["node", "dist/index.js"]
