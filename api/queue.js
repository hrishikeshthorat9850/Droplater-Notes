const {Queue} = require("bullmq");
const connection = require("../redis/redis");

const myQueue = new Queue("notes-queue",{connection});

module.exports = myQueue;