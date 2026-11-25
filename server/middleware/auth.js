import jwt from "jsonwebtoken";
export const ok=(res,data,message="OK",code=200)=>res.status(code).json({success:true,data,message});
export const fail=(res,code,message)=>res.status(code).json({success:false,data:null,message});
export function auth(req,res,next){ const h=req.headers.authorization||""; const t=h.startsWith("Bearer ")?h.slice(7):null; if(!t) return fail(res,401,"Authentication required"); try{ req.user=jwt.verify(t,process.env.JWT_SECRET||"dev-secret-change-me"); next(); }catch(e){ return fail(res,401,"Invalid or expired token: "+e.message); } }
export const adminOnly=(req,res,next)=>req.user?.role==="admin"?next():fail(res,403,"Admin access required");
export const errorHandler=(err,req,res,next)=>{ console.error("[API Error]",err); fail(res,err.status||500,err.message||"Internal server error"); };
