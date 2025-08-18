const dotenv = require("dotenv");
const {createClient} = require("redis");
dotenv.config();

const redisClient = createClient({
    url:process.env.REDIS_URL
})

async function connectRedis(){
    try{
        await redisClient.connect();
        console.log("Redis Client Connectes...");
    }catch(err){
        console.error("Redis Connection Failed...",err)
    }
}

function getRedis() {
  return redisClient;
}

module.exports = {connectRedis,getRedis}