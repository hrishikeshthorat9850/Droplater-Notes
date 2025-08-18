# sink/Dockerfile
FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Expose the port your sink/webhook receiver listens on
EXPOSE 8080

CMD ["node", "index.js"]
