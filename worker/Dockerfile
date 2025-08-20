# worker/Dockerfile
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy the entire project into the container
COPY . .

# Install dependencies
RUN npm install

# Start the worker
CMD ["node", "worker/worker.js"]
