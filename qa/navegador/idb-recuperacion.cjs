// Prueba manual en Chromium: servir el repo (python3 -m http.server 8765) y correr con node. Ajustar la ruta de playwright-core y del ejecutable.
const {chromium}=require('/home/hermes/ultimate-clock/node_modules/playwright-core');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/chromium-browser',args:['--no-sandbox']});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(1200);
  await p.evaluate(()=>{document.querySelector('[data-action="menu"]')?.click()});await p.waitForTimeout(300);
  console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-action]')].map(e=>e.dataset.action+(e.dataset.theme?':'+e.dataset.theme:'')).join(',')));
  await p.evaluate(()=>document.querySelector('[data-action="quick-theme"][data-theme="dark"]')?.click());await p.waitForTimeout(500);
  const th=()=>p.evaluate(async()=>{const db=await UCLocal.abrir();const t=await UCLocal.leerTodo(db);return [document.documentElement.dataset.theme, t.registros.find(r=>r.id==='ajustes').data.settings.theme, JSON.parse(localStorage.getItem('ultimate-clock-v2')||'null')?.settings.theme]});
  console.log('tras click [dom,idb,ls]',await th());
  await p.evaluate(()=>localStorage.removeItem('ultimate-clock-v2'));await p.reload();await p.waitForTimeout(1200);
  console.log('tras borrar LS y recargar',await th(),errs);
  await b.close();
})();
