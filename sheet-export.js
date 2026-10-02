/* Pure scoresheet exporters (CSV and PDF): no dependencies, shared by the app and Node tests. */
(function (root) {
  'use strict';
  const EVENT_LABELS={goal:'Gol',timeout:'Time-out',call:'Llamado',adjustment:'Ajuste manual −1',pause:'Pausa',resume:'Inicio / reanudación',limit:'Límite superado',start:'Inicio',half:'Mitad',incident:'Incidencia',saved:'Partido finalizado'};
  const TIMER_LABELS={clock:'Reloj de partido',pull:'Pull',call:'Llamado',timeout:'Time-out',break:'Descanso'};

  /* Traducción opcional: tr(textoEnEspañol, variables). Sin tr, todo queda en español. */
  const same=(text,vars)=>String(text??'').replace(/\{(\w+)\}/g,(m,k)=>vars&&k in vars?String(vars[k]):m);
  const fmt=value=>{const total=Math.max(0,Math.ceil(Number(value)||0));return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;};
  const dateLabel=(value,locale='es-AR')=>{try{return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value??'');}};
  const teamName=(match,index)=>index===undefined||index===null?'':(match.teams?.[index]?.name??'');
  /* Per-team call timers are saved as call-0 / call-1. */
  const timerName=(match,id,tr=same)=>{if(!id)return '';const call=/^call-(\d+)$/.exec(id);if(call){const index=Number(call[1]),team=teamName(match,index);return team?tr('Llamado {team}',{team}):tr('Llamado equipo {n}',{n:index+1});}return TIMER_LABELS[id]?tr(TIMER_LABELS[id]):id;};
  const eventName=(type,tr=same)=>EVENT_LABELS[type]?tr(EVENT_LABELS[type]):type;

  /* Same text the saved-sheet modal shows for each event. */
  function describeEvent(match,e,tr=same){
    return [eventName(e.type,tr),teamName(match,e.team),timerName(match,e.timer,tr),e.label&&tr(e.label),e.note,e.scorer&&tr('gol: {name}',{name:e.scorer}),e.assist&&tr('pase: {name}',{name:e.assist}),e.mode&&tr(e.mode)].filter(Boolean).join(' · ');
  }

  /* RFC 4180 cell; cells that a spreadsheet would run as a formula get a leading apostrophe. */
  function csvCell(value){
    let text=String(value??'');
    if(/^[=+\-@\t\r]/.test(text))text="'"+text;
    return /[",\r\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
  }

  function toCSV(match,{t:tr=same}={}){
    const header=['fecha_hora','tiempo_juego','evento','equipo','cronometro','detalle','nota','gol','pase','modo'].map(key=>tr(key));
    const rows=(match.events||[]).map(e=>[e.at||'',fmt(e.elapsed||0),eventName(e.type,tr),teamName(match,e.team),timerName(match,e.timer,tr),e.label?tr(e.label):'',e.note||'',e.scorer||'',e.assist||'',e.mode?tr(e.mode):'']);
    /* BOM so spreadsheet apps read accents as UTF-8. */
    return '﻿'+[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
  }

  /* PDF base fonts use WinAnsiEncoding: Latin-1 plus a few typographic characters. */
  const WIN_ANSI={'€':0x80,'‚':0x82,'„':0x84,'…':0x85,'‘':0x91,'’':0x92,'“':0x93,'”':0x94,'•':0x95,'–':0x96,'—':0x97,'™':0x99,'−':0x2d};
  function pdfText(value){
    let out='';
    for(const char of String(value??'').normalize('NFC')){
      let code=WIN_ANSI[char]??char.codePointAt(0);
      if(code>255||(code<32&&code!==9))code=0x3f;
      const c=String.fromCharCode(code);
      out+=c==='('||c===')'||c==='\\'?'\\'+c:c;
    }
    return out;
  }

  function wrap(text,width){
    const lines=[];
    for(const paragraph of String(text).split('\n')){
      let line='';
      for(const word of paragraph.split(' ')){
        if(line&&(line+' '+word).length>width){lines.push(line);line='';}
        let rest=word;
        while(rest.length>width){if(line){lines.push(line);line='';}lines.push(rest.slice(0,width));rest=rest.slice(width);}
        line=line?line+' '+rest:rest;
      }
      lines.push(line);
    }
    return lines;
  }

  function sheetLines(match,{rulesetLabel,t:tr=same,locale='es-AR'}={}){
    const teams=match.teams||[];
    const lines=[
      {text:`${teamName(match,0)} ${teams[0]?.score??0} — ${teams[1]?.score??0} ${teamName(match,1)}`,size:18,bold:true},
      {text:[match.savedAt&&dateLabel(match.savedAt,locale),rulesetLabel||match.ruleset,match.themeName&&tr(match.themeName)].filter(Boolean).join(' · '),size:10},
      {text:'',size:6},
      {text:tr('Duración: {time}    Time-outs: {timeouts}    Eventos: {events}',{time:fmt(match.clock?.elapsed),timeouts:(match.events||[]).filter(e=>e.type==='timeout').length,events:(match.events||[]).length}),size:11},
      {text:`${tr('Colores:')} ${teams.map(t=>`${t.name} ${t.color}`).join(' · ')}`,size:10},
      {text:'',size:6},
      {text:tr('Eventos'),size:13,bold:true}
    ];
    const events=match.events||[];
    if(!events.length)lines.push({text:tr('Sin eventos'),size:10});
    for(const e of events){
      const [first,...rest]=wrap(describeEvent(match,e,tr),80);
      lines.push({text:`${fmt(e.elapsed||0)}  ${e.at?dateLabel(e.at,locale):''}`,size:8,gray:true,keep:true});
      lines.push({text:first,size:10});
      for(const more of rest)lines.push({text:more,size:10});
    }
    return lines;
  }

  /* Minimal multi-page A4 PDF 1.4 with Helvetica; returns bytes. */
  function toPDF(match,options={}){
    const W=595,H=842,M=50;
    const pages=[[]];let y=H-M;
    const lines=sheetLines(match,options);
    lines.forEach((line,i)=>{
      const lead=Math.round(line.size*1.35);
      const needed=line.keep?lead+Math.round((lines[i+1]?.size||0)*1.35):lead;
      if(y-needed<M){pages.push([]);y=H-M;}
      y-=lead;
      if(line.text)pages.at(-1).push(`BT /${line.bold?'F2':'F1'} ${line.size} Tf ${line.gray?'0.4 g ':'0 g '}${M} ${y} Td (${pdfText(line.text)}) Tj ET`);
    });
    const tr=options.t||same;
    pages.forEach((ops,i)=>ops.push(`BT /F1 8 Tf 0.4 g ${W-M-60} ${M-20} Td (${pdfText(tr('Página {n} de {total}',{n:i+1,total:pages.length}))}) Tj ET`));

    const objects=[];
    const add=body=>{objects.push(body);return objects.length;};
    const catalog=add(''),pagesRef=add('');
    const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const kids=pages.map(ops=>{
      const stream=ops.join('\n');
      const content=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      return add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`);
    });
    objects[catalog-1]=`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;
    objects[pagesRef-1]=`<< /Type /Pages /Kids [${kids.map(k=>`${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
    const info=add(`<< /Title (${pdfText(tr('Planilla {a} vs {b}',{a:teamName(match,0),b:teamName(match,1)}))}) /Producer (Ultimate Clock) >>`);

    /* Every character is one byte (0-255), so string length equals byte offset. */
    let pdf='%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
    const offsets=objects.map((body,i)=>{const at=pdf.length;pdf+=`${i+1} 0 obj\n${body}\nendobj\n`;return at;});
    const xref=pdf.length;
    pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('');
    pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes=new Uint8Array(pdf.length);
    for(let i=0;i<pdf.length;i++)bytes[i]=pdf.charCodeAt(i);
    return bytes;
  }

  /* WhatsApp message: *bold*, _italic_ and emojis; one line per key moment with the running score. */
  /* One emoji per call category and incident type, keyed by the saved Spanish label. */
  const CATEGORY_EMOJI={'Falta':'🤼','Violación':'⛔','Pick':'🚧','Travel':'👣','Stall':'⏳','Gol discutido':'❓','Lesión':'🩹','Tiempo de Espíritu':'🤝','TFR':'🧘','PMF':'🟨','Otra':'📝'};
  const waSafe=value=>String(value??'').replace(/[*_~`]/g,'').replace(/\s+/g,' ').trim();
  function toWhatsApp(match,{rulesetLabel,t:tr=same,locale='es-AR',url='iona.ar/ultimateclock'}={}){
    const teams=match.teams||[],events=match.events||[];
    const name=index=>waSafe(teamName(match,index))||tr('Equipo {n}',{n:index+1});
    const [a,b]=[teams[0]?.score??0,teams[1]?.score??0];
    const count=(type,index)=>events.filter(e=>e.type===type&&e.team===index).length;
    const lines=[`🥏 *ULTIMATE CLOCK* · ${tr('Planilla')}`,'',`*${name(0)} ${a} — ${b} ${name(1)}*`];
    lines.push(a===b?`🤝 ${tr('Empate')}`:`🏆 ${tr('Ganó {team}',{team:`*${name(a>b?0:1)}*`})}`);
    const when=[match.savedAt&&dateLabel(match.savedAt,locale),rulesetLabel||match.ruleset].filter(Boolean).join(' · ');
    if(when)lines.push(`📅 ${when}`);
    lines.push(`⏱️ ${tr('Duración')}: *${fmt(match.clock?.elapsed)}*`,'',`📊 *${tr('Resumen')}*`);
    for(const [emoji,label,type] of [['🥏','Goles','goal'],['⏸️','Time-outs','timeout'],['📣','Llamados','call']])
      lines.push(`${emoji} ${tr(label)}: ${name(0)} ${count(type,0)} · ${name(1)} ${count(type,1)}`);
    const score=[0,0],moments=[];
    for(const e of events){
      const time=fmt(e.elapsed||0),team=e.team===0||e.team===1?name(e.team):'';
      if(e.type==='goal'&&team){
        score[e.team]+=1;
        const who=[e.scorer&&waSafe(e.scorer),e.assist&&tr('pase de {name}',{name:waSafe(e.assist)})].filter(Boolean).join(' · ');
        moments.push(`${time} 🥏 *${tr('Gol de {team}',{team})}* (${score[0]}–${score[1]})${who?`\n        _${who}_`:''}`);
      }
      else if(e.type==='adjustment'&&team){score[e.team]=Math.max(0,score[e.team]-1);moments.push(`${time} ➖ ${tr('Punto descontado a {team}',{team})} (${score[0]}–${score[1]})`);}
      else if(e.type==='timeout'&&team)moments.push(`${time} ⏸️ ${tr('Time-out de {team}',{team})}`);
      else if(e.type==='call'&&team)moments.push(`${time} 📣 ${tr('Llamado de {team}',{team})}${e.label?` · ${CATEGORY_EMOJI[e.label]||'🏷️'} _${waSafe(tr(e.label))}_`:''}`);
      else if(e.type==='half')moments.push(String(e.label||'').startsWith('Inicio de segunda')?`${time} ▶️ *${tr('Segundo tiempo')}*`:`${time} 🌗 *${tr('Medio tiempo')}*`);
      else if(e.type==='incident')moments.push(`${time} ${CATEGORY_EMOJI[e.label]||'⚠️'} ${waSafe(tr(e.label||'Incidencia'))}${e.note?` · _${waSafe(e.note)}_`:''}`);
      else if(e.type==='saved')moments.push(`${time} 🏁 *${tr('Final')}*`);
    }
    lines.push('',`🎬 *${tr('Momentos')}*`,...(moments.length?moments:[`_${tr('Sin eventos')}_`]),'',`_${tr('Hecho con Ultimate Clock')} · ${url}_`);
    return lines.join('\n');
  }

  const api={EVENT_LABELS,TIMER_LABELS,CATEGORY_EMOJI,describeEvent,toCSV,toPDF,toWhatsApp,csvCell,pdfText};
  if(typeof module!=='undefined')module.exports=api;else root.SheetExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
