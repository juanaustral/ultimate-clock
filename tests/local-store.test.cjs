const {test}=require('node:test');const assert=require('node:assert/strict');const L=require('../local-store.js');
const match=(id,g)=>({id,teams:[{name:'A'},{name:'B'}],events:g});
const estado=()=>({version:2,settings:{theme:'light'},customThemes:[],customRulesets:[],pendingAlerts:[],timerProfiles:[],
  tournament:{id:'t1',name:'Copa',teams:[]},otherTournaments:[{id:'t2',name:'Liga',teams:[]}],
  activeMatch:match('act',[]),savedMatches:[match('m2',[1]),match('m1',[])]});

test('entidades y reconstruir son inversas, con el orden conservado',()=>{
  const s=estado();const regs=Object.values(L.entidades(s));
  assert.deepEqual(L.reconstruir(regs),s);
});
test('sin cambios no hay diferencias; un gol cambia solo su registro',()=>{
  const s=estado();const a=L.diferencias({},L.entidades(s));
  assert.equal(a.cambios.length,6);
  assert.equal(L.diferencias(a.siguiente,L.entidades(s)).cambios.length,0);
  s.savedMatches[0].events.push(2);
  const b=L.diferencias(a.siguiente,L.entidades(s));
  assert.deepEqual(b.cambios.map(c=>c.tabla+':'+c.id),['partidos:m2']);
});
test('borrar un partido genera una baja',()=>{
  const s=estado();const a=L.diferencias({},L.entidades(s));
  s.savedMatches.pop();
  const b=L.diferencias(a.siguiente,L.entidades(s));
  assert.deepEqual(b.cambios,[{tabla:'partidos',id:'m1',op:'delete'}]);
});
test('reconstruir devuelve null si faltan los registros esenciales',()=>{
  assert.equal(L.reconstruir([]),null);
});
