# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from root
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project (except ignored files)
COPY . .

# Expose API port
EXPOSE 5000

# Start API server
CMD ["node", "api/index.js"]
