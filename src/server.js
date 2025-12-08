import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// console.log("__filename", __filename);
// console.log("__dirname", __dirname);

// dotenv.config({ path: ".env" });
dotenv.config({ path: join(__dirname, "..", ".env") });

import app from "./app.js";
import connectDB from "./db/index.js";

console.log("🔍 ENV Check");
console.log("🔍 MONGO_URI", !!process.env.MONGO_URI);
console.log("🔍 PORT", process.env.PORT);
console.log("🔍 CUR_DIRECTORY", process.cwd());

const PORT = process.env.PORT || 6600;

connectDB().then(() => app.listen(PORT, () => console.log(`🟢 App running on port: ${PORT}`)));

/* https://www.youtube.com/shorts/L7WH5MiYrGg */