# Build layer template for an eventual TS migration
FROM node:20.15.0-slim AS builder
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM ghcr.io/puppeteer/puppeteer:22.12.1
ENV NODE_ENV=production

USER root

# Set working directory
WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy bot files
COPY . .

RUN chmod +x entrypoint.sh

USER pptruser

# Run bot
ENTRYPOINT [ "./entrypoint.sh" ]