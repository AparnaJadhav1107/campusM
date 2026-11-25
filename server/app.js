import express from "express"; import cors from "cors"; import helmet from "helmet"; import morgan from "morgan"; import rateLimit from "express-rate-limit";
import {router} from "./routes/api.js"; import {errorHandler,fail} from "./middleware/auth.js";
export const app=express();
app.use(helmet()); app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173",credentials:true})); app.use(express.json({limit:"1mb"})); app.use(morgan("dev")); app.use("/api",rateLimit({windowMs:15*60*1000,max:1000}));
app.use("/api",router); app.use((req,res)=>fail(res,404,"Route not found")); app.use(errorHandler);
