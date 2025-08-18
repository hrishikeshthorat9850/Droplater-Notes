# api/Dockerfile
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port (same as the port your Express API uses)
EXPOSE 5000

CMD ["node", "index.js"]
