FROM node:16.14
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy bot files
COPY . .

RUN chmod +x entrypoint.sh

# Run bot
ENTRYPOINT [ "./entrypoint.sh" ]
