import {NavLink,Outlet,useLocation,useNavigate} from "react-router-dom"; import {useState} from "react";
import {LayoutDashboard,Users,MessageSquareWarning,ListOrdered,Flame,Map,Shapes,BarChart3,History,Settings,LogOut,Search,Bell,MessageCircle,ChevronDown,Menu,LayoutGrid,X} from "lucide-react";
import {useAuthStore,useUIStore} from "../../store/index.js";
const links=[["/","Dashboard",LayoutDashboard],["/students","Students",Users],["/complaints","Complaints",MessageSquareWarning],["/queue","Complaint Queue",ListOrdered],["/priority","Priority Requests",Flame],["/resources","Campus Resources",Map],["/dsa","DSA Visualizer",Shapes],["/reports","Reports",BarChart3],["/activity","Activity History",History],["/settings","Settings",Settings]];
export default function Layout(){ const {user,logout}=useAuthStore(); const {sidebarOpen,setSidebar,toast}=useUIStore(); const loc=useLocation(); const nav=useNavigate(); const [q,setQ]=useState("");
 const title=links.find(l=>l[0]===loc.pathname)?.[1]||(loc.pathname.startsWith("/complaints/")?"Complaint Detail":"Smart Campus");
 const Sidebar=<aside className="w-[240px] shrink-0 bg-white min-h-full p-5 flex flex-col gap-1 rounded-l-3xl">
   <div className="flex items-center gap-2 px-1 pb-6"><span className="grid grid-cols-2 gap-[3px] bg-primary text-white p-2 rounded-lg"><LayoutGrid size={14}/></span><div><div className="font-extrabold leading-none">Smart Campus</div><div className="text-[11px] text-muted">Management System</div></div><button className="ml-auto md:hidden" onClick={()=>setSidebar(false)}><X size={18}/></button></div>
   {links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==="/"} onClick={()=>setSidebar(false)} className={({isActive})=>"navlink"+(isActive?" active":"")}><Icon size={18}/>{label}</NavLink>)}
   <div className="border-t mt-4 pt-4"><button className="navlink w-full" onClick={()=>{logout();nav("/login")}}><LogOut size={18}/>Logout</button></div>
   <div className="mt-auto text-[11px] text-muted px-2">Role: <b className="text-ink capitalize">{user?.role||"guest"}</b><br/>Demo data is labelled in README / seed log.</div></aside>;
 return <div className="min-h-screen p-2 sm:p-4" style={{background:"#EFE6DA"}}>
  <div className="bg-bgwarm rounded-3xl flex overflow-hidden min-h-[calc(100vh-2rem)] shadow-xl">
   <div className="hidden md:block">{Sidebar}</div>
   {sidebarOpen&&<div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={()=>setSidebar(false)}><div className="bg-white h-full w-[240px]" onClick={e=>e.stopPropagation()}>{Sidebar}</div></div>}
   <main className="flex-1 min-w-0 p-4 sm:p-6 fade-up">
    <header className="flex items-center gap-3 flex-wrap mb-6">
      <button className="md:hidden btn-ghost !px-2" onClick={()=>setSidebar(true)}><Menu size={18}/></button>
      <h1 className="text-[26px] sm:text-[30px] font-extrabold">{title}</h1>
      <div className="ml-auto flex items-center gap-3 flex-wrap">
        <form className="relative" onSubmit={e=>{e.preventDefault();nav("/complaints?search="+encodeURIComponent(q))}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search students, complaints, etc" className="input !rounded-full !bg-white w-[240px] pr-9"/><Search size={16} className="absolute right-3 top-3 text-muted"/></form>
        <span className="relative bg-white p-2 rounded-full"><MessageCircle size={18}/></span>
        <span className="relative bg-white p-2 rounded-full"><Bell size={18}/><span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"/></span>
        <div className="flex items-center gap-2 bg-white rounded-full pl-1 pr-2 py-1"><span className="w-9 h-9 rounded-full bg-peach grid place-items-center font-bold text-primary">{(user?.name||"U").slice(0,1)}</span><span className="leading-tight"><b className="block text-sm">{user?.name||"Guest"}</b><small className="text-muted capitalize">{user?.role||""}</small></span><ChevronDown size={15} className="text-muted"/></div>
      </div>
    </header>
    <Outlet/>
   </main>
  </div>
  {toast&&<div className="fixed bottom-5 right-5 z-50 bg-ink text-white px-4 py-3 rounded-xl pop-in shadow-xl text-sm">{toast}</div>}
 </div>; }
