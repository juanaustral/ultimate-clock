const {test}=require('node:test');const assert=require('node:assert/strict');const T=require('../tournament.js');
const sample=()=>{const tour=T.makeTournament('Copa Otoño'),a=T.makeTeam('Ñandúes','#1b47e2'),b=T.makeTeam('Pumas','#f59e0b');a.players.push(...T.parsePlayers('7 Ana\nBeto'));b.players.push(...T.parsePlayers('Cris 9'));tour.teams.push(a,b);return tour;};
const goal=(team,scorer,assist)=>({type:'goal',team,scorerId:scorer?.id||'',assistId:assist?.id||''});
test('name is required for tournaments, teams and players; the number is optional',()=>{
  assert.equal(T.makeTournament('  '),null);assert.equal(T.makeTeam('',''),null);assert.equal(T.makePlayer('  ','7'),null);
  assert.equal(T.makePlayer('Ana','').number,'');assert.equal(T.makePlayer('Ana','abc').number,'');assert.equal(T.makePlayer('Ana','#07').number,'7');assert.equal(T.makePlayer('Ana','1234').number,'');
});
test('pasted lists accept number first, number last, bullets and names alone',()=>{
  const list=T.parsePlayers('7 Ana\n#10 - Beto\nCris 9\nDani, 12\n- Eli\n\n  \nFran Gómez 3;Gus');
  assert.deepEqual(list.map(p=>[p.number,p.name]),[['7','Ana'],['10','Beto'],['9','Cris'],['12','Dani'],['','Eli'],['3','Fran Gómez'],['','Gus']]);
  assert.equal(new Set(list.map(p=>p.id)).size,list.length);
});
test('players sort by number with unnumbered ones last, and labels show the number',()=>{
  const sorted=T.sortPlayers(T.parsePlayers('Zoe\n10 Beto\n2 Ana'));assert.deepEqual(sorted.map(p=>T.playerLabel(p)),['#2 Ana','#10 Beto','Zoe']);
});
test('sanitize drops invalid entries, fixes colors and repeated ids',()=>{
  const dirty={name:' Liga ',teams:[{id:'t1',name:'A',color:'rojo',players:[{id:'p1',name:'Ana',number:'x'},{id:'p1',name:'Beto',number:'5'},{name:''}]},{name:''},{id:'t1',name:'B',players:'no'}]};
  const clean=T.sanitize(dirty);assert.equal(clean.name,'Liga');assert.equal(clean.teams.length,2);assert.equal(clean.teams[0].color,'#1b47e2');
  assert.equal(clean.teams[0].players.length,2);assert.equal(new Set([...clean.teams.map(x=>x.id),...clean.teams[0].players.map(p=>p.id)]).size,4);
  assert.equal(T.sanitize(null),null);assert.equal(T.sanitize({name:'',teams:[]}),null);assert.equal(T.sanitize({name:'x'}),null);
});
test('stats count goals and assists by player id from saved tournament matches only',()=>{
  const tour=sample(),[a,b]=tour.teams,[ana,beto]=a.players,[cris]=b.players;
  const m=(status,events)=>({id:'m'+Math.random(),status,teams:[{tid:a.id},{tid:b.id}],events});
  const matches=[m('saved',[goal(0,ana,beto),goal(0,ana),goal(1,cris,null),{type:'goal',team:1,scorer:'Otro',scorerId:''}]),m('active',[goal(0,beto)]),{id:'x',status:'saved',teams:[{tid:'zzz'},{tid:''}],events:[goal(0,ana)]}];
  const rows=T.stats(tour,matches);assert.deepEqual(rows.map(r=>[r.player.name,r.goals,r.assists]),[['Ana',2,0],['Beto',0,1],['Cris',1,0]].sort((x,y)=>(y[1]+y[2])-(x[1]+x[2])||y[1]-x[1]));
  assert.equal(T.tournamentMatches(tour,matches).length,1);
});
test('export file round trips and rejects foreign or broken files',()=>{
  const tour=sample(),saved={id:'m1',status:'saved',teams:[{tid:tour.teams[0].id},{tid:''}],clock:{elapsed:5},events:[]};
  const payload=T.exportPayload(tour,[saved,{id:'m2',status:'saved',teams:[{tid:''},{tid:''}],clock:{},events:[]}]);
  assert.equal(payload.matches.length,1);const back=T.parseFile(JSON.stringify(payload));
  assert.equal(back.tournament.name,'Copa Otoño');assert.equal(back.tournament.teams[0].players.length,2);assert.equal(back.matches[0].id,'m1');
  assert.equal(T.parseFile('no es json'),null);assert.equal(T.parseFile(JSON.stringify({format:'otra',version:1})),null);assert.equal(T.parseFile(JSON.stringify({...payload,version:2})),null);
  assert.equal(T.parseFile(JSON.stringify({...payload,tournament:{name:'',teams:[]}})),null);
});
test('players CSV lists everyone, with stats, quoted and neutralized',()=>{
  const tour=sample();tour.teams[0].players[0].name='=HYPERLINK("x")';
  const csv=T.statsCSV(tour,[],{});assert.ok(csv.startsWith('﻿'));const lines=csv.slice(1).trim().split('\r\n');
  assert.equal(lines.length,4);assert.equal(lines[0],'equipo,numero,jugador,goles,pases');assert.ok(lines[1].includes('"\'=HYPERLINK(""x"")"'));
});
test('app wires the tournament module: script tag, cache entry, publish list and no key reuse',()=>{
  const fs=require('fs'),r=f=>fs.readFileSync(__dirname+'/../'+f,'utf8');
  for(const f of ['index.html','ultimate-clock.html'])assert.ok(r(f).includes('<script src="tournament.js" defer></script>')&&r(f).includes('data-action="tournament"'));
  assert.ok(r('sw.js').includes("'./tournament.js'"));assert.ok(r('scripts/publicar-vps.sh').includes('tournament.js'));
});
test('start screen offers match and tournament modes and the header shows the current one',()=>{
  const fs=require('fs'),r=f=>fs.readFileSync(__dirname+'/../'+f,'utf8'),js=r('ultimate-clock.js');
  for(const f of ['index.html','ultimate-clock.html'])assert.ok(r(f).includes('id="modeBadge"'));
  assert.ok(js.includes('data-mode="match"')&&js.includes('data-mode="tournament"'));
  assert.ok(js.includes("openWelcome('mode')"));
  /* en modo torneo el cuadro de gol no ofrece campos de texto: la rama de lista no incluye <input> */
  const picker=js.slice(js.indexOf('function personPicker'),js.indexOf('function readPerson'));
  assert.ok(!picker.includes('<input')&&!picker.includes('__other'));
});
