class Node{constructor(key,value){this.key=key;this.value=value;this.left=null;this.right=null}}
export class BinarySearchTree{constructor(){this.root=null}
 insert(key,value=key){const ins=(n)=>{if(!n)return new Node(key,value);if(key<n.key)n.left=ins(n.left);else if(key>n.key)n.right=ins(n.right);else n.value=value;return n};this.root=ins(this.root);return this}
 search(key){let c=this.root;while(c){if(key===c.key)return c.value; c=key<c.key?c.left:c.right}return undefined}
 min(n=this.root){if(!n)return undefined;while(n.left)n=n.left;return n.value} findMin(){return this.min()} max(n=this.root){if(!n)return undefined;while(n.right)n=n.right;return n.value} findMax(){return this.max()}
 delete(key){const del=(n,k)=>{if(!n)return null;if(k<n.key)n.left=del(n.left,k);else if(k>n.key)n.right=del(n.right,k);else{if(!n.left)return n.right;if(!n.right)return n.left;let m=n.right;while(m.left)m=m.left;n.key=m.key;n.value=m.value;n.right=del(n.right,m.key)}return n};this.root=del(this.root,key);return this}
 inorder(n=this.root,out=[]){if(n){this.inorder(n.left,out);out.push(n.value);this.inorder(n.right,out)}return out}
 preorder(n=this.root,out=[]){if(n){out.push(n.value);this.preorder(n.left,out);this.preorder(n.right,out)}return out}
 postorder(n=this.root,out=[]){if(n){this.postorder(n.left,out);this.postorder(n.right,out);out.push(n.value)}return out}
 toTree(n=this.root){return n?{key:n.key,value:n.value,left:this.toTree(n.left),right:this.toTree(n.right)}:null}}
export default BinarySearchTree;
