import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env"
});

console.log("process.env.MONGO_COMPASS_URI", process.env.MONGO_COMPASS_URI);

const connectDB = async () => {
  try{
    await mongoose.connect(`${process.env.MONGO_COMPASS_URI}`);
    console.log(`✅ Database connected.`);
  }catch(err){
    console.error("DB connection failed: ❌💥", err);
    process.exit(1);
  }
}

export default connectDB;