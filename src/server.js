import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./db/index.js";

// dotenv.config({
//   path: ".env"
// });
dotenv.config();

const PORT = process.env.PORT || 6600;

connectDB().then(() => app.listen(PORT, () => console.log(`🟢 App running on port: ${PORT}`)));

/* https://www.youtube.com/shorts/L7WH5MiYrGg */