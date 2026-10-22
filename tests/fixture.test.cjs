const {test}=require('node:test');const assert=require('node:assert/strict');
const F=require('../fixture.js');const T=require('../tournament.js');
const teams=n=>Array.from({length:n},(_,i)=>({id:'T'+(i+1),name:'Equipo '+(i+1),color:'#1b47e2',players:[]}));
const torneo=n=>({id:'x',name:'Copa',teams:teams(n),fixture:null,scoring:T.sanitizeScoring(null)});
const juego=(fixtureId,tid0,s0,tid1,s1,extra={})=>({id:'g'+Math.random(),status:'saved',fixtureId,savedAt:'2026-10-22',teams:[{tid:tid0,score:s0},{tid:tid1,score:s1}],events:[],...extra});

test('todos contra todos: cada par juega una vez y nadie juega dos veces por ronda',()=>{
  for(const n of [2,3,4,5,6,7,8]){
    const r=F.roundRobinRounds(teams(n).map(t=>t.id));
    const pares=new Set();
    for(const ronda of r){const vistos=new Set();for(const [a,b] of ronda.pairs){assert.ok(!vistos.has(a)&&!vistos.has(b));vistos.add(a);vistos.add(b);pares.add([a,b].sort().join('|'));}}
    assert.equal(pares.size,n*(n-1)/2,`n=${n}`);
  }
});
test('con equipos impares hay un libre por ronda',()=>{
  const r=F.roundRobinRounds(['a','b','c','d','e']);
  assert.equal(r.length,5);assert.ok(r.every(x=>x.bye.length===1&&x.pairs.length===2));
});
test('siembra: 1 contra el último y 1 y 2 solo se cruzan en la final',()=>{
  assert.deepEqual(F.seedOrder(8),[1,8,4,5,2,7,3,6]);
  const m=F.generateElimination(['a','b','c','d','e']);
  assert.equal(m.filter(x=>x.round===1).length,4);
  const r1=m.filter(x=>x.round===1);
  assert.deepEqual([r1[0].home,r1[0].away],['a',null]); // 5 equipos: el 1 pasa libre
});
test('eliminación: el ganador avanza al cruce siguiente',()=>{
  const t=torneo(4);const r=F.regenerate(t,'elim',[]);t.fixture=r.fixture;
  const sf1=t.fixture.matches.find(m=>m.id==='e-1-0');
  const jugados=[juego('e-1-0',sf1.home,3,sf1.away,5)];
  const v=F.view(t.fixture,jugados);
  assert.equal(v.find(m=>m.id==='e-1-0').winner,sf1.away);
  assert.equal(v.find(m=>m.id==='e-2-0').home,sf1.away);
  assert.equal(v.find(m=>m.id==='e-2-0').away,null);
});
test('regenerar no toca cruces terminados ni en juego, y agrega los de un equipo nuevo',()=>{
  const t=torneo(4);t.fixture=F.regenerate(t,'rr',[]).fixture;
  assert.equal(t.fixture.matches.length,6);
  const primero=t.fixture.matches[0],segundo=t.fixture.matches[1];
  const jugados=[juego(primero.id,primero.home,2,primero.away,1)];
  t.teams.push({id:'T5',name:'Equipo 5',color:'#1b47e2',players:[]});
  const r=F.regenerate(t,'rr',jugados,segundo.id);
  assert.ok(r.ok);
  assert.equal(r.fixture.matches.length,10);
  assert.ok(r.fixture.matches.find(m=>m.id===primero.id));
  assert.deepEqual(r.fixture.matches.find(m=>m.id===segundo.id),segundo);
  const antes=t.fixture.matches.filter(m=>m.id!==primero.id&&m.id!==segundo.id).length;
  assert.equal(r.fixture.matches.filter(m=>!m.from).length,10);void antes;
});
test('cambiar el orden de los equipos no reasigna un cruce ya jugado',()=>{
  const t=torneo(4);t.fixture=F.regenerate(t,'rr',[]).fixture;
  const m0=t.fixture.matches[0];const jugados=[juego(m0.id,m0.home,1,m0.away,0)];
  F.moveTeam(t,'T1',1);F.moveTeam(t,'T4',-1);
  const r=F.regenerate(t,'rr',jugados);
  assert.deepEqual(r.fixture.matches.find(m=>m.id===m0.id),m0);
  assert.equal(r.fixture.matches.length,6);
});
test('eliminación empezada no se regenera',()=>{
  const t=torneo(4);t.fixture=F.regenerate(t,'elim',[]).fixture;
  const m=t.fixture.matches[0];
  assert.equal(F.regenerate(t,'elim',[juego(m.id,m.home,1,m.away,0)]).reason,'started');
});
test('un equipo con partidos terminados no se puede dar de baja; uno sin partidos sí',()=>{
  const t=torneo(3);t.fixture=F.regenerate(t,'rr',[]).fixture;
  const m=t.fixture.matches[0];const jugados=[juego(m.id,m.home,1,m.away,0)];
  assert.equal(F.removeTeam(t,m.home,jugados),false);
  const libre=['T1','T2','T3'].find(x=>x!==m.home&&x!==m.away);
  assert.equal(F.removeTeam(t,libre,jugados),true);
  assert.ok(t.fixture.matches.every(x=>x.home!==libre&&x.away!==libre));
});
test('marcador desde eventos: goles menos correcciones',()=>{
  const g=(team)=>({type:'goal',team}),a=(team)=>({type:'adjustment',team});
  assert.deepEqual(T.finalScore({teams:[{score:9},{score:9}],events:[g(0),g(0),g(1),a(0)]}),[1,1]);
  assert.deepEqual(T.finalScore({teams:[{score:4},{score:2}],events:[]}),[4,2]);
});
test('posiciones: puntos y orden de desempate configurables por torneo',()=>{
  const t=torneo(4);
  // T1, T2 y T4 terminan con 3 puntos. T1 tiene la mejor diferencia pero perdió con T2.
  const partidos=[juego(null,'T1',9,'T3',0),juego(null,'T2',1,'T1',0),juego(null,'T4',5,'T2',0)];
  t.scoring={win:3,draw:1,loss:0,tiebreaks:['diff','gf','h2h']};
  assert.equal(T.standings(t,partidos)[0].team.id,'T1');
  t.scoring={win:3,draw:1,loss:0,tiebreaks:['h2h','diff','gf']};
  const orden=T.standings(t,partidos).map(r=>r.team.id);
  assert.ok(orden.indexOf('T1')>orden.indexOf('T2'));
  t.scoring={win:2,draw:1,loss:0,tiebreaks:['diff','gf','h2h']};
  assert.deepEqual(T.standings(t,partidos).map(r=>r.points).sort(),[0,2,2,2]);
});
test('el torneo conserva puntos y cruces al sanear',()=>{
  const t=torneo(3);t.scoring={win:2,draw:1,loss:0,tiebreaks:['gf','diff','h2h']};t.fixture=F.regenerate(t,'rr',[]).fixture;
  const s=T.sanitize(JSON.parse(JSON.stringify(t)));
  assert.deepEqual(s.scoring,t.scoring);assert.equal(s.fixture.matches.length,3);
  assert.deepEqual(T.sanitize({name:'Viejo',teams:[]}).scoring,{win:3,draw:1,loss:0,tiebreaks:['diff','gf','h2h']});
});

test('historial del equipo: partidos, goles y goleadores',()=>{
  const t=torneo(2);t.teams[0].players=[{id:'p1',name:'Ana',number:'7'}];
  const g=(team,scorerId)=>({type:'goal',team,scorerId});
  const partidos=[juego(null,'T1',0,'T2',0,{savedAt:'2026-10-20',events:[g(0,'p1'),g(0,'p1'),g(1,'')]}),juego(null,'T2',3,'T1',1,{savedAt:'2026-10-21'})];
  const h=T.teamHistory(t,partidos,'T1');
  assert.equal(h.played,2);assert.equal(h.won,1);assert.equal(h.lost,1);assert.equal(h.gf,3);assert.equal(h.ga,4);
  assert.deepEqual(h.games.map(x=>x.result),['G','P']);
  assert.equal(h.players[0].goals,2);
  assert.equal(T.teamHistory(t,partidos,'nadie'),null);
});
test('no se cambia el tipo de fixture si ya hay cruces jugados',()=>{
  const t=torneo(4);t.fixture=F.regenerate(t,'rr',[]).fixture;
  const m=t.fixture.matches[0];
  assert.equal(F.regenerate(t,'elim',[juego(m.id,m.home,1,m.away,0)]).reason,'started');
});
