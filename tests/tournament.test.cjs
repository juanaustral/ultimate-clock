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
  /* en modo torneo el cuadro de gol no deja escribir: «Otro» y el texto libre solo existen con allowOther (modo partido) */
  assert(js.includes("personPicker(key,label,roster,goal,key==='assist',!tournament)"));
  assert(js.includes("${allowOther?`<option value=\"__other\""));
  assert(js.includes("!tournament&&pick==='__other'"));
});
test('roster text round trips and keeps ids of unchanged players',()=>{
  const a=T.parsePlayers('7 Ana\nBeto');assert.equal(T.rosterToText(a),'7 Ana\nBeto');
  const b=T.rosterFromText('7 Ana\nBeto\n9 Cris',a);assert.equal(b[0].id,a[0].id);assert.equal(b[1].id,a[1].id);assert.equal(b.length,3);
  assert.deepEqual(T.rosterFromText('',a),[]);assert.equal(T.rosterFromText(Array.from({length:80},(_,i)=>'P'+i).join('\n')).length,T.LIMITS.players);
});
test('menu has the mode entry and exit buttons and new matches never prefill the previous teams',()=>{
  const fs=require('fs'),r=f=>fs.readFileSync(__dirname+'/../'+f,'utf8'),js=r('ultimate-clock.js');
  for(const f of ['index.html','ultimate-clock.html'])assert.ok(r(f).includes('id="menuExitTournament"')&&r(f).includes('data-action="exit-tournament"'));
  const fresh=js.slice(js.indexOf('function freshMatch'),js.indexOf('function startNextMatch'));
  assert.ok(fresh.includes('makeMatch(')&&!fresh.includes('.teams'));
  assert.ok(js.includes("action==='new-match'")&&js.includes('startNextMatch()'));
});
test('standings: 3 points a win, 1 a draw, ordered by points, goal difference and goals; only tournament-vs-tournament matches count',()=>{
  const tour=T.makeTournament('L'),[a,b,c]=['A','B','C'].map(n=>T.makeTeam(n,'#111'));tour.teams.push(a,b,c);
  const m=(x,sx,y,sy,at)=>({id:at,status:'saved',savedAt:at,teams:[{tid:x?.id||'',score:sx},{tid:y?.id||'',score:sy}],events:[]});
  const list=[m(a,3,b,1,'2026-10-01'),m(b,2,c,2,'2026-10-02'),m(a,0,c,1,'2026-10-03'),m(a,9,null,0,'2026-10-04'),{...m(b,5,c,0,'2026-10-05'),status:'active'}];
  const rows=T.standings(tour,list);
  assert.deepEqual(rows.map(r=>[r.team.name,r.played,r.won,r.drawn,r.lost,r.gf,r.ga,r.points]),[['C',2,1,1,0,3,2,4],['A',2,1,0,1,3,2,3],['B',2,0,1,1,3,5,1]]);
  assert.deepEqual(T.results(tour,list).map(x=>x.id),['2026-10-03','2026-10-02','2026-10-01']);
});
test('tournament time profile: official ids stay, own profiles carry a copy, broken ones fall back to WFDF',()=>{
  assert.deepEqual(T.makeTournament('x').timing,{id:'wfdf',name:'',config:null});
  assert.deepEqual(T.sanitizeTiming({id:'usau',name:'zz',config:{a:1}}),{id:'usau',name:'',config:null});
  const own=T.sanitizeTiming({id:'profile-1',name:'Local',config:{gameCap:3600}});assert.equal(own.id,'profile-1');assert.equal(own.config.gameCap,3600);
  assert.equal(T.sanitizeTiming({id:'profile-2'}).id,'wfdf');assert.equal(T.sanitizeTiming(null).id,'wfdf');assert.equal(T.sanitizeTiming({id:'x'.repeat(200),config:{a:1}}).id,'wfdf');
  const tour=T.makeTournament('Liga');tour.timing=T.sanitizeTiming({id:'profile-9',name:'Mío',config:{gameCap:1}});
  assert.equal(T.parseFile(JSON.stringify(T.exportPayload(tour,[]))).tournament.timing.id,'profile-9');
  assert.equal(T.sanitize({name:'Vieja',teams:[]}).timing.id,'wfdf');
});
