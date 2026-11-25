import dotenv from "dotenv"; dotenv.config();
import {app} from "./app.js"; import {connectDB} from "./config/db.js"; import {seed} from "./services/store.js";
const PORT=process.env.PORT||5000; await connectDB(); seed(); app.listen(PORT,()=>console.log(`[Smart Campus Server] Listening on http://localhost:${PORT} (mode: ${process.env.NODE_ENV||"development"})`));
