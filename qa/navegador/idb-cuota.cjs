// Prueba manual en Chromium: servir el repo (python3 -m http.server 8765) y correr con node. Ajustar la ruta de playwright-core y del ejecutable.
const {chromium}=require('/home/hermes/ultimate-clock/node_modules/playwright-core');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/chromium-browser',args:['--no-sandbox']});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(1200);
  await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('q','QuotaExceededError')};document.querySelector('[data-action="toggle-menu"]')?.click()});await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('[data-action="quick-theme"][data-theme="dark"]')?.click());await p.waitForTimeout(500);
  console.log('cuota llena -> banner:',await p.evaluate(()=>!!document.getElementById('storageWarning')),
    'IDB tema:',await p.evaluate(async()=>(await UCLocal.leerTodo(await UCLocal.abrir())).registros.find(r=>r.id==='ajustes').data.settings.theme));
  await p.evaluate(()=>document.querySelector('[data-action="quick-theme"][data-theme="light"]')?.click());await p.waitForTimeout(500);
  console.log('segundo guardado sigue en IDB:',await p.evaluate(async()=>(await UCLocal.leerTodo(await UCLocal.abrir())).registros.find(r=>r.id==='ajustes').data.settings.theme));
  // ambos fallan: IDB roto
  await p.evaluate(()=>{IDBObjectStore.prototype.put=function(){throw new Error('x')}});
  await p.evaluate(()=>document.querySelector('[data-action="quick-theme"][data-theme="dark"]')?.click());await p.waitForTimeout(800);
  await p.evaluate(()=>document.querySelector('[data-action="quick-theme"][data-theme="light"]')?.click());await p.waitForTimeout(800);
  console.log('ambos fallan -> banner:',await p.evaluate(()=>!!document.getElementById('storageWarning')),errs);
  await b.close();
})();
