const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
/* El manual se abre desde MENU, tiene las dos versiones y cada captura que usa existe. */
test('user manual is linked, bilingual and has every screenshot',()=>{
  const html=read('manual.html');
  for(const f of ['index.html','ultimate-clock.html'])assert.match(read(f),/href="manual\.html"/);
  assert.match(read('sw.js'),/'\.\/manual\.html'/);
  const article=lang=>html.slice(html.indexOf(`<article lang="${lang}"`),html.indexOf('</article>',html.indexOf(`<article lang="${lang}"`)));
  const images=lang=>[...article(lang).matchAll(/src="(manual\/img\/[^"]+)"/g)].map(m=>m[1]);
  assert.ok(images('es').length>=15);
  assert.equal(images('es').length,images('en').length);
  for(const src of [...images('es'),...images('en')])assert.ok(fs.existsSync(path.join(root,src)),src);
  for(const lang of ['es','en'])for(const m of article(lang).matchAll(/href="#([^"]+)"/g))assert.ok(article(lang).includes(`id="${m[1]}"`),m[1]);
});
