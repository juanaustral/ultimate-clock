/* Pure clock engine: the same functions run in the app and in Node tests. */
(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const defaults = {
    wfdf: { label:'WFDF 2025–2028', gameCap:6000, halfCap:3300, halftime:420, timeoutDuration:75, timeoutLimit:75, timeoutsPerTeam:2, pull:{line:45,ready:60,release:75}, call:{captain:15,contested:45,restart:60}, ratio:15, repull:30, interruption:'continue' },
    usau: { label:'USA Ultimate 2026–2027', gameCap:5400, halfCap:3000, halftime:420, timeoutDuration:70, timeoutLimit:70, timeoutsPerTeam:2, pull:{line:50,ready:60,release:80}, call:{captain:15,contested:30,restart:45}, ratio:25, repull:30, interruption:'continue' }
  };
  defaults.custom = {...copy(defaults.wfdf), label:'Personalizado'};
  function configuration(settings) {
    const base = copy(defaults[settings.baseRuleset || settings.ruleset] || defaults.wfdf);
    const over = settings.overrides || {};
    return {...base,...over,pull:{...base.pull,...over.pull},call:{...base.call,...over.call}};
  }
  function validate(c) {
    const numbers = [c.gameCap,c.halfCap,c.halftime,c.timeoutDuration,c.timeoutLimit,c.timeoutsPerTeam,c.ratio,c.repull,...Object.values(c.pull),...Object.values(c.call)];
    if(numbers.some(n=>!Number.isInteger(n)||n<1||n>86400)) return 'Ingresá números enteros entre 1 y 86400.';
    if(c.timeoutsPerTeam>20) return 'Se permiten hasta 20 time-outs por equipo.';
    if(c.halfCap>=c.gameCap) return 'El half-time cap debe ser menor que el time cap.';
    return '';
  }
  function elapsed(item, now=Date.now()) {return item.elapsed + (item.running && item.startedAt!==null ? Math.max(0,now-item.startedAt)/1000:0);}
  function advance(item, now=Date.now()) {
    if(!item.running) return [];
    item.elapsed = elapsed(item,now); item.startedAt=now;
    const due = item.thresholds.filter(t=>item.elapsed>=t.at && !item.alerted.includes(t.at));
    due.forEach(t=>item.alerted.push(t.at));
    if(item.duration && item.elapsed>=item.duration) {item.elapsed=item.duration;item.running=false;item.startedAt=null;item.completed=true;}
    return due;
  }
  function toggle(item, now=Date.now()) {
    if(item.running){advance(item,now);item.running=false;item.startedAt=null;}
    else {if(item.completed){item.elapsed=0;item.completed=false;item.alerted=[];}item.running=true;item.startedAt=now;}
  }
  function luminance(hex) {
    const clean=String(hex).replace('#',''),full=clean.length===3?clean.replace(/./g,c=>c+c):clean;
    const channels=full.match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
    return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  }
  function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function ink(bg){return contrast(bg,'#ffffff')>=contrast(bg,'#000000')?'#ffffff':'#000000';}
  const api={defaults,configuration,validate,elapsed,advance,toggle,contrast,ink,copy};
  if(typeof module!=='undefined')module.exports=api;else root.ClockEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
