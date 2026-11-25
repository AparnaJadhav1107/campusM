import mongoose from "mongoose";
export let mongoConnected=false;
export async function connectDB(){
  const uri=process.env.MONGODB_URI;
  if(!uri || uri.includes("<username>")){ console.warn("[MongoDB Atlas] MONGODB_URI not set / placeholder — running in IN-MEMORY DEMO mode. Set a real Atlas URI in server/.env to use MongoDB."); return false; }
  try{ await mongoose.connect(uri,{serverSelectionTimeoutMS:8000}); mongoConnected=true; console.log("[MongoDB Atlas] Connected:", mongoose.connection.host); return true; }
  catch(err){ console.error("[MongoDB Atlas] Connection FAILED — provider error:", err.name, err.code||"", String(err.message).slice(0,300)); console.warn("[MongoDB Atlas] Falling back to IN-MEMORY DEMO mode so APIs keep working."); return false; }
}
