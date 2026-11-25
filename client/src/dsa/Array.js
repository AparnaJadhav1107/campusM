export const ArrayUtils={insert:(a,i,v)=>{a.splice(i,0,v);return a},remove:(a,i)=>a.splice(i,1)[0],search:(a,v)=>a.indexOf(v),traverse:a=>[...a],sort:(a,cmp)=>[...a].sort(cmp)};
export default ArrayUtils;
