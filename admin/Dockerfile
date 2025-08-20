# Use a small Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json from the build context (./admin)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the admin folder content
COPY . .

# Expose the port for Vite preview
EXPOSE 80

# Start Vite preview server
CMD ["npm","run","dev","--","--host","0.0.0.0"]