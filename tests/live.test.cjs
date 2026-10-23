const {test}=require('node:test');const assert=require('node:assert/strict');
const L=require('../live-merge.js');
const clone=v=>JSON.parse(JSON.stringify(v));
const timer=(id,extra={})=>({id,elapsed:0,running:false,startedAt:null,completed:false,alerted:[],...extra});
const base=()=>({id:'match-1',status:'active',mode:'tournament',half:1,
  teams:[{name:'A',score:0,goals:[],adjustments:[]},{name:'B',score:0,goals:[],adjustments:[]}],
  clock:{elapsed:0,running:false,startedAt:null},timers:{pull:timer('pull'),call:timer('c0'),call2:timer('c1'),timeout:timer('to')},breakTimer:timer('break'),
  timeoutState:{activeTeam:null,usages:[0,0],mode:''},callTypes:['Falta','Falta'],events:[]});
const goal=(m,team,id,at)=>{m.teams[team].goals.push({id,at,elapsed:10,assist:'',scorer:''});m.teams[team].score++;m.events.push({id:'ev-'+id,type:'goal',team,goal:id,at,elapsed:10});};

test('los goles de los dos dispositivos se juntan, sin duplicar y en cualquier orden',()=>{
  const a=base(),b=clone(a);
  goal(a,0,'g1','2026-10-23T10:00:01Z');goal(b,1,'g2','2026-10-23T10:00:02Z');
  const ab=L.merge(a,b,'A'),ba=L.merge(b,a,'B');
  assert.deepEqual(ab.match.teams.map(t=>t.score),[1,1]);
  assert.deepEqual(ba.match.teams.map(t=>t.score),[1,1]);
  assert.deepEqual(ab.match.events.map(e=>e.id),['ev-g1','ev-g2']);
  assert.deepEqual(ba.match.events.map(e=>e.id),['ev-g1','ev-g2']);
  assert.equal(ab.changed,true);
  /* Volver a juntar lo mismo no cambia nada: no hay rebote entre dispositivos. */
  assert.equal(L.merge(ab.match,b,'A').changed,false);
  assert.equal(L.merge(ab.match,ba.match,'A').changed,false);
});
test('un gol deshecho en un dispositivo no reaparece desde el otro',()=>{
  const a=base();goal(a,0,'g1','2026-10-23T10:00:01Z');const b=clone(a);
  a.teams[0].goals=[];a.teams[0].score=0;a.events=[];L.removeGoal(a,'g1');
  const r=L.merge(b,a,'B');
  assert.equal(r.match.teams[0].score,0);assert.deepEqual(r.match.teams[0].goals,[]);assert.deepEqual(r.match.events,[]);
  const back=L.merge(a,r.match,'A');
  assert.equal(back.match.teams[0].score,0);
});
test('los ajustes manuales también se juntan y restan una sola vez',()=>{
  const a=base();goal(a,0,'g1','2026-10-23T10:00:01Z');goal(a,0,'g3','2026-10-23T10:00:03Z');const b=clone(a);
  a.teams[0].score--;a.teams[0].adjustments.push({at:'2026-10-23T10:01:00Z',delta:-1});
  const r=L.merge(b,a,'B');
  assert.equal(r.match.teams[0].score,1);
  assert.equal(L.merge(r.match,a,'B').match.teams[0].score,1);
});
test('el reloj queda como lo dejó quien lo tocó último, pero no pisa los goles',()=>{
  const a=base();a.clock={elapsed:30,running:true,startedAt:1000};L.stamp(a,1000);
  const b=clone(a);
  /* B pausa más tarde; A anota un gol con el reloj todavía corriendo. */
  b.clock={elapsed:42,running:false,startedAt:null};L.stamp(b,5000);
  goal(a,0,'g1','2026-10-23T10:00:01Z');L.stamp(a,6000);
  assert.equal(a.ctlAt,1000);   // anotar un gol no cuenta como tocar el reloj
  const r=L.merge(a,b,'A');
  assert.equal(r.match.clock.running,false);assert.equal(r.match.clock.elapsed,42);
  assert.equal(r.match.teams[0].score,1);
  /* Al revés: la copia de A, más vieja en el reloj, no lo revierte. */
  const back=L.merge(b,a,'B');
  assert.equal(back.match.clock.running,false);assert.equal(back.match.teams[0].score,1);
});
test('la firma ignora el paso del tiempo y detecta pausar y reanudar',()=>{
  const m=base();m.clock={elapsed:5,running:true,startedAt:1};
  const s1=L.signature(m);m.clock.elapsed=60;m.clock.startedAt=99;
  assert.equal(L.signature(m),s1);
  m.clock={elapsed:60,running:false,startedAt:null};const s2=L.signature(m);assert.notEqual(s2,s1);
  m.clock={elapsed:60,running:true,startedAt:200};assert.notEqual(L.signature(m),s2);
  assert.equal(L.stamp(m,10),true);assert.equal(L.stamp(m,20),false);assert.equal(m.ctlAt,10);
  m.timers.pull.running=true;assert.equal(L.stamp(m,30),true);
});
test('tomar el control: el otro dispositivo deja el partido; el que tomó no',()=>{
  const a=base(),b=clone(a);
  b.control={device:'B',at:5000};
  assert.equal(L.merge(a,b,'A').lostControl,true);
  assert.equal(L.merge(b,a,'B').lostControl,false);
  /* Un control viejo no desplaza a uno más nuevo. */
  a.control={device:'A',at:9000};
  assert.equal(L.merge(a,b,'A').lostControl,false);
  assert.equal(L.merge(b,a,'B').lostControl,true);
});
test('si el otro dispositivo guardó el partido, ese es el oficial',()=>{
  const a=base(),b=clone(a);goal(b,1,'g9','2026-10-23T10:00:09Z');b.status='saved';
  const r=L.merge(a,b,'A');
  assert.equal(r.saved,true);assert.equal(r.match.status,'saved');assert.equal(r.match.teams[1].score,1);
  assert.equal(L.merge(b,a,'B').changed,false);
});
test('partidos distintos no se mezclan',()=>{
  const a=base(),b=base();b.id='match-2';
  assert.equal(L.merge(a,b,'A').changed,false);assert.equal(L.merge(a,b,'A').match,a);
});
test('el mismo gol editado en los dos: queda el último editado',()=>{
  const a=base();goal(a,0,'g1','2026-10-23T10:00:01Z');const b=clone(a);
  Object.assign(a.teams[0].goals[0],{scorer:'Ana',editedAt:100});Object.assign(b.teams[0].goals[0],{scorer:'Beto',editedAt:200});
  assert.equal(L.merge(a,b,'A').match.teams[0].goals[0].scorer,'Beto');
  assert.equal(L.merge(b,a,'B').match.teams[0].goals[0].scorer,'Beto');
  assert.equal(L.merge(a,b,'A').match.events[0].scorer,'Beto');
});
test('el límite de tiempo avisado por los dos se anota una sola vez',()=>{
  const a=base(),b=clone(a);
  a.events.push({type:'limit',timer:'clock',label:'Primer tiempo cumplido',at:'2026-10-23T10:20:00.100Z',elapsed:900});
  b.events.push({type:'limit',timer:'clock',label:'Primer tiempo cumplido',at:'2026-10-23T10:20:00.350Z',elapsed:900});
  assert.equal(L.merge(a,b,'A').match.events.length,1);
});
