(function(root){
  'use strict';
  let ctx,queue=[],busy=false,sound=false;

  async function unlock(){
    try{
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(!AudioContextClass)return false;
      ctx ||= new AudioContextClass();
      if(ctx.state!=='running')await ctx.resume();
      return ctx.state==='running';
    }catch{return false;}
  }

  function play(kind){
    if(!sound||!ctx||ctx.state!=='running')return false;
    try{
      const completion=kind==='complete';
      for(let i=0;i<(completion?5:1);i++){
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        const start=ctx.currentTime+i*.2,duration=completion?.16:.13;
        osc.type=completion?'square':'sawtooth';
        osc.frequency.value=completion?1120:900;
        gain.gain.setValueAtTime(.001,start);
        gain.gain.exponentialRampToValueAtTime(completion?.42:.28,start+.012);
        gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start+duration+.02);
      }
      return true;
    }catch{
      sound=false;
      try{root.ClockAlerts.onAudioFailure?.();}catch{}
      return false;
    }
  }

  function drain(){
    if(busy||document.hidden||!queue.length)return;
    busy=true;
    const item=queue.shift();
    item.visual();
    play(item.kind);
    setTimeout(()=>{busy=false;drain();},item.kind==='complete'?1200:500);
  }

  root.ClockAlerts={
    unlock,
    test(){return play('complete');},
    enqueue(kind,visual){queue.push({kind,visual});drain();},
    setSound(value){sound=Boolean(value);},
    clear(){queue=[];},
    get ready(){return sound&&!!ctx&&ctx.state==='running';}
  };
  document.addEventListener('visibilitychange',drain);
})(globalThis);
