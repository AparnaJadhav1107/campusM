export class Graph{constructor(){this.adj=new Map()}
 addVertex(v){if(!this.adj.has(v))this.adj.set(v,new Map());return v}
 addEdge(a,b,w=1){this.addVertex(a);this.addVertex(b);this.adj.get(a).set(b,w);this.adj.get(b).set(a,w)}
 removeEdge(a,b){this.adj.get(a)?.delete(b);this.adj.get(b)?.delete(a)}
 removeVertex(v){for(const n of this.adj.get(v)?.keys()||[])this.adj.get(n)?.delete(v);this.adj.delete(v)}
 vertices(){return [...this.adj.keys()]} edges(){const e=[];const seen=new Set();for(const [a,ns] of this.adj)for(const [b,w] of ns){const k=[a,b].sort().join('|');if(!seen.has(k)){seen.add(k);e.push({from:a,to:b,weight:w})}}return e}
 bfs(start){const seen=new Set([start]);const q=[start];const out=[];while(q.length){const v=q.shift();out.push(v);for(const n of this.adj.get(v)?.keys()||[])if(!seen.has(n)){seen.add(n);q.push(n)}}return out}
 dfs(start,seen=new Set(),out=[]){if(!this.adj.has(start))return out;seen.add(start);out.push(start);for(const n of this.adj.get(start).keys())if(!seen.has(n))this.dfs(n,seen,out);return out}
 dijkstra(start,end){const dist={},prev={},vis=new Set();for(const v of this.adj.keys())dist[v]=Infinity;dist[start]=0;while(true){let u=null,best=Infinity;for(const v of this.adj.keys())if(!vis.has(v)&&dist[v]<best){best=dist[v];u=v}if(u===null)break;if(u===end)break;vis.add(u);for(const [n,w] of this.adj.get(u)){if(dist[u]+w<dist[n]){dist[n]=dist[u]+w;prev[n]=u}}}if(dist[end]===Infinity)return{path:[],distance:Infinity};const path=[];let c=end;while(c){path.unshift(c);c=prev[c]}return{path,distance:dist[end],distances:dist}}
 shortestPath(s,e){return this.dijkstra(s,e)} toJSON(){return{vertices:this.vertices(),edges:this.edges()}}}
export default Graph;
