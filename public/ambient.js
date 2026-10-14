/* Just 24 Things by J&J — live orbit wallpaper v1.
 * Visual only, one lightweight canvas, never captures clicks/keyboard.
 * ~24 desktop / ~11 mobile particles, capped 30fps, pauses in hidden tabs.
 * No gameplay, scroll or application state is modified. */
(()=>{
 'use strict';
 if(!document.body||!('requestAnimationFrame' in window))return;
 const canvas=document.createElement('canvas');
 canvas.id='jj-ambient-orbits';
 canvas.setAttribute('aria-hidden','true');
 canvas.setAttribute('role','presentation');
 document.body.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx){canvas.remove();return;}
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let w=0,h=0,dpr=1,particles=[],raf=0,lastDraw=-Infinity,disabled=!!reduced?.matches;
 let resizePending=false,lastAccentTime=-Infinity,accent='base';
 const TAU=Math.PI*2;
 // No flickering positions on rerender; seeded deterministic distribution.
 function rand(i,seed){
   const x=Math.sin((i+1)*78.233+seed*193.1)*43758.5453;
   return x-Math.floor(x);
 }
 function reset(){
   w=Math.max(1,window.innerWidth);
   h=Math.max(1,window.innerHeight);
   dpr=Math.min(1.5,Math.max(1,window.devicePixelRatio||1));
   canvas.width=Math.round(w*dpr);
   canvas.height=Math.round(h*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);
   const mobile=w<720;
   const slowDevice=(navigator.hardwareConcurrency||4)<=2||navigator.connection?.saveData;
   const count=disabled?Math.min(7,mobile?8:12):(mobile?11:(slowDevice?16:24));
   const radius=Math.min(w*.47,h*.60);
   particles=Array.from({length:count},(_,i)=>({
     angle:TAU*rand(i,1),
     radius:(.17+.83*rand(i,2))*radius,
     tilt:.51+.29*rand(i,3),
     speed:(.000012+.000021*rand(i,4))*(i%2?-1:1),
     size:.8+1.25*rand(i,5),
     alpha:.22+.43*rand(i,6),
     alt:i%4===0,
     wobble:TAU*rand(i,7)
   }));
 }
 function getAccent(now){
   if(now-lastAccentTime<650)return accent;
   lastAccentTime=now;
   const target=document.elementFromPoint(w*.52,h*.51);
   const apps=target?.closest?.('.home-japps,.japps-neon');
   const arcade=target?.closest?.('.home-retro-arcade,.jj-retro-arcade');
   accent=arcade?'arcade':apps?'apps':'base';
   return accent;
 }
 function paint(now){
   raf=0;
   if(document.hidden)return;
   // Limit animation to 30fps even on 120/144 Hz displays.
   if(!disabled&&now-lastDraw<33){raf=requestAnimationFrame(paint);return;}
   lastDraw=now;
   ctx.clearRect(0,0,w,h);
   const mode=getAccent(now);
   const dark=mode!=='base'||document.documentElement.dataset.theme==='dark';
   const a=mode==='arcade'?'100,237,246':mode==='apps'?'72,211,248':dark?'122,205,191':'64,118,103';
   const b=mode==='arcade'?'255,101,199':mode==='apps'?'85,150,255':dark?'198,155,208':'173,137,101';
   const cx=w*.52,cy=h*.51;
   const radius=Math.min(w*.47,h*.60);
   const glow=ctx.createRadialGradient(cx,cy,8,cx,cy,Math.max(120,radius));
   glow.addColorStop(0,'rgba('+a+','+(dark?.075:.035)+')');
   glow.addColorStop(.5,'rgba('+b+','+(dark?.035:.018)+')');
   glow.addColorStop(1,'rgba('+a+',0)');
   ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
   // Three slow orbital rings. Never draw a full opaque UI-blocking layer.
   for(let i=0;i<3;i++){
     ctx.beginPath();
     const rr=radius*(.38+i*.28);
     ctx.ellipse(cx,cy,rr,rr*(.58+i*.055),now*(disabled?0:.000008)*(i%2?-1:1)+i*.62,0,TAU);
     ctx.strokeStyle='rgba('+(i===1?b:a)+','+(dark?.13:.10)+')';
     ctx.lineWidth=.8;
     ctx.stroke();
   }
   for(const p of particles){
     const angle=p.angle+now*(disabled?0:p.speed);
     const x=cx+Math.cos(angle)*p.radius;
     const y=cy+Math.sin(angle)*p.radius*p.tilt;
     const rgba=p.alt?b:a;
     const alpha=(dark?.46:.43)*p.alpha;
     ctx.beginPath();
     ctx.fillStyle='rgba('+rgba+','+alpha.toFixed(3)+')';
     ctx.arc(x,y,p.size,0,TAU);
     ctx.fill();
   }
   if(!disabled)raf=requestAnimationFrame(paint);
 }
 function schedule(){
   if(raf)cancelAnimationFrame(raf);
   if(!document.hidden)raf=requestAnimationFrame(paint);
 }
 function resize(){
   if(resizePending)return;
   resizePending=true;
   requestAnimationFrame(()=>{resizePending=false;reset();lastAccentTime=-Infinity;schedule();});
 }
 function reduceChange(){
   disabled=!!reduced?.matches;
   reset();schedule();
 }
 window.addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',()=>{
   if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
   else{lastDraw=-Infinity;schedule();}
 });
 reduced?.addEventListener?.('change',reduceChange);
 // Read appearance after existing theme handler without intercepting it.
 new MutationObserver(()=>{lastAccentTime=-Infinity;schedule();})
   .observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 reset();schedule();
})();