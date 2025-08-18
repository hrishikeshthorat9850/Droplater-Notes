# worker/Dockerfile
FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# The worker might be a single “worker.js” file or a script in package.json
# Adjust this to match your entry point
CMD ["node", "worker.js"]
