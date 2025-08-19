const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") }); // load .env from parent folder

const mongoose = require("mongoose");

console.log("MongoUrl is", process.env.MONGO_URI);

async function dbConnection() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connection success ✅");
    return connection;
  } catch (err) {
    console.error("MongoDB connection failed ❌", err);
    process.exit(1);
  }
}

module.exports = dbConnection ;
