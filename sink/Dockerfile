# sink/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy entire project (preserves relative paths)
COPY . .

# Install dependencies
RUN npm install

EXPOSE 4000

CMD ["node", "sink/sink.js"]
