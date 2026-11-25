const BASE=import.meta.env.VITE_API_URL||"http://localhost:5000/api";
export async function api(path,opts={}){ const token=localStorage.getItem("campus_token"); const r=await fetch(BASE+path,{...opts,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}) ,...(opts.headers||{})}}); const j=await r.json().catch(()=>({success:false,message:"Server returned non-JSON"})); if(!r.ok) throw new Error(j.message||`HTTP ${r.status}`); return j.data; }
export const csvUrl=BASE+"/reports/export.csv";
