export class Stack{constructor(){this.items=[]}push(v){this.items.push(v);return this.size()}pop(){return this.items.pop()}peek(){return this.items[this.items.length-1]}isEmpty(){return this.items.length===0}size(){return this.items.length}toArray(){return [...this.items]}clear(){this.items=[]}}
export default Stack;
