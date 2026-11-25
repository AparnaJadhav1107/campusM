import bcrypt from "bcryptjs";
import {Stack} from "../dsa/Stack.js"; import {Queue} from "../dsa/Queue.js"; import {PriorityQueue} from "../dsa/PriorityQueue.js"; import {LinkedList} from "../dsa/LinkedList.js"; import {HashTable} from "../dsa/HashTable.js"; import {BinarySearchTree} from "../dsa/BinarySearchTree.js"; import {Graph} from "../dsa/Graph.js";
export const db={users:[],students:[],complaints:[],assignments:[],notifications:[],activity:[],historyByComplaint:new Map()};
export const studentHash=new HashTable(53); export const studentBST=new BinarySearchTree(); export const complaintQueue=new Queue(); export const priorityQueue=new PriorityQueue(); export const undoStack=new Stack(); export const historyList=new LinkedList(); export const campusGraph=new Graph();
let seq=1000; export const nextId=p=>`${p}-${++seq}`;
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString()};
export function rebuildIndexes(){ studentHash && db.students.forEach(s=>studentHash.set(s.studentId,s)); db.students.forEach(s=>studentBST.insert(s.studentId,s)); }
export function rebuildQueues(){ complaintQueue.clear(); priorityQueue.clear(); db.complaints.filter(c=>!["Resolved","Rejected"].includes(c.status)).forEach(c=>{ if(["Critical","High"].includes(c.priority)) priorityQueue.insert(c); else complaintQueue.enqueue(c); }); }
export function addHistory(complaintId,action,previousStatus,newStatus,adminId="system"){ const e={id:nextId("EVT"),complaintId,action,previousStatus,newStatus,adminId,timestamp:new Date().toISOString()}; if(!db.historyByComplaint.has(complaintId)) db.historyByComplaint.set(complaintId,new LinkedList()); db.historyByComplaint.get(complaintId).insertAtEnd(e); historyList.insertAtEnd(e); db.activity.unshift({id:nextId("ACT"),action,actor:adminId,detail:`${complaintId}: ${action}`,timestamp:e.timestamp}); return e; }
export function seed(){
 if(db.users.length) return;
 const rounds=parseInt(process.env.BCRYPT_SALT_ROUNDS||"10"); const hash=p=>bcrypt.hashSync(p,rounds);
 const adminEmail=(process.env.ADMIN_EMAIL||"admin@campus.edu").toLowerCase(); const studentEmail=(process.env.DEMO_STUDENT_EMAIL||"student@campus.edu").toLowerCase();
 db.users.push({id:"U-1",name:process.env.ADMIN_NAME||"Campus Admin",email:adminEmail,password:hash(process.env.ADMIN_PASSWORD||"Admin@123"),role:"admin"});
 db.users.push({id:"U-2",name:"Aarav Sharma",email:studentEmail,password:hash(process.env.DEMO_STUDENT_PASSWORD||"Student@123"),role:"student",studentRef:"2021001"});
 const depts=["Computer Science","Electronics","Mechanical","Civil","Information Technology"];
 const names=["Aarav Sharma","Priya Nair","Rohan Patel","Sneha Kulkarni","Arjun Mehta","Kavya Reddy","Vikram Singh","Ananya Iyer","Kabir Joshi","Meera Desai","Nikhil Rao","Isha Verma"];
 db.students=names.map((n,i)=>({id:`S-${i+1}`,studentId:2021001+i,fullName:n,email:i===0?studentEmail:`student${i+1}@campus.edu`,phone:`98${String(10000000+i*137).slice(0,8)}`,department:depts[i%depts.length],course:"B.Tech",year:(i%4)+1,registrationDate:daysAgo(300-i*10),status:"Active"}));
 const cats=["Classroom","Hostel","Library","Laboratory","Transportation","Other"]; const pris=["Low","Medium","High","Critical"]; const stats=["Submitted","Under Review","Assigned","Resolved","Resolved","Pending"];
 const descs=["Projector not working in lecture hall","Water leakage in hostel room","Library AC not cooling","Lab computer mouse missing","Bus delayed on morning route","Wi-Fi drops in classroom block","Broken chair needs replacement","Hostel hot water unavailable","Library book issue desk queue","Chemistry lab ventilation issue","Transport pass renewal delay","Canteen seating damaged"];
 db.complaints=descs.map((d,i)=>({id:`C-${i+1}`,complaintId:`CMP-${1001+i}`,studentId:2021001+(i%names.length),studentName:names[i%names.length],category:cats[i%cats.length],description:d,location:["Main Building","Hostel","Library","Laboratory","Sports Ground","Cafeteria","Administration Office"][i%7],priority:pris[i%pris.length],status:stats[i%stats.length],assignedTo:i%3===0?"Facilities Team":"",adminNotes:"",createdAt:daysAgo(i%8),updatedAt:daysAgo(i%3)}));
 const verts=["Library","Main Building","Cafeteria","Hostel","Laboratory","Sports Ground","Administration Office"]; verts.forEach(v=>campusGraph.addVertex(v));
 [["Library","Main Building",120],["Main Building","Administration Office",80],["Main Building","Laboratory",150],["Laboratory","Sports Ground",200],["Sports Ground","Hostel",180],["Hostel","Cafeteria",90],["Cafeteria","Library",110],["Cafeteria","Main Building",70]].forEach(([a,b,w])=>campusGraph.addEdge(a,b,w));
 rebuildIndexes(); rebuildQueues(); db.complaints.forEach(c=>addHistory(c.complaintId,"Submitted","",c.status,"student"));
 console.log("[Seed] DEMO data seeded (labelled demo): admin +",db.students.length,"students,",db.complaints.length,"complaints");
}
