FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY sink/. .

EXPOSE 4000
CMD ["node", "sink.js"]
