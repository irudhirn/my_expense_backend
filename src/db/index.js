import mongoose from "mongoose";


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