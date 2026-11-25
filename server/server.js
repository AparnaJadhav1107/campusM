import dotenv from "dotenv";
dotenv.config();
import { app } from "./app.js";
import { connectDB, isMongo } from "./config/db.js";
import { loadMem } from "./services/store.js";

const PORT = process.env.PORT || 5000;
await connectDB();
if (!isMongo()) loadMem(); // starts COMPLETELY EMPTY unless records were created via API / manual seed
app.listen(PORT, () =>
  console.log(
    `[Smart Campus Server] Listening on http://localhost:${PORT} ` +
      `(mode: ${process.env.NODE_ENV || "development"}, store: ${isMongo() ? "mongodb" : "in-memory"})`
  )
);
