import dotenv from "dotenv";

dotenv.config({
  path: ".env"
});

import app from "./app.js";
import connectDB from "./db/index.js";

// dotenv.config();

console.log("🔍 ENV Check");
console.log("🔍 MONGO_URI", !!process.env.MONGO_URI);
console.log("🔍 PORT", process.env.PORT);
console.log("🔍 CUR_DIRECTORY", process.cwd());

const PORT = process.env.PORT || 6600;

connectDB().then(() => app.listen(PORT, () => console.log(`🟢 App running on port: ${PORT}`)));

/* https://www.youtube.com/shorts/L7WH5MiYrGg */