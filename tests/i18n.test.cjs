const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const I=require('../i18n.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
/* Cada t('...') literal de la app y cada data-i18n del HTML tiene su versión en inglés. */
test('every literal translation key has an English entry',()=>{
  const js=read('ultimate-clock.js')+read('sheet-export.js');
  const keys=new Set();
  for(const m of js.matchAll(/\b(?:t|tr)\((['"])((?:(?!\1)[^\\\n]|\\.)+)\1/g))keys.add(m[2].replace(/\\'/g,"'"));
  for(const m of js.matchAll(/\bt\(\s*[^'"()]*\?\s*'([^']+)'\s*:\s*(?:[^'()]*\?\s*'([^']+)'\s*:\s*)?'([^']+)'\s*\)/g))[m[1],m[2],m[3]].filter(Boolean).forEach(k=>keys.add(k));
  for(const f of ['index.html','ultimate-clock.html'])for(const m of read(f).matchAll(/data-i18n(?:-label)?="([^"]+)"/g))keys.add(m[1]);
  const missing=[...keys].filter(k=>!(k in I.EN));
  assert.deepEqual(missing,[]);
  assert.ok(keys.size>80);
});
test('tutorial steps, call categories and guidance are translated',()=>{
  const js=read('ultimate-clock.js');
  const block=name=>{const start=js.indexOf(`const ${name}`),end=start+js.slice(start).search(/[\]}];\n/);return js.slice(start,end);};
  const strings=[...block('TUTORIAL_STEPS').matchAll(/(?:title|text):'([^']+)'/g),...block('CALL_CATEGORIES').matchAll(/'([^']+)'/g),...block('CALL_GUIDANCE').matchAll(/:'([^']+)'/g)].map(m=>m[1]);
  assert.ok(strings.length>20);
  assert.deepEqual(strings.filter(k=>!(k in I.EN)),[]);
});
test('t fills variables and falls back to Spanish',()=>{
  assert.equal(I.t('en','Gol de {team}.',{team:'Ñandúes'}),'Goal for Ñandúes.');
  assert.equal(I.t('es','Gol de {team}.',{team:'Ñandúes'}),'Gol de Ñandúes.');
  assert.equal(I.t('en','Texto sin traducir'),'Texto sin traducir');
});
