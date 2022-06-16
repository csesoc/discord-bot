FROM node:latest
ENV NODE_ENV=production

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy bot files
COPY . .

# Run bot
ENTRYPOINT [ "./entrypoint.sh" ]