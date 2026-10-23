const {test}=require('node:test');const assert=require('node:assert/strict');
const X=require('../xlsx.js');const T=require('../tournament.js');const S=require('../tournament-sheet.js');

test('xlsx: lo que se escribe se vuelve a leer igual',async()=>{
  const bytes=X.write([{name:'Hoja [1]',rows:[['a',1,{v:'b & <c>',s:'input'}],[],[null,'ñandú']],validations:[{sqref:'A1',list:['x','y']}],freeze:1}]);
  assert.ok(X.isXlsx(bytes));
  const [s]=await X.read(bytes);
  assert.equal(s.name,'Hoja  1');
  assert.deepEqual(s.rows[0],['a','1','b & <c>']);
  assert.deepEqual(s.rows[2],['','ñandú']);
});
test('xlsx: lee archivos comprimidos con texto compartido (como los de Excel)',async()=>{
  const zlib=require('node:zlib');
  const xml=n=>`<?xml version="1.0"?>${n}`;
  const files=[
    ['xl/workbook.xml',xml('<x:workbook xmlns:x="m" xmlns:r="r"><x:sheets><x:sheet name="Equipo A" sheetId="1" r:id="rId3"/></x:sheets></x:workbook>')],
    ['xl/_rels/workbook.xml.rels',xml('<Relationships><Relationship Id="rId3" Target="/xl/worksheets/s.xml" Type="w"/></Relationships>')],
    ['xl/sharedStrings.xml',xml('<sst><si><t>Equipo</t></si><si><r><t>Los </t></r><r><t>Pumas</t></r></si><si><t>N.º camiseta</t></si><si><t>Jugador</t></si><si><t>Ana</t></si></sst>')],
    ['xl/worksheets/s.xml',xml('<worksheet><sheetData><row r="2"><c r="A2" t="s"><v>0</v></c><c r="C2" t="s"><v>1</v></c></row><row r="4"><c r="A4" t="s"><v>2</v></c><c r="B4" t="s"><v>3</v></c></row><row r="5"><c r="A5"><v>7.0</v></c><c r="B5" t="s"><v>4</v></c></row></sheetData></worksheet>')]
  ];
  // zip con deflate armado a mano
  const parts=[],central=[];let off=0;
  for(const [name,data] of files){const raw=Buffer.from(data),comp=zlib.deflateRawSync(raw),nm=Buffer.from(name),crc=X.crc32(raw);
    const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(8,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(comp.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(nm.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(comp.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(nm.length,28);c.writeUInt32LE(off,42);
    parts.push(h,nm,comp);central.push(c,nm);off+=30+nm.length+comp.length;}
  const cd=Buffer.concat(central),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(files.length,8);e.writeUInt16LE(files.length,10);e.writeUInt32LE(cd.length,12);e.writeUInt32LE(off,16);
  const sheets=await X.read(new Uint8Array(Buffer.concat([...parts,cd,e])));
  const p=S.parse(sheets);
  assert.equal(p.teams.length,1);
  assert.equal(p.teams[0].name,'Los Pumas');
  assert.deepEqual(p.teams[0].players,[{name:'Ana',number:'7'}]);
});
test('plantilla vacía: se lee sin equipos y con el tipo por defecto',async()=>{
  const p=S.parse(await X.read(X.write(S.template())));
  assert.equal(p.teams.length,0);assert.equal(p.type,'rr');assert.equal(p.name,'');
});
test('plantilla completada: torneo, tipo, equipos, colores y jugadores',async()=>{
  const sheets=S.template();
  const tour=sheets[1];tour.rows[2].cells[1].v='Copa Otoño';tour.rows[3].cells[1].v='Eliminación simple';
  const eq=sheets[2];eq.rows[2].cells[1].v='Halcones';eq.rows[3].cells[1].v='Rojo';eq.rows[7]=[{v:'7'},{v:'Ana Pérez'}];eq.rows[8]=[{v:''},{v:'Beto'}];eq.rows[9]=[{v:'12'},{v:''}];
  const eq2=sheets[3];eq2.rows[2].cells[1].v='Zorros';eq2.rows[3].cells[1].v='#0a0';eq2.rows[7]=[{v:'1234'},{v:'Caro'}];
  const p=S.parse(await X.read(X.write(sheets)));
  assert.equal(p.name,'Copa Otoño');assert.equal(p.type,'elim');
  assert.deepEqual(p.teams.map(x=>[x.name,x.color,x.players.length]),[['Halcones','#c62525',2],['Zorros','#00aa00',1]]);
  assert.ok(p.warnings.some(w=>/número sin nombre/.test(w.key)));
  assert.ok(p.warnings.some(w=>/no es un número/.test(w.key)));
});
test('una sola hoja con columnas Equipo · Número · Jugador',()=>{
  const p=S.parse([{name:'Respuestas',rows:[['Equipo','Número','Jugador'],['Pumas','4','Ana'],['Pumas','','Bea'],['Toros','9','Ciro']]}]);
  assert.deepEqual(p.teams.map(x=>[x.name,x.players.length]),[['Pumas',2],['Toros',1]]);
});
test('importar sobre un torneo conserva ids de jugadores y equipos por nombre',()=>{
  const tour=T.makeTournament('Copa');const team=T.makeTeam('Pumas','#1b47e2');team.players=T.parsePlayers('4 Ana\n5 Bea');tour.teams.push(team);
  const ana=team.players[0].id;
  const r=S.applyToTournament(tour,{type:'elim',teams:[{name:'pumas',color:'#c62525',players:[{name:'Ana',number:'10'},{name:'Dani',number:''}]},{name:'Toros',color:null,players:[]}]},[]);
  assert.equal(tour.teams.length,2);assert.equal(team.color,'#c62525');
  assert.equal(team.players.find(p=>p.name==='Ana').id,ana);assert.equal(team.players.find(p=>p.name==='Ana').number,'10');
  assert.ok(!team.players.some(p=>p.name==='Bea'));
  assert.equal(tour.format,'elim');assert.deepEqual([r.added,r.updated],[1,1]);
});
test('plantilla precargada con un torneo existente',async()=>{
  const tour=T.makeTournament('Copa');const team=T.makeTeam('Pumas','#16a34a');team.players=T.parsePlayers('4 Ana');tour.teams.push(team);
  const p=S.parse(await X.read(X.write(S.template({tournament:tour}))));
  assert.equal(p.name,'Copa');assert.deepEqual(p.teams,[{name:'Pumas',color:'#16a34a',players:[{name:'Ana',number:'4'}]}]);
});
test('resultado corregido a mano manda sobre los eventos',()=>{
  const m={teams:[{score:1},{score:0}],events:[{type:'goal',team:0}],scoreOverride:[2,3]};
  assert.deepEqual(T.finalScore(m),[2,3]);
  assert.deepEqual(T.sanitize({name:'X',teams:[],share:{on:true,slug:'Copa Otoño!'},format:'elim'}).share,{on:true,slug:'copa-otono'});
});
