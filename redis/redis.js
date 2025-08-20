const {Redis} = require("ioredis");

const connection = new Redis({
    host: process.env.REDIS_HOST || "redis",
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

module.exports = connection;