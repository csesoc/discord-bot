# Build layer template for an eventual TS migration
FROM node:20.13.1-slim as builder
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20.13.1-slim
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy bot files
COPY . .

RUN chmod +x entrypoint.sh

# Run bot
ENTRYPOINT [ "./entrypoint.sh" ]