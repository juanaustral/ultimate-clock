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

  /* Referee whistle: two detuned high tones with a fast trill, one blast per count. */
  function whistle(count){
    for(let i=0;i<count;i++){
      const start=ctx.currentTime+i*.42,duration=.3,gain=ctx.createGain(),lfo=ctx.createOscillator(),depth=ctx.createGain();
      lfo.frequency.value=28;depth.gain.value=90;lfo.connect(depth);
      gain.gain.setValueAtTime(.001,start);
      gain.gain.exponentialRampToValueAtTime(.3,start+.02);
      gain.gain.setValueAtTime(.3,start+duration-.05);
      gain.gain.exponentialRampToValueAtTime(.001,start+duration);
      gain.connect(ctx.destination);
      for(const freq of [2650,2720]){const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=freq;depth.connect(osc.frequency);osc.connect(gain);osc.start(start);osc.stop(start+duration+.02);}
      lfo.start(start);lfo.stop(start+duration+.02);
    }
  }

  function play(kind,count=0){
    if(!sound||!ctx||ctx.state!=='running')return false;
    try{
      if(count){whistle(count);return true;}
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
    play(item.kind,item.count);
    setTimeout(()=>{busy=false;drain();},item.count?item.count*420+400:item.kind==='complete'?1200:500);
  }

  root.ClockAlerts={
    unlock,
    test(){return play('complete');},
    enqueue(kind,visual,count=0){queue.push({kind,visual,count});drain();},
    setSound(value){sound=Boolean(value);},
    clear(){queue=[];},
    get ready(){return sound&&!!ctx&&ctx.state==='running';}
  };
  document.addEventListener('visibilitychange',drain);
})(globalThis);
