class Node{constructor(data){this.data=data;this.next=null}}
export class LinkedList{constructor(){this.head=null;this.length=0}
 insertAtBeginning(d){const n=new Node(d);n.next=this.head;this.head=n;this.length++;return this.length}
 insertAtEnd(d){const n=new Node(d);if(!this.head){this.head=n}else{let c=this.head;while(c.next)c=c.next;c.next=n}this.length++;return this.length}
 delete(d){const key=typeof d==='object'?JSON.stringify(d):d;let c=this.head,prev=null;while(c){const k=typeof c.data==='object'?JSON.stringify(c.data):c.data;if(k===key){if(prev)prev.next=c.next;else this.head=c.next;this.length--;return c.data}prev=c;c=c.next}return undefined}
 search(d){let c=this.head,i=0;while(c){if(c.data===d||JSON.stringify(c.data)===JSON.stringify(d))return i;c=c.next;i++}return -1}
 traverse(){const a=[];let c=this.head;while(c){a.push(c.data);c=c.next}return a}size(){return this.length}clear(){this.head=null;this.length=0}}
export default LinkedList;
