export class HashTable{constructor(capacity=53){this.capacity=capacity;this.buckets=Array.from({length:capacity},()=>[]);this.count=0}
 hash(key){const s=String(key);let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))%this.capacity}return h}
 set(key,value){const i=this.hash(key);const b=this.buckets[i];const ex=b.find(e=>e.key===key);if(ex){ex.value=value;return value}b.push({key,value});this.count++;return value}
 insert(k,v){return this.set(k,v)} get(key){const b=this.buckets[this.hash(key)];const e=b.find(x=>x.key===key);return e?e.value:undefined}
 search(k){return this.get(k)} delete(key){const b=this.buckets[this.hash(key)];const i=b.findIndex(x=>x.key===key);if(i<0)return false;b.splice(i,1);this.count--;return true}
 update(k,v){return this.set(k,v)} size(){return this.count} entries(){return this.buckets.flatMap(b=>b.map(e=>[e.key,e.value]))} display(){return this.buckets.map((b,i)=>({bucket:i,entries:b}))}}
export default HashTable;
