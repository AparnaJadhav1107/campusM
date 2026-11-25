const RANK={Low:1,Medium:2,High:3,Critical:4};
export class PriorityQueue{constructor(){this.heap=[];this.seq=0}
 compare(a,b){const d=(RANK[b.priority]||0)-(RANK[a.priority]||0);return d!==0?d:a.seq-b.seq}
 insert(item){const n={...item,seq:this.seq++};this.heap.push(n);this.bubbleUp(this.heap.length-1);return this.size()}
 bubbleUp(i){while(i>0){const p=Math.floor((i-1)/2);if(this.compare(this.heap[i],this.heap[p])<0){[this.heap[i],this.heap[p]]=[this.heap[p],this.heap[i]];i=p}else break}}
 sinkDown(i){const n=this.heap.length;while(true){let l=2*i+1,r=l+1,m=i;if(l<n&&this.compare(this.heap[l],this.heap[m])<0)m=l;if(r<n&&this.compare(this.heap[r],this.heap[m])<0)m=r;if(m===i)break;[this.heap[i],this.heap[m]]=[this.heap[m],this.heap[i]];i=m}}
 extractMax(){if(this.isEmpty())return undefined;const top=this.heap[0];const last=this.heap.pop();if(this.heap.length){this.heap[0]=last;this.sinkDown(0)}return top}
 peek(){return this.heap[0]}isEmpty(){return this.heap.length===0}size(){return this.heap.length}toArray(){return [...this.heap].sort((a,b)=>this.compare(a,b))}clear(){this.heap=[]}}
export default PriorityQueue;
