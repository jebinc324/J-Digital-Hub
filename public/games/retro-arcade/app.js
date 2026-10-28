(() => {
'use strict';

const GAMES = [
  {id:'race',title:'CAR RACE',desc:'Endless race',roadmap:false},
  {id:'blocks',title:'BUILDING BLOCKS',desc:'1000-stage roadmap'},
  {id:'shooter',title:'SHOOTING',desc:'1000-stage roadmap'},
  {id:'brick',title:'BRICK BREAKER',desc:'1000-stage roadmap'},
  {id:'match',title:'ENGINEER MATCH',desc:'1000-stage match-3 roadmap'},
  {id:'pipe',title:'PIPE FLOW',desc:'1000-stage network roadmap'},
  {id:'crane',title:'CRANE STACK',desc:'1000-stage crane physics roadmap'},
  {id:'circuit',title:'CIRCUIT CONNECT',desc:'1000-stage electrical roadmap'},
  {id:'traffic',title:'TRAFFIC CONTROLLER',desc:'1000-stage junction roadmap'},
  {id:'gear',title:'GEAR FACTORY',desc:'1000-stage mechanical roadmap'},
  {id:'arrow',title:'ARROW REMOVE',desc:'1000-stage direction puzzle'},
  {id:'bird',title:'TAP BIRD',desc:'1000-stage tap-flight roadmap'}
];
const MAX_STAGE=1000, WORLD_SIZE=10, WORLD_COUNT=100, WEB_VERSION='0.2.1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const app=$('#app');
const screens=$$('.screen');
const canvas=$('#gameCanvas'), ctx=canvas.getContext('2d');
const domLayer=$('#domLayer');
let currentGame='race', currentStage=1, currentScreen='homeScreen';
let engine=null, animation=0, resizeObserver=null;
let gamePaused=false, onlineMode=false, roomState=null, roomUnsub=null;
let loadingTimer=null;

const defaultState={theme:'light',fontColor:null,points:0,highs:{},unlocked:{},lives:{},boosters:{}};
let state=loadState();
for(const g of GAMES){
  if(!state.unlocked[g.id]) state.unlocked[g.id]=1;
  if(!state.lives[g.id]) state.lives[g.id]={count:3,last:Date.now()};
  if(!state.boosters[g.id]) state.boosters[g.id]={shield:0,slow:0,power:0,speed:0,multi:0};
}
// One-time patch migration: preserve progression/wallet, but refill the games
// that were affected by the v0.2.0 input/runtime bugs so retesting is immediate.
if(state.webVersion!==WEB_VERSION){
  for(const id of ['shooter','match','bird','gear'])state.lives[id]={count:3,last:Date.now()};
  state.webVersion=WEB_VERSION;
}
saveState();

function loadState(){
  try{return {...defaultState,...JSON.parse(localStorage.getItem('jRetroArcadeWebState')||'{}')};}catch{return structuredClone(defaultState)}
}
function saveState(){localStorage.setItem('jRetroArcadeWebState',JSON.stringify(state));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function stageWorld(s){return Math.floor((clamp(s,1,MAX_STAGE)-1)/10)+1}
function stageLocal(s){return ((clamp(s,1,MAX_STAGE)-1)%10)+1}
function seedHash(str,stage){let h=2166136261;for(const ch of str){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h^=stage*7919+stageWorld(stage)*104729;return h>>>0}
function rng(seed){let x=seed||123456789;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%1000000)/1000000}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),1700)}
function showScreen(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));currentScreen=id;window.scrollTo(0,0)}
function gameById(id){return GAMES.find(g=>g.id===id)||GAMES[0]}
function refreshTheme(){
  app.classList.toggle('theme-dark',state.theme==='dark');app.classList.toggle('theme-light',state.theme!=='dark');
  $('#themeBtn').textContent=state.theme==='dark'?'WHITE':'BLACK';
  const c=state.fontColor||(state.theme==='dark'?'#f8f9fb':'#26313d');document.documentElement.style.setProperty('--text',c);document.documentElement.style.setProperty('--accent',c);
  document.querySelector('meta[name="theme-color"]').content=state.theme==='dark'?'#1f2228':'#e7ecf2';
}
function lifeData(id){
  const d=state.lives[id]||(state.lives[id]={count:3,last:Date.now()});const now=Date.now();
  if(d.count<3){const n=Math.floor((now-d.last)/300000);if(n>0){d.count=Math.min(3,d.count+n);d.last+=n*300000;if(d.count===3)d.last=now;saveState();}}
  return d;
}
function lives(id){return lifeData(id).count}
function lifeCountdown(id){const d=lifeData(id);if(d.count>=3)return'FULL';const left=Math.max(0,300000-(Date.now()-d.last));const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);return`${m}:${String(s).padStart(2,'0')}`}
function consumeLife(id){const d=lifeData(id);if(d.count<=0)return false;d.count--;if(d.count===2)d.last=Date.now();saveState();return true}
function addLives(id,n=1){const d=lifeData(id);d.count=Math.min(3,d.count+n);if(d.count===3)d.last=Date.now();saveState()}
function addPoints(n){state.points=Math.max(0,state.points+Math.floor(n));saveState();refreshSummaries()}
function spendPoints(n){if(state.points<n)return false;state.points-=n;saveState();refreshSummaries();return true}
function high(id){return state.highs[id]||0}
function saveHigh(id,v){state.highs[id]=Math.max(high(id),Math.floor(v));saveState()}
function unlocked(id){return clamp(state.unlocked[id]||1,1,MAX_STAGE)}
function unlockNext(id,s){if(s<MAX_STAGE)state.unlocked[id]=Math.max(unlocked(id),s+1);saveState()}
function claimClear(id,s,score=0){saveHigh(id,score);addPoints(45+Math.min(240,Math.floor(s/4)));unlockNext(id,s);if(s%10===0){state.boosters[id].power=(state.boosters[id].power||0)+1;saveState();toast('MEGA BOOSTER +1')};setTimeout(()=>openRoadmap(id),1500)}
function refreshSummaries(){
  $('#pointsText').textContent=state.points;$('#roadmapPoints').textContent=state.points;
  if(currentGame){$('#roadmapLives').textContent=`♥ ${lives(currentGame)}/3${lives(currentGame)<3?' • '+lifeCountdown(currentGame):''}`}
}

let resizeRaf=0;
function scheduleGameResize(){
  cancelAnimationFrame(resizeRaf);
  resizeRaf=requestAnimationFrame(()=>requestAnimationFrame(()=>resizeGameCanvas()));
}
function resizeGameCanvas(){
  if(currentScreen!=='gameScreen')return false;
  const frame=$('#gameFrame');
  if(!frame)return false;
  const r=frame.getBoundingClientRect();
  const W=Math.round(r.width||frame.clientWidth||canvas._cssW||0);
  const H=Math.round(r.height||frame.clientHeight||canvas._cssH||0);
  // During maximize/orientation changes Chromium can briefly report a 0px
  // flex child. Never poison the running game with that transient size.
  if(W<160||H<220){scheduleGameResize();return false;}
  const requestedDpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));
  const dpr=Math.max(1,Math.min(requestedDpr,3072/Math.max(1,W),3072/Math.max(1,H)));
  canvas._dpr=dpr;
  const bw=Math.max(320,Math.round(W*dpr));
  const bh=Math.max(420,Math.round(H*dpr));
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  canvas._cssW=W;canvas._cssH=H;
  engine?.resize?.(W,H);
  return true;
}
function pointerPos(e){const r=canvas.getBoundingClientRect();const p=e.touches?.[0]||e.changedTouches?.[0]||e;return{x:clamp(p.clientX-r.left,0,r.width),y:clamp(p.clientY-r.top,0,r.height)}}

function drawLogoArt(c,w,h,id,t=0){
  const dark=state.theme==='dark', accent=state.fontColor?state.fontColor:(dark?'#f8f9fb':'#26313d');
  c.clearRect(0,0,w,h);c.fillStyle=dark?'#262b32':'#dee4ea';round(c,0,0,w,h,18);c.fill();
  const soft=dark?'#5f6875':'#c4ced8';
  if(id==='race'){
    const l=w*.28,r=w*.72;c.fillStyle=dark?'#191c21':'#5c636c';round(c,l,h*.05,r-l,h*.9,12);c.fill();c.strokeStyle=soft;c.lineWidth=3;c.setLineDash([14,10]);c.beginPath();c.moveTo(w*.5,0);c.lineTo(w*.5,h);c.stroke();c.setLineDash([]);carShape(c,w*.5,h*.62,w*.18,h*.28,accent)
  }else if(id==='blocks'){
    const s=Math.min(w,h)*.16,g=4,x=w*.18,y=h*.84,shape=[[1,0,0,1],[1,1,1,1],[0,1,1,0],[1,1,0,1]];for(let rr=0;rr<4;rr++)for(let cc=0;cc<4;cc++)if(shape[rr][cc]){c.fillStyle=(rr+cc)%2?soft:accent;round(c,x+cc*(s+g),y-rr*(s+g)-s,s,s,5);c.fill()}
  }else if(id==='shooter'){
    c.fillStyle=dark?'#161a21':'#2e3742';round(c,w*.08,h*.07,w*.84,h*.86,14);c.fill();c.fillStyle=accent;c.beginPath();c.moveTo(w*.5,h*.55);c.lineTo(w*.68,h*.83);c.lineTo(w*.5,h*.76);c.lineTo(w*.32,h*.83);c.closePath();c.fill();for(let i=0;i<3;i++){c.fillStyle=soft;c.fillRect(w*(.28+i*.22),h*(.18+i*.03),18,12)}
  }else if(id==='brick'){
    for(let r=0;r<4;r++)for(let col=0;col<6;col++){c.fillStyle=(r+col)%2?soft:accent;round(c,8+col*(w-16)/6,10+r*18,(w-24)/6,13,3);c.fill()}c.fillStyle=accent;round(c,w*.35,h*.82,w*.3,8,4);c.fill();c.beginPath();c.arc(w*.55,h*.66,5,0,Math.PI*2);c.fill()
  }else if(id==='match'){
    const cols=['#5c8eaa','#c2845b','#719d77','#c2a65b','#8b78a5','#5c9e96','#b56f77'];for(let r=0;r<3;r++)for(let col=0;col<5;col++){c.fillStyle=cols[(r*5+col)%cols.length];round(c,8+col*(w-20)/5,8+r*(h-16)/3,(w-32)/5,(h-28)/3,7);c.fill();c.fillStyle='#eef3f6';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(['⚙','🔧','⚡','🔩','🛠'][col],8+col*(w-20)/5+(w-32)/10,30+r*(h-16)/3)}
  }else if(id==='pipe'||id==='circuit'){
    c.fillStyle=dark?'#30353a':'#c8cdd2';round(c,8,8,w-16,h-16,12);c.fill();c.strokeStyle=id==='pipe'?'#69b7d5':'#d0b55c';c.lineWidth=9;c.lineCap='round';for(let i=0;i<4;i++){const y=h*(.2+i*.2);c.beginPath();c.moveTo(w*.15,y);c.lineTo(w*.42,y);c.lineTo(w*.42,y+h*.12);c.lineTo(w*.8,y+h*.12);c.stroke()}c.fillStyle=accent;c.beginPath();c.arc(w*.18,h*.45,8,0,Math.PI*2);c.fill()
  }else if(id==='crane'){
    c.strokeStyle=soft;c.lineWidth=5;c.beginPath();c.moveTo(w*.18,h*.18);c.lineTo(w*.8,h*.18);c.moveTo(w*.26,h*.1);c.lineTo(w*.26,h*.72);c.stroke();c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(w*.58,h*.18);c.lineTo(w*.58,h*.48);c.stroke();c.fillStyle=accent;round(c,w*.43,h*.48,w*.3,h*.18,5);c.fill();c.fillStyle=soft;round(c,w*.3,h*.7,w*.4,10,4);c.fill()
  }else if(id==='traffic'){
    c.fillStyle=dark?'#4b5158':'#646b72';c.fillRect(w*.38,0,w*.24,h);c.fillRect(0,h*.38,w,h*.24);c.fillStyle='#ffcf68';c.beginPath();c.arc(w*.43,h*.43,5,0,Math.PI*2);c.fill();c.fillStyle='#69bd8c';c.beginPath();c.arc(w*.57,h*.57,5,0,Math.PI*2);c.fill()
  }else if(id==='gear'){
    for(let i=0;i<3;i++){const x=w*(.25+i*.25),rad=22+i*2;c.strokeStyle=i===1?accent:soft;c.lineWidth=9;c.setLineDash([5,4]);c.beginPath();c.arc(x,h*.55,rad,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle=accent;c.beginPath();c.arc(x,h*.55,5,0,Math.PI*2);c.fill()}
  }else if(id==='arrow'){
    c.fillStyle='#f3f5f7';round(c,8,8,w-16,h-16,14);c.fill();const paths=[[[.18,.25],[.44,.25],[.44,.48]],[[.2,.72],[.52,.72],[.52,.56],[.75,.56]],[[.7,.2],[.7,.38],[.56,.38]]];paths.forEach((pts,i)=>{c.strokeStyle=i? '#4d5359':accent;c.lineWidth=5;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,j)=>j?c.lineTo(w*p[0],h*p[1]):c.moveTo(w*p[0],h*p[1]));c.stroke();const q=pts.at(-1),p=pts.at(-2);arrowHead(c,w*q[0],h*q[1],Math.atan2(q[1]-p[1],q[0]-p[0]),i?'#4d5359':accent,8)})
  }else if(id==='bird'){
    c.fillStyle='#6e9fc3';c.fillRect(0,0,w,h);c.fillStyle='#69bd8c';c.fillRect(w*.68,0,w*.14,h*.33);c.fillRect(w*.68,h*.67,w*.14,h*.33);c.fillStyle='#ffcb61';c.beginPath();c.arc(w*.36,h*.5,15,0,Math.PI*2);c.fill();c.fillStyle='#202830';c.beginPath();c.arc(w*.41,h*.46,2.5,0,Math.PI*2);c.fill()
  }
}
function round(c,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath()}
function carShape(c,cx,cy,w,h,color){c.fillStyle=color;round(c,cx-w/2,cy-h/2,w,h,7);c.fill();c.fillStyle='#26303a';round(c,cx-w*.31,cy-h*.33,w*.62,h*.3,4);c.fill()}
function arrowHead(c,x,y,a,color,s){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=color;c.beginPath();c.moveTo(s,0);c.lineTo(-s*.55,-s*.6);c.lineTo(-s*.2,0);c.lineTo(-s*.55,s*.6);c.closePath();c.fill();c.restore()}

function renderHome(){
  refreshTheme();refreshSummaries();const grid=$('#gameGrid');grid.innerHTML='';
  GAMES.forEach(g=>{const b=document.createElement('button');b.className='game-card';const cv=document.createElement('canvas');cv.width=300;cv.height=184;b.appendChild(cv);const h=document.createElement('h3');h.textContent=g.title;b.appendChild(h);const p=document.createElement('p');p.textContent=g.desc;b.appendChild(p);const pr=document.createElement('span');pr.className='progress';pr.textContent=g.roadmap?`UNLOCKED ${unlocked(g.id)}/1000 • ♥ ${lives(g.id)}/3`:`BEST ${high(g.id)} • ♥ ${lives(g.id)}/3`;b.appendChild(pr);b.onclick=()=>g.roadmap?openRoadmap(g.id):startLoading(g.id,1);grid.appendChild(b);drawLogoArt(cv.getContext('2d'),cv.width,cv.height,g.id)});
}

function openRoadmap(id){
  stopEngine();currentGame=id;const g=gameById(id);$('#roadmapTitle').textContent=`${g.title} ROADMAP`;$('#roadmapProgress').textContent=`UNLOCKED ${unlocked(id)} / 1000`;refreshSummaries();buildRoadmap();showScreen('roadmapScreen');setTimeout(jumpCurrent,40)
}
const nx=[.76,.58,.34,.20,.32,.57,.77,.67,.42,.24], ny=[.88,.80,.72,.63,.54,.45,.36,.27,.18,.09];
function buildRoadmap(){
  const map=$('#roadmapMap');map.innerHTML='';const open=unlocked(currentGame);map.style.minHeight=`${WORLD_COUNT*540}px`;
  for(let slot=0;slot<WORLD_COUNT;slot++){
    const world=WORLD_COUNT-slot,top=slot*540;const sec=document.createElement('div');sec.className='world-section';sec.style.top=top+'px';const theme=(world-1)%6;const bg=['#aedc4d','#e7d28f','#dceff7','#bedbab','#606c84','#b9d3e6'][theme];const patch=['#85c45e','#d6b86c','#bedee8','#9ac58b','#4b5770','#99bbd6'][theme];
    sec.style.background=`radial-gradient(ellipse at 15% 22%,${patch} 0 20%,transparent 21%),radial-gradient(ellipse at 82% 28%,${patch} 0 20%,transparent 21%),radial-gradient(ellipse at 18% 82%,${patch} 0 22%,transparent 23%),${bg}`;
    const wt=document.createElement('div');wt.className='world-title';wt.textContent=`WORLD ${world} / 100`;sec.appendChild(wt);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.classList.add('road-path');const path=document.createElementNS(svg.namespaceURI,'path');let d=`M ${nx[0]*100} ${ny[0]*100}`;for(let i=1;i<10;i++)d+=` Q ${nx[i-1]*100} ${ny[i-1]*100} ${(nx[i-1]+nx[i])*50} ${(ny[i-1]+ny[i])*50}`;d+=` T ${nx[9]*100} ${ny[9]*100}`;path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#c2a365');path.setAttribute('stroke-width','7');path.setAttribute('stroke-linecap','round');svg.appendChild(path);const path2=path.cloneNode();path2.setAttribute('stroke','#efd9a3');path2.setAttribute('stroke-width','1.2');svg.appendChild(path2);sec.appendChild(svg);
    for(let i=0;i<10;i++){const s=(world-1)*10+i+1;const n=document.createElement('button');n.className='stage-node'+(i===9?' boss':'')+(s>open?' locked':'')+(s===open?' current':'');n.style.left=(nx[i]*100)+'%';n.style.top=(ny[i]*100)+'%';n.innerHTML=`<span class="star">★</span><span class="label">${s}</span>${s<open?'<span class="done-stars">★ ★ ★</span>':''}${s===open?'<span class="play-tag">PLAY</span>':''}`;n.onclick=()=>{if(s<=open){if(lives(currentGame)<=0)return toast(`NO LIVES • NEXT ${lifeCountdown(currentGame)}`);startLoading(currentGame,s)}else toast('CLEAR PREVIOUS STAGE')};sec.appendChild(n)}
    map.appendChild(sec)
  }
}
function jumpCurrent(){const sc=$('#roadmapScroll');const s=unlocked(currentGame),world=stageWorld(s),local=stageLocal(s),slot=WORLD_COUNT-world;const y=slot*540+ny[local-1]*540-sc.clientHeight*.55;sc.scrollTo({top:Math.max(0,y),behavior:'smooth'})}

function startLoading(id,stage){
  stopEngine();currentGame=id;currentStage=clamp(stage,1,MAX_STAGE);const g=gameById(id);showScreen('loadingScreen');$('#loadingTitle').textContent=g.title;$('#loadingStage').textContent=id==='race'?'ENDLESS MODE':`STAGE ${currentStage} / 1000`;const art=$('#loadingArt');drawLogoArt(art.getContext('2d'),art.width,art.height,id,0);const bar=$('#loadingBar');bar.style.width='0%';let p=0;clearInterval(loadingTimer);loadingTimer=setInterval(()=>{p+=9+Math.random()*11;bar.style.width=Math.min(100,p)+'%';if(p>=100){clearInterval(loadingTimer);setTimeout(()=>openGame(id,currentStage),100)}},85)
}

function openGame(id,stage){
  currentGame=id;currentStage=stage;const g=gameById(id);$('#gameTitle').textContent=g.title;$('#gameStageLabel').textContent=id==='race'?'ENDLESS MODE':`STAGE ${stage} / 1000`;$('#mapBtn').classList.toggle('hidden',id==='race');$('#pauseMapBtn').classList.toggle('hidden',id==='race');showScreen('gameScreen');requestAnimationFrame(()=>{resizeGameCanvas();createEngine();setPaused(false);updateControlState()})
}
function stopEngine(){cancelAnimationFrame(animation);cancelAnimationFrame(resizeRaf);animation=0;resizeRaf=0;if(engine?.destroy)engine.destroy();engine=null;domLayer.innerHTML='';window.onkeydown=null;window.onkeyup=null}
function createEngine(){stopEngine();resizeGameCanvas();const factory={race:RaceGame,blocks:BlocksGame,shooter:ShooterGame,brick:BrickGame,match:MatchGame,pipe:PipeGame,crane:CraneGame,circuit:CircuitGame,traffic:TrafficGame,gear:GearGame,arrow:ArrowGame,bird:BirdGame}[currentGame];engine=factory?factory(currentStage):RaceGame(currentStage);const W=canvas._cssW||canvas.clientWidth||360,H=canvas._cssH||canvas.clientHeight||640;engine.resize?.(W,H);engine.start?.();loop(performance.now());scheduleGameResize()}
function loop(now){if(!engine)return;try{if(!gamePaused)engine.update?.(now);const dpr=canvas._dpr||1;ctx.setTransform(dpr,0,0,dpr,0,0);engine.draw?.(ctx,canvas._cssW||canvas.clientWidth||360,canvas._cssH||canvas.clientHeight||640,now)}catch(err){console.error('Game frame error',currentGame,err)}animation=requestAnimationFrame(loop)}
function setPaused(v){gamePaused=v;if(engine?.setPaused)engine.setPaused(v)}
function updateControlState(stopped=false){$('#playBtn').classList.toggle('active',!gamePaused&&!stopped);$('#pauseBtn').classList.toggle('active',gamePaused&&!stopped);$('#stopBtn').classList.toggle('active',stopped)}
function showPause(kind='PAUSED'){
  setPaused(true);$('#pauseTitle').textContent=kind;$('#pauseSub').textContent=gameById(currentGame).title+(currentGame==='race'?' • run frozen':` • Stage ${currentStage} • progress safe`);$('#pauseStageLine').textContent=currentGame==='race'?`ENDLESS MODE • ◆ ${state.points}`:`STAGE ${currentStage} / 1000 • ◆ ${state.points}`;drawLogoArt($('#pauseArt').getContext('2d'),720,280,currentGame,0);renderBoosters();$('#pauseOverlay').classList.remove('hidden');updateControlState(kind==='STOPPED')
}
function hidePause(){setPaused(false);$('#pauseOverlay').classList.add('hidden');updateControlState()}
function renderBoosters(){const row=$('#boosterRow');row.innerHTML='';const types=currentGame==='brick'?['shield','slow','power','speed','multi']:['shield','slow','power'];types.forEach(t=>{const b=document.createElement('button');b.className='booster-btn';b.textContent=`${t.toUpperCase()}\n×${state.boosters[currentGame][t]||0}`;b.onclick=()=>useBooster(t);row.appendChild(b)})}
function useBooster(type){const inv=state.boosters[currentGame];if((inv[type]||0)<=0)return toast('No booster left. Open Store.');const ok=engine?.booster?.(type);if(ok===false)return toast('Booster cannot be used now.');inv[type]--;saveState();toast('Booster activated!');renderBoosters();hidePause()}

function openStore(id=currentGame){currentGame=id;stopEngine();const g=gameById(id);$('#storeTitle').textContent=`${g.title} STORE`;showScreen('storeScreen');renderStore()}
function renderStore(){
  const id=currentGame,b=state.boosters[id],body=$('#storeBody');body.innerHTML=`<section class="neo-card store-hero"><h2>${gameById(id).title}</h2><p>Use Arcade Points earned by clearing stages.</p></section>`;
  const inv=document.createElement('div');inv.className='inventory-grid';const its=[['◆','WALLET',state.points],['🚀','STAGE',id==='race'?1:unlocked(id)],['♥','LIVES',lives(id)]];its.forEach(x=>{const d=document.createElement('div');d.className='inventory-tile';d.innerHTML=`<span class="ico">${x[0]}</span><small>${x[1]}</small><b>×${x[2]}</b>`;inv.appendChild(d)});body.appendChild(inv);
  const items=[['♥','LIFE REFILL','Refill this game to 3 lives',120,'life'],['🛡','SHIELD','Protect one mistake / hit',90,'shield'],['⏱','SLOW','Slow hazards / motion',85,'slow'],['⚡','POWER','Strong game-specific power',110,'power']];if(id==='brick'){items.push(['＋','SPEED','Increase ball speed',70,'speed'],['×3','MULTI BALL','Add extra balls',100,'multi'])}
  items.forEach(([ico,title,desc,price,type])=>{const s=document.createElement('section');s.className='neo-card store-item';s.innerHTML=`<div class="sicon">${ico}</div><div><h3>${title}</h3><p>${desc}</p></div><button class="buy-btn">◆ ${price}</button>`;s.querySelector('button').onclick=()=>{if(!spendPoints(price))return toast('Not enough Arcade Points');if(type==='life')addLives(id,3);else{b[type]=(b[type]||0)+1;saveState()}toast(`${title} ADDED`);renderStore()};body.appendChild(s)})
}

function renderStorePicker(){const list=$('#storePickerList');list.innerHTML='';GAMES.forEach(g=>{const b=document.createElement('button');b.className='store-pick';b.textContent=g.title;b.onclick=()=>{$('#storePickerModal').classList.add('hidden');openStore(g.id)};list.appendChild(b)})}

function bindUI(){
  $('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';saveState();renderHome()};
  $('#rgbBtn').onclick=()=>{$('#rgbPicker').value=state.fontColor||(state.theme==='dark'?'#f8f9fb':'#26313d');$('#rgbPreview').style.color=$('#rgbPicker').value;$('#rgbModal').classList.remove('hidden')};
  $('#rgbPicker').oninput=e=>$('#rgbPreview').style.color=e.target.value;$('#rgbApply').onclick=()=>{state.fontColor=$('#rgbPicker').value;saveState();$('#rgbModal').classList.add('hidden');renderHome()};$('#rgbReset').onclick=()=>{state.fontColor=null;saveState();$('#rgbModal').classList.add('hidden');renderHome()};$('#rgbCancel').onclick=()=>$('#rgbModal').classList.add('hidden');
  $('[data-nav="home"]').onclick=()=>{showScreen('homeScreen');renderHome()};$('#currentStageBtn').onclick=jumpCurrent;$('#roadmapStoreBtn').onclick=()=>openStore(currentGame);
  $('#storeHomeBtn').onclick=()=>{renderStorePicker();$('#storePickerModal').classList.remove('hidden')};$('#storePickerClose').onclick=()=>$('#storePickerModal').classList.add('hidden');
  $('#storeBackBtn').onclick=()=>{if(gameById(currentGame).roadmap)openRoadmap(currentGame);else{showScreen('homeScreen');renderHome()}};
  $('#gameBackBtn').onclick=()=>{stopEngine();currentGame==='race'?(showScreen('homeScreen'),renderHome()):openRoadmap(currentGame)};$('#mapBtn').onclick=()=>openRoadmap(currentGame);$('#boostBtn').onclick=()=>showPause('PAUSED');
  $('#playBtn').onclick=hidePause;$('#pauseBtn').onclick=()=>showPause('PAUSED');$('#stopBtn').onclick=()=>{engine?.reset?.();showPause('STOPPED')};$('#resumeBtn').onclick=hidePause;$('#restartBtn').onclick=()=>{createEngine();hidePause()};$('#pauseMapBtn').onclick=()=>openRoadmap(currentGame);$('#pauseHomeBtn').onclick=()=>{stopEngine();$('#pauseOverlay').classList.add('hidden');showScreen('homeScreen');renderHome()};$('#pauseStoreBtn').onclick=()=>openStore(currentGame);
  const onGameResize=()=>{if(currentScreen==='gameScreen')scheduleGameResize()};
  window.addEventListener('resize',onGameResize,{passive:true});
  window.addEventListener('orientationchange',onGameResize,{passive:true});
  document.addEventListener('fullscreenchange',onGameResize);
  window.visualViewport?.addEventListener('resize',onGameResize,{passive:true});
  if('ResizeObserver' in window){resizeObserver?.disconnect?.();resizeObserver=new ResizeObserver(onGameResize);resizeObserver.observe($('#gameFrame'))}
  $('#onlineBtn').onclick=()=>{$('#onlineModal').classList.remove('hidden');updateOnlineStatus()};$('#onlineClose').onclick=()=>$('#onlineModal').classList.add('hidden');
  $('#createRoomBtn').onclick=async()=>{try{const mp=window.JArcadeMultiplayer;if(!mp?.enabled)throw Error('Add Firebase config first.');const code=await mp.createRoom($('#playerName').value||'Player',currentGame);onlineMode=true;toast(`ROOM ${code} CREATED`);bindRoom()}catch(e){toast(e.message)}};
  $('#joinRoomBtn').onclick=async()=>{try{const mp=window.JArcadeMultiplayer;if(!mp?.enabled)throw Error('Add Firebase config first.');const code=await mp.joinRoom($('#roomCodeInput').value,$('#playerName').value||'Player');onlineMode=true;toast(`JOINED ${code}`);bindRoom()}catch(e){toast(e.message)}};
}
function updateOnlineStatus(){const ok=window.JArcadeMultiplayer?.enabled;const s=$('#onlineStatus');s.textContent=ok?'ONLINE READY':'SETUP REQUIRED';s.classList.toggle('ok',!!ok)}
function bindRoom(){if(roomUnsub)roomUnsub();const mp=window.JArcadeMultiplayer;roomUnsub=mp.onRoom(r=>{roomState=r;const box=$('#roomInfo');if(!r){box.classList.add('hidden');return}box.classList.remove('hidden');const me=mp.slot==='host'?r.players?.host:r.players?.guest,opp=mp.slot==='host'?r.players?.guest:r.players?.host;const heading=document.createElement('b');heading.textContent=`ROOM ${mp.roomCode}`;box.replaceChildren(heading,document.createElement('br'),document.createTextNode(`${me?.name||'You'} vs ${opp?.name||'Waiting…'}`),document.createElement('br'),document.createTextNode(`${gameById(r.gameId||'race').title} • ${r.status||'lobby'}`))})}
window.addEventListener('jarcade-multiplayer-ready',updateOnlineStatus);window.addEventListener('jarcade-multiplayer-error',updateOnlineStatus);

// ---------- shared game drawing helpers ----------
function gRound(c,x,y,w,h,r,fill,stroke=null,lw=1){if(fill)c.fillStyle=fill;if(stroke){c.strokeStyle=stroke;c.lineWidth=lw}round(c,x,y,w,h,r);if(fill)c.fill();if(stroke)c.stroke()}
function text(c,s,x,y,size,color='#fff',align='left',weight=700){c.fillStyle=color;c.font=`${weight} ${size}px "Arial Narrow",Arial,sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y)}
function hudPanel(c,w,title,left2,right1,right2){gRound(c,9,9,w-18,95,16,'#262c34');text(c,title,20,35,14,getComputedStyle(app).getPropertyValue('--text').trim()||'#fff');if(left2)text(c,left2,20,57,10,'#d6dde4');if(right1)text(c,right1,w-20,35,10,'#d6dde4','right');if(right2)text(c,right2,w-20,57,10,'#d6dde4','right')}
function overlay(c,w,h,title,sub){c.fillStyle='rgba(18,22,26,.88)';c.fillRect(0,0,w,h);text(c,title,w/2,h*.46,27,getComputedStyle(app).getPropertyValue('--text').trim()||'#fff','center',900);text(c,sub,w/2,h*.53,13,'#cfd7de','center',700)}
function stageClearBanner(c,w,h,title='STAGE CLEARED!',sub='ROADMAP NEXT'){gRound(c,28,h-126,w-56,48,14,'rgba(34,71,47,.88)');text(c,title,w/2,h-98,16,'#85e59f','center',900);text(c,sub,w/2,h-83,9,'#dce6de','center',700)}
function gameOverLife(id,title,sub='Tap to retry'){if(!consumeLife(id))return;toast(`${title} • ♥ ${lives(id)}/3`)}
function useOnce(fn){let done=false;return(...a)=>{if(done)return;done=true;return fn(...a)}}
function canvasPointer(handler){const fn=e=>handler(pointerPos(e),e);canvas.addEventListener('pointerdown',fn);return()=>canvas.removeEventListener('pointerdown',fn)}

// ---------- 01 Car Race ----------
function RaceGame(){
  let w=1,h=1,roadL=0,roadR=0,laneW=0,carW=0,carH=0,playerY=0,lane=1,enemies=[],score=0,passed=0,speed=270,spawn=.45,last=performance.now(),crashed=false,noLives=lives('race')<=0,shieldUntil=0,slowUntil=0,powerUntil=0,scroll=0;
  const r=rng(Date.now()>>>0);let cleanup=canvasPointer(p=>{if(crashed||noLives){if(lives('race')>0)reset();return}lane=clamp(lane+(p.x<w/2?-1:1),0,2)});
  window.onkeydown=e=>{if(e.key==='ArrowLeft')lane=clamp(lane-1,0,2);if(e.key==='ArrowRight')lane=clamp(lane+1,0,2)};
  function reset(){enemies=[];score=0;passed=0;speed=270;spawn=.45;crashed=false;noLives=lives('race')<=0;scroll=0;last=performance.now()}
  function rect(l,y){const cx=roadL+laneW*(l+.5);return{x:cx-carW/2,y,w:carW,h:carH}}
  function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
  return{
    resize(W,H){w=W;h=H;roadL=w*.12;roadR=w*.88;laneW=(roadR-roadL)/3;carW=laneW*.52;carH=carW*1.55;playerY=h-carH-34},
    update(now){if(crashed||noLives)return;const dt=Math.min(.035,(now-last)/1000);last=now;const slow=now<slowUntil?.58:1,mul=now<powerUntil?2:1;score+=mul*Math.max(1,Math.floor(dt*speed*.32));speed=Math.min(720,270+score*.17);spawn-=dt;scroll+=speed*slow*dt;if(spawn<=0){spawn=Math.max(.48,1.15-score/9000)*(.75+r()*.55);const occ=new Set(enemies.filter(e=>e.y<200).map(e=>e.l));const cand=[0,1,2].filter(x=>!occ.has(x));if(cand.length)enemies.push({l:cand[Math.floor(r()*cand.length)],y:-carH-20,s:speed*(.92+r()*.22),style:Math.floor(r()*4)})}const pr=rect(lane,playerY);for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.y+=e.s*slow*dt;if(hit(pr,rect(e.l,e.y))){if(now<shieldUntil){enemies.splice(i,1);score+=180*mul;passed++;continue}crashed=true;consumeLife('race');saveHigh('race',score);noLives=lives('race')<=0;break}if(e.y>h+carH){enemies.splice(i,1);passed++;score+=75*mul}}saveHigh('race',score)},
    draw(c){c.fillStyle='#365439';c.fillRect(0,0,w,h);c.fillStyle='#373c41';c.fillRect(roadL,0,roadR-roadL,h);c.fillStyle='#d2d6da';c.fillRect(roadL-4,0,4,h);c.fillRect(roadR,0,4,h);c.strokeStyle='#e0e0d9';c.lineWidth=3;c.setLineDash([32,23]);for(let i=1;i<3;i++){const x=roadL+laneW*i;c.beginPath();c.moveTo(x,-70+(scroll%70));c.lineTo(x,h);c.stroke()}c.setLineDash([]);enemies.forEach(e=>drawRaceCar(c,rect(e.l,e.y),['#bc6256','#cda052','#739169','#8c76a8'][e.style]));drawRaceCar(c,rect(lane,playerY),performance.now()<powerUntil?'#dcad51':'#7ca4bd');gRound(c,10,10,w-20,54,14,'rgba(26,31,36,.78)');text(c,`SCORE ${score}`,24,43,14,'#f0f3f5');text(c,`PASS ${passed}`,w/2,43,14,'#f0f3f5','center');text(c,`BEST ${high('race')}`,w-24,43,14,'#f0f3f5','right');if(noLives)overlay(c,w,h,'NO RACE LIVES',`NEXT LIFE ${lifeCountdown('race')} • Open Store`);else if(crashed)overlay(c,w,h,'CRASH!',`Score ${score} • Tap to race again`)},
    reset, destroy(){cleanup();window.onkeydown=null},booster(t){const n=performance.now();if(t==='shield')shieldUntil=n+14000;else if(t==='slow')slowUntil=n+12000;else if(t==='power')powerUntil=n+12000;return true}
  }
}
function drawRaceCar(c,r,col){gRound(c,r.x,r.y,r.w,r.h,9,col);gRound(c,r.x+r.w*.18,r.y+r.h*.16,r.w*.64,r.h*.31,4,'#263039');gRound(c,r.x+r.w*.24,r.y+r.h*.58,r.w*.52,r.h*.25,4,'#d9e7ef')}

// ---------- 02 Building Blocks (10x20 Tetris) ----------
function BlocksGame(stage){
  const COLS=10,ROWS=20,PIECES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
  let w=1,h=1,cell=20,left=0,top=112,board=Array.from({length:ROWS},()=>Array(COLS).fill(0)),piece=null,px=3,py=0,score=0,lines=0,target=4+(stageLocal(stage)%4)+((stageWorld(stage)-1)%4),dropAcc=0,last=performance.now(),over=lives('blocks')<=0,cleared=false,slowUntil=0;
  const R=rng(seedHash('blocks',stage));
  function clone(p){return p.map(r=>r.slice())}function newPiece(){piece=clone(PIECES[Math.floor(R()*PIECES.length)]);px=Math.floor((COLS-piece[0].length)/2);py=0;if(collide(px,py,piece)){over=true;consumeLife('blocks')}}
  function collide(x,y,p){for(let r=0;r<p.length;r++)for(let c=0;c<p[r].length;c++)if(p[r][c]){const xx=x+c,yy=y+r;if(xx<0||xx>=COLS||yy>=ROWS||(yy>=0&&board[yy][xx]))return true}return false}
  function rotateP(){const p=piece[0].map((_,i)=>piece.map(r=>r[i]).reverse());if(!collide(px,py,p))piece=p}
  function lock(){piece.forEach((row,r)=>row.forEach((v,c)=>{if(v&&py+r>=0)board[py+r][px+c]=1+((stage+r+c)%6)}));let n=0;for(let r=ROWS-1;r>=0;r--){if(board[r].every(Boolean)){board.splice(r,1);board.unshift(Array(COLS).fill(0));n++;r++}}if(n){lines+=n;score+=100*n*n;addPoints(n*2)}if(lines>=target&&!cleared){cleared=true;saveHigh('blocks',score);claimClear('blocks',stage,score)}else newPiece()}
  function move(dx){if(!over&&!cleared&&!collide(px+dx,py,piece))px+=dx}function down(){if(!collide(px,py+1,piece))py++;else lock()}function hard(){while(!collide(px,py+1,piece))py++;lock()}
  const cleanup=canvasPointer(p=>{if(over){if(lives('blocks')>0)reset();return}if(p.y<top+cell*4)rotateP();else if(p.x<w*.33)move(-1);else if(p.x>w*.67)move(1);else hard()});window.onkeydown=e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='ArrowUp')rotateP();if(e.key==='ArrowDown')down();if(e.code==='Space')hard()};
  function reset(){board=Array.from({length:ROWS},()=>Array(COLS).fill(0));score=0;lines=0;over=lives('blocks')<=0;cleared=false;newPiece();last=performance.now()}
  newPiece();
  return{resize(W,H){w=W;h=H;cell=Math.min((w-26)/COLS,(h-135)/ROWS);left=(w-cell*COLS)/2;top=112},update(now){if(over||cleared)return;const dt=Math.min(.04,(now-last)/1000);last=now;dropAcc+=dt;const iv=Math.max(.08,.62-stageWorld(stage)*.004)*(now<slowUntil?1.7:1);if(dropAcc>iv){dropAcc=0;down()}},draw(c){c.fillStyle='#14191f';c.fillRect(0,0,w,h);hudPanel(c,w,'BUILDING BLOCKS',`STAGE ${stage}/1000`,`LINES ${lines}/${target}`,`SCORE ${score}`);gRound(c,left-4,top-4,cell*COLS+8,cell*ROWS+8,8,'#1e252d','#47515c',1);for(let r=0;r<ROWS;r++)for(let col=0;col<COLS;col++){if(board[r][col])drawBlock(c,left+col*cell,top+r*cell,cell,board[r][col]);else{c.strokeStyle='rgba(120,135,150,.16)';c.strokeRect(left+col*cell,top+r*cell,cell,cell)}}if(piece)piece.forEach((row,r)=>row.forEach((v,col)=>{if(v)drawBlock(c,left+(px+col)*cell,top+(py+r)*cell,cell,4)}));if(over)overlay(c,w,h,'GAME OVER',lives('blocks')<=0?`NEXT LIFE ${lifeCountdown('blocks')}`:'Tap to retry');if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'LINES COMPLETE • ROADMAP NEXT')},reset,destroy(){cleanup();window.onkeydown=null},booster(t){if(t==='shield'){addLives('blocks',1);return true}if(t==='slow'){slowUntil=performance.now()+12000;return true}if(t==='power'){for(let i=0;i<2;i++){board.pop();board.unshift(Array(COLS).fill(0))}return true}return false}}
}
function drawBlock(c,x,y,s,n){const cols=['#5c8eaa','#c2845b','#719d77','#c2a65b','#8b78a5','#5c9e96'];gRound(c,x+1,y+1,s-2,s-2,4,cols[(n-1)%cols.length]);c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x+4,y+4,Math.max(2,s-8),2)}

// ---------- 03 Shooting ----------
function ShooterGame(stage){
  let w=1,h=1,px=0,py=0,pw=42,ph=34,enemies=[],bullets=[],enemyBullets=[],score=0,last=performance.now(),fire=0,enemyFire=.8,over=lives('shooter')<=0,cleared=false,slowUntil=0,powerUntil=0,dragPointer=null,leftHeld=false,rightHeld=false;
  const R=rng(seedHash('shooter',stage)),mode=stage%10===0?10:stageLocal(stage),world=stageWorld(stage);
  function setup(){
    enemies=[];bullets=[];enemyBullets=[];score=0;over=lives('shooter')<=0;cleared=false;fire=0;enemyFire=.8;px=w/2;py=Math.max(145,h-55);
    const cols=world>=60?6:5,rows=Math.min(5,2+Math.floor((world-1)/20));
    if(mode===10){
      enemies.push({x:w/2,y:135,w:Math.min(w*.46,150),h:75,hp:42+Math.round(stage*.5),vx:70,boss:true});
    }else{
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)enemies.push({x:w/(cols+1)*(c+1),y:135+r*48,w:34,h:25,hp:1+Math.floor((world-1)/25),vx:(r%2?-1:1)*(30+world*.65),boss:false});
    }
    last=performance.now();
  }
  function lose(){if(over)return;consumeLife('shooter');over=true;saveHigh('shooter',score)}
  function rectHit(a,b){return a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h/2<b.y+b.h/2&&a.y+a.h/2>b.y-b.h/2}
  function moveToEvent(e){const p=pointerPos(e);px=clamp(p.x,25,Math.max(25,w-25))}
  function pointerDown(e){e.preventDefault();if(over){if(lives('shooter')>0)setup();return}dragPointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);moveToEvent(e)}
  function pointerMove(e){if(dragPointer!==null&&e.pointerId!==dragPointer)return;if(dragPointer===null&&e.pointerType!=='mouse')return;e.preventDefault();moveToEvent(e)}
  function pointerUp(e){if(dragPointer===e.pointerId){canvas.releasePointerCapture?.(e.pointerId);dragPointer=null}}
  function keyDown(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){leftHeld=true;e.preventDefault()}if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){rightHeld=true;e.preventDefault()}}
  function keyUp(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')leftHeld=false;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')rightHeld=false}
  canvas.addEventListener('pointerdown',pointerDown,{passive:false});canvas.addEventListener('pointermove',pointerMove,{passive:false});canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);window.addEventListener('keydown',keyDown,{passive:false});window.addEventListener('keyup',keyUp);
  setup();
  return{
    resize(W,H){const first=w<=2||h<=2;w=Math.max(220,W);h=Math.max(300,H);py=h-55;px=clamp(first?w/2:px,25,w-25);if(first)setup()},
    update(now){
      if(over||cleared)return;const dt=Math.min(.04,Math.max(.001,(now-last)/1000));last=now;const slow=now<slowUntil?.55:1;
      if(leftHeld)px=clamp(px-310*dt,25,w-25);if(rightHeld)px=clamp(px+310*dt,25,w-25);
      fire-=dt;if(fire<=0){fire=Math.max(.075,(now<powerUntil?.135:.25)-world*.0008);bullets.push({x:px,y:py-20,vy:-650,vx:0});if(now<powerUntil)bullets.push({x:px-11,y:py-18,vy:-620,vx:-35},{x:px+11,y:py-18,vy:-620,vx:35})}
      enemyFire-=dt;if(enemyFire<=0&&enemies.length){enemyFire=Math.max(.22,.9-world*.005);const e=enemies[Math.floor(R()*enemies.length)];enemyBullets.push({x:e.x,y:e.y+e.h/2,vy:180+world*2,vx:(px-e.x)*.12})}
      for(const e of enemies){e.x+=e.vx*dt*slow;if(e.x-e.w/2<5){e.x=e.w/2+5;e.vx=Math.abs(e.vx)}if(e.x+e.w/2>w-5){e.x=w-5-e.w/2;e.vx=-Math.abs(e.vx)}if(!e.boss)e.y+=Math.sin(now/430+e.x*.01)*.22;if(e.y+e.h/2>py-20){lose();break}}
      for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.y+=b.vy*dt;b.x+=(b.vx||0)*dt;if(b.y<100||b.x<-20||b.x>w+20){bullets.splice(i,1);continue}for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(rectHit({x:b.x,y:b.y,w:6,h:12},e)){bullets.splice(i,1);e.hp--;score+=e.boss?45:20;if(e.hp<=0){score+=e.boss?2200+stage*3:120+Math.floor(stage/3);enemies.splice(j,1)}break}}}
      for(let i=enemyBullets.length-1;i>=0;i--){const b=enemyBullets[i];b.y+=b.vy*dt*slow;b.x+=(b.vx||0)*dt;if(b.y>h+20||b.x<-20||b.x>w+20){enemyBullets.splice(i,1);continue}if(rectHit({x:b.x,y:b.y,w:6,h:12},{x:px,y:py,w:pw,h:ph})){enemyBullets.splice(i,1);lose();break}}
      if(!enemies.length&&!cleared){cleared=true;saveHigh('shooter',score);claimClear('shooter',stage,score)}
    },
    draw(c){
      c.fillStyle='#0f141b';c.fillRect(0,0,w,h);for(let i=0;i<30;i++){c.fillStyle=i%3?'#2c3540':'#72808f';c.fillRect((i*83)%w,(i*57+performance.now()*.02)%Math.max(1,h),1.5,1.5)}
      hudPanel(c,w,'SHOOTING',`STAGE ${stage}/1000`,mode===10?'BOSS':'MISSION',`SCORE ${score}`);text(c,'DRAG TO MOVE • AUTO FIRE',w/2,83,9,'#aeb8c2','center');
      enemies.forEach((e,i)=>drawShip(c,e.x,e.y,e.w,e.h,e.boss?'#b86d78':['#5c8eaa','#c2845b','#719d77','#8b78a5'][i%4],true));drawShip(c,px,py,pw,ph,'#7ca4bd',false);
      c.fillStyle='#d9edf7';bullets.forEach(b=>c.fillRect(b.x-2,b.y-8,4,12));c.fillStyle='#e69076';enemyBullets.forEach(b=>c.fillRect(b.x-2,b.y,4,12));
      if(over)overlay(c,w,h,'MISSION OVER',lives('shooter')<=0?`NEXT LIFE ${lifeCountdown('shooter')}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'RETURNING TO ROADMAP')
    },
    reset:setup,
    destroy(){canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp)},
    booster(t){const n=performance.now();if(t==='shield'){addLives('shooter',1);return true}if(t==='slow'){slowUntil=n+12000;return true}if(t==='power'){powerUntil=n+12000;return true}return false}
  }
}

function drawShip(c,x,y,w,h,col,enemy){c.fillStyle=col;c.beginPath();if(enemy){c.moveTo(x-w/2,y-h/2);c.lineTo(x+w/2,y-h/2);c.lineTo(x+w*.32,y+h/2);c.lineTo(x,y+h*.22);c.lineTo(x-w*.32,y+h/2)}else{c.moveTo(x,y-h/2);c.lineTo(x+w/2,y+h/2);c.lineTo(x,y+h*.25);c.lineTo(x-w/2,y+h/2)}c.closePath();c.fill();c.fillStyle='#202a33';c.beginPath();c.arc(x,y,Math.min(w,h)*.15,0,Math.PI*2);c.fill()}

// ---------- 04 Brick Breaker ----------
function BrickGame(stage){
  let w=1,h=1,paddle={x:0,y:0,w:110,h:12},balls=[],bricks=[],score=0,last=performance.now(),over=lives('brick')<=0,cleared=false,wideUntil=0,slowUntil=0;const R=rng(seedHash('brick',stage));let cleanup=()=>{};
  function setup(){score=0;over=lives('brick')<=0;cleared=false;bricks=[];balls=[];const rows=Math.min(9,4+Math.floor(stageWorld(stage)/12)),cols=Math.min(10,6+Math.floor(stageWorld(stage)/18));const bw=(w-24)/cols,bh=18;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(((r*31+c*17+stage)%23===0)&&rows>4)continue;const hp=stageWorld(stage)>=28&&R()<.2?3:stageWorld(stage)>=8&&R()<.28?2:1;bricks.push({x:12+c*bw+2,y:118+r*(bh+4),w:bw-4,h:bh,hp,max:hp,dead:false})}paddle={x:w/2-55,y:h-46,w:110,h:12};spawn();last=performance.now()}
  function spawn(){const sp=285,a=.98;balls.push({x:w/2,y:paddle.y-10,vx:Math.cos(a)*sp,vy:-Math.sin(a)*sp,r:7})}
  function loseBall(){if(balls.length)return;consumeLife('brick');if(lives('brick')<=0)over=true;else spawn()}
  function multi(n=2){if(!balls.length)spawn();const extras=[];for(const b of balls.slice()){if(extras.length>=n)break;const sp=Math.hypot(b.vx,b.vy),a=Math.atan2(b.vy,b.vx);extras.push({x:b.x,y:b.y,vx:Math.cos(a+.45)*sp,vy:Math.sin(a+.45)*sp,r:b.r})}balls.push(...extras)}
  const moveP=e=>{const p=pointerPos(e);paddle.x=clamp(p.x-paddle.w/2,8,w-paddle.w-8)};canvas.addEventListener('pointerdown',moveP);canvas.addEventListener('pointermove',moveP);cleanup=()=>{canvas.removeEventListener('pointerdown',moveP);canvas.removeEventListener('pointermove',moveP)};
  setup();
  return{resize(W,H){const first=w<=2||h<=2;w=W;h=H;if(first||!bricks.length)setup();paddle.y=h-46},update(now){if(over||cleared)return;const dt=Math.min(.033,(now-last)/1000);last=now;const sf=now<slowUntil?.72:1;if(now>=wideUntil&&paddle.w>112){const cx=paddle.x+paddle.w/2;paddle.w=110;paddle.x=clamp(cx-55,8,w-118)}for(let bi=balls.length-1;bi>=0;bi--){const b=balls[bi];b.x+=b.vx*dt*sf;b.y+=b.vy*dt*sf;if(b.x-b.r<0&&b.vx<0){b.x=b.r;b.vx*=-1}if(b.x+b.r>w&&b.vx>0){b.x=w-b.r;b.vx*=-1}if(b.y-b.r<105&&b.vy<0){b.y=105+b.r;b.vy*=-1}if(b.vy>0&&b.x>paddle.x&&b.x<paddle.x+paddle.w&&b.y+b.r>paddle.y&&b.y-b.r<paddle.y+paddle.h){const hit=(b.x-(paddle.x+paddle.w/2))/(paddle.w/2),sp=Math.hypot(b.vx,b.vy),a=hit*1.18;b.vx=Math.sin(a)*sp;b.vy=-Math.cos(a)*sp;b.y=paddle.y-b.r-1}for(const br of bricks){if(br.dead)continue;if(b.x+b.r>br.x&&b.x-b.r<br.x+br.w&&b.y+b.r>br.y&&b.y-b.r<br.y+br.h){br.hp--;score+=35;if(br.hp<=0){br.dead=true;score+=65}b.vy*=-1;break}}if(b.y-b.r>h)balls.splice(bi,1)}if(!balls.length)loseBall();if(bricks.every(b=>b.dead)&&!cleared){cleared=true;saveHigh('brick',score);claimClear('brick',stage,score)}},draw(c){c.fillStyle='#14191f';c.fillRect(0,0,w,h);hudPanel(c,w,'BRICK BREAKER',`LV ${stage}/1000`,`SCORE ${score}`,`LIVES ${lives('brick')}`);for(const b of bricks){if(b.dead)continue;const col=b.hp>=3?'#b66d5b':b.hp===2?'#c49756':'#6594a3';gRound(c,b.x,b.y,b.w,b.h,5,col,'rgba(255,255,255,.3)',1)}gRound(c,paddle.x,paddle.y,paddle.w,paddle.h,8,performance.now()<wideUntil?'#81afbe':'#e1e6eb');c.fillStyle='#fff';balls.forEach(b=>{c.beginPath();c.arc(b.x,b.y,b.r,0,Math.PI*2);c.fill()});if(over)overlay(c,w,h,'GAME OVER',lives('brick')<=0?`Next life ${lifeCountdown('brick')}`:`Tap to retry level ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'BOARD CLEARED • BONUS LOCKED')},reset:setup,destroy(){cleanup()},booster(t){const n=performance.now();if(t==='shield'){addLives('brick',1);return true}if(t==='slow'){slowUntil=n+12000;return true}if(t==='power'){wideUntil=n+14000;const cx=paddle.x+paddle.w/2;paddle.w=170;paddle.x=clamp(cx-85,8,w-178);multi(2);return true}if(t==='speed'){balls.forEach(b=>{b.vx*=1.25;b.vy*=1.25});return true}if(t==='multi'){multi(4);return true}return false}}
}

// ---------- 05 Engineer Match ----------
function MatchGame(stage){
  const TYPES=7,colors=['#5c8eaa','#c2845b','#719d77','#c2a65b','#8b78a5','#5c9e96','#b56f77'],icons=['⚙','🔧','⚡','🔩','🛠','🔨','🔌'];
  let w=1,h=1,rows=6,cols=6,cell=40,left=0,top=116,board=[],selected=null,moves=0,targetMoves=0,targetType=0,targetCount=0,collected=0,targetScore=0,score=0,over=lives('match')<=0,cleared=false,down=null;
  const R=rng(seedHash('match',stage));
  function cfg(){const v=(stage-1)%10;[rows,cols]=[[5,5],[6,6],[6,7],[7,6],[7,7],[6,8],[8,6],[7,8],[8,8],[9,9]][v];targetMoves=Math.max(15,27-Math.min(8,Math.floor(stageWorld(stage)/13))+(stageLocal(stage)%3));moves=targetMoves;targetType=(stage*3+stageWorld(stage)*5+stageLocal(stage))%TYPES;targetCount=10+stageLocal(stage)*2+Math.min(12,Math.floor(stageWorld(stage)/8));targetScore=750+stageWorld(stage)*32+stageLocal(stage)*70}
  function buildOnce(){board=Array.from({length:rows},()=>Array(cols).fill(0));for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let v,g=0;do{v=Math.floor(R()*TYPES);g++}while(g<40&&((c>=2&&board[r][c-1]===v&&board[r][c-2]===v)||(r>=2&&board[r-1][c]===v&&board[r-2][c]===v)));board[r][c]=v}}
  function scan(){const mark=Array.from({length:rows},()=>Array(cols).fill(false));let any=false;for(let r=0;r<rows;r++){let s=0;while(s<cols){let e=s+1;while(e<cols&&board[r][e]===board[r][s])e++;if(e-s>=3){any=true;for(let c=s;c<e;c++)mark[r][c]=true}s=e}}for(let c=0;c<cols;c++){let s=0;while(s<rows){let e=s+1;while(e<rows&&board[e][c]===board[s][c])e++;if(e-s>=3){any=true;for(let r=s;r<e;r++)mark[r][c]=true}s=e}}return{any,mark}}
  function swap(a,b){const t=board[a.r][a.c];board[a.r][a.c]=board[b.r][b.c];board[b.r][b.c]=t}
  function hasMove(){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){for(const [dr,dc] of [[0,1],[1,0]]){const rr=r+dr,cc=c+dc;if(rr>=rows||cc>=cols)continue;const a={r,c},b={r:rr,c:cc};swap(a,b);const ok=scan().any;swap(a,b);if(ok)return true}}return false}
  function make(){for(let tries=0;tries<80;tries++){buildOnce();if(!scan().any&&hasMove())return}buildOnce();if(rows>=2&&cols>=3){board[0][0]=0;board[0][1]=1;board[0][2]=0;board[1][1]=0}}
  function reshuffle(){for(let tries=0;tries<50;tries++){const flat=board.flat();for(let i=flat.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[flat[i],flat[j]]=[flat[j],flat[i]]}for(let r=0,k=0;r<rows;r++)for(let c=0;c<cols;c++,k++)board[r][c]=flat[k];if(!scan().any&&hasMove())return}make()}
  function resolve(){let casc=0,res=scan();while(res.any&&casc<10){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(res.mark[r][c]){if(board[r][c]===targetType)collected++;score+=35+15*casc;board[r][c]=-1}for(let c=0;c<cols;c++){const vals=[];for(let r=rows-1;r>=0;r--)if(board[r][c]>=0)vals.push(board[r][c]);for(let r=rows-1,i=0;r>=0;r--,i++)board[r][c]=i<vals.length?vals[i]:Math.floor(R()*TYPES)}casc++;res=scan()}if(collected>=targetCount&&score>=targetScore&&!cleared){cleared=true;saveHigh('match',score);claimClear('match',stage,score)}else if(moves<=0&&!cleared){over=true;consumeLife('match');saveHigh('match',score)}else if(!cleared&&!over&&!hasMove())reshuffle()}
  function cellAt(p){const c=Math.floor((p.x-left)/cell),r=Math.floor((p.y-top)/cell);return r>=0&&r<rows&&c>=0&&c<cols?{r,c}:null}
  function attempt(a,b){if(!a||!b||over||cleared)return;const d=Math.abs(a.r-b.r)+Math.abs(a.c-b.c);if(d!==1){selected=b;return}swap(a,b);if(!scan().any){swap(a,b);selected=b}else{moves=Math.max(0,moves-1);selected=null;resolve()}}
  function pointerDown(e){if(over){if(lives('match')>0)reset();return}if(cleared)return;e.preventDefault();const p=pointerPos(e),a=cellAt(p);if(!a)return;down={...p,...a,id:e.pointerId};canvas.setPointerCapture?.(e.pointerId)}
  function pointerUp(e){if(!down)return;e.preventDefault();const p=pointerPos(e),start=down;down=null;canvas.releasePointerCapture?.(e.pointerId);const dx=p.x-start.x,dy=p.y-start.y,dist=Math.hypot(dx,dy);if(dist>Math.max(12,cell*.22)){const b={r:start.r+(Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0),c:start.c+(Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0)};if(b.r>=0&&b.r<rows&&b.c>=0&&b.c<cols)attempt({r:start.r,c:start.c},b);return}const a={r:start.r,c:start.c};if(!selected){selected=a;return}attempt(selected,a)}
  function pointerCancel(){down=null}
  canvas.addEventListener('pointerdown',pointerDown,{passive:false});canvas.addEventListener('pointerup',pointerUp,{passive:false});canvas.addEventListener('pointercancel',pointerCancel);
  function reset(){cfg();collected=0;score=0;over=lives('match')<=0;cleared=false;selected=null;down=null;make()}
  reset();
  return{
    resize(W,H){w=Math.max(220,W);h=Math.max(300,H);cell=Math.max(20,Math.min((w-18)/cols,(h-150)/rows));left=(w-cell*cols)/2;top=116},
    update(){},
    draw(c){c.fillStyle='#14191f';c.fillRect(0,0,w,h);hudPanel(c,w,'ENGINEER MATCH',`STAGE ${stage}/1000`,`MOVES ${moves}/${targetMoves}`,`SCORE ${score}/${targetScore}`);text(c,`${icons[targetType]} ${collected}/${targetCount}`,20,84,12,'#eaf0f4');text(c,'TAP 2 TILES OR SWIPE',w-20,84,9,'#aeb8c2','right');const prog=Math.min(collected/Math.max(1,targetCount),score/Math.max(1,targetScore));gRound(c,w*.5,75,w*.43,8,4,'#414853');gRound(c,w*.5,75,w*.43*clamp(prog,0,1),8,4,getComputedStyle(app).getPropertyValue('--text').trim()||'#fff');gRound(c,left-5,top-5,cols*cell+10,rows*cell+10,18,'#1f252c');for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){const x=left+col*cell+cell/2,y=top+r*cell+cell/2,half=cell*.405,v=board[r][col];gRound(c,x-half,y-half,half*2,half*2,8,colors[v]||'#65717c');text(c,icons[v]||'•',x,y+cell*.12,Math.max(14,cell*.32),'#eef3f6','center');if(selected&&selected.r===r&&selected.c===col)gRound(c,x-half-2,y-half-2,half*2+4,half*2+4,10,null,getComputedStyle(app).getPropertyValue('--text').trim()||'#fff',3)}if(over)overlay(c,w,h,'OUT OF MOVES',lives('match')<=0?`NEXT LIFE ${lifeCountdown('match')}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'ENGINEERING COMPLETE • ROADMAP NEXT')},
    reset,
    destroy(){canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel)},
    booster(t){if(t==='shield'){moves+=4;return true}if(t==='slow'){moves+=2;return true}if(t==='power'){collected=Math.min(targetCount,collected+4);score+=350;if(collected>=targetCount&&score>=targetScore&&!cleared){cleared=true;claimClear('match',stage,score)}return true}return false}
  }
}

// ---------- shared rotate-network puzzle ----------
const N=1,E=2,S=4,W=8;function rotMask(m,k=1){for(let i=0;i<k;i++)m=((m<<1)&15)|((m&8)?1:0);return m}function opposite(d){return d===N?S:d===S?N:d===E?W:E}
function NetworkGame(stage,id,title,isCircuit=false){
  let w=1,h=1,rows=5,cols=5,cell=50,left=0,top=116,masks=[],rots=[],solution=[],blocked=[],source={r:0,c:0},targets=[],moves=0,maxMoves=0,score=0,reachable=[],over=lives(id)<=0,cleared=false;const R=rng(seedHash(id,stage));
  function config(){const v=(stage-1)%8;[rows,cols]=[[5,5],[5,6],[6,5],[6,6],[6,7],[7,6],[7,7],[stageWorld(stage)>=25?8:7,stageWorld(stage)>=25?8:7]][v];source={r:Math.floor(R()*rows),c:0};targets=[{r:Math.floor(R()*rows),c:cols-1}];if(stage>=200)targets.push({r:rows-1,c:1+Math.floor(R()*Math.max(1,cols-2))});if(stage>=600)targets.push({r:0,c:1+Math.floor(R()*Math.max(1,cols-2))});masks=Array.from({length:rows},()=>Array(cols).fill(0));solution=Array.from({length:rows},()=>Array(cols).fill(0));rots=Array.from({length:rows},()=>Array(cols).fill(0));blocked=Array.from({length:rows},()=>Array(cols).fill(false));const add=(a,b)=>{let d;if(b.r<a.r)d=N;else if(b.r>a.r)d=S;else if(b.c>a.c)d=E;else d=W;solution[a.r][a.c]|=d;solution[b.r][b.c]|=opposite(d)};for(const t of targets){let r=source.r,c=source.c;while(c<t.c){const next={r,c:c+1};add({r,c},next);c++}while(r!==t.r){const nr=r+(r<t.r?1:-1),next={r:nr,c};add({r,c},next);r=nr}}for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){masks[r][c]=solution[r][c]||[N|S,N|E,N|E|S,E|W,N|E|S|W][Math.floor(R()*5)];if((r===source.r&&c===source.c)||targets.some(t=>t.r===r&&t.c===c))rots[r][c]=0;else{rots[r][c]=Math.floor(R()*4);if(solution[r][c]&&rotMask(masks[r][c],rots[r][c])===solution[r][c])rots[r][c]=(rots[r][c]+1)%4}}maxMoves=Math.max(18,rows*cols+8-Math.min(12,Math.floor(stageWorld(stage)/8)));moves=maxMoves;score=0;over=lives(id)<=0;cleared=false;recompute()}
  function current(r,c){return rotMask(masks[r][c],rots[r][c])}
  function recompute(){reachable=Array.from({length:rows},()=>Array(cols).fill(false));const q=[source];reachable[source.r][source.c]=true;while(q.length){const a=q.shift(),m=current(a.r,a.c);[[N,-1,0],[E,0,1],[S,1,0],[W,0,-1]].forEach(([d,dr,dc])=>{if(!(m&d))return;const rr=a.r+dr,cc=a.c+dc;if(rr<0||rr>=rows||cc<0||cc>=cols||blocked[rr][cc])return;if(!(current(rr,cc)&opposite(d)))return;if(!reachable[rr][cc]){reachable[rr][cc]=true;q.push({r:rr,c:cc})}})}const connected=targets.filter(t=>reachable[t.r][t.c]).length;score=connected*250+(maxMoves-moves)*5;if(connected===targets.length&&!cleared){cleared=true;claimClear(id,stage,score)}else if(moves<=0&&!cleared){over=true;consumeLife(id)}}
  function tap(p){if(over){if(lives(id)>0)config();return}if(cleared)return;const c=Math.floor((p.x-left)/cell),r=Math.floor((p.y-top)/cell);if(r<0||r>=rows||c<0||c>=cols||(r===source.r&&c===source.c)||targets.some(t=>t.r===r&&t.c===c))return;rots[r][c]=(rots[r][c]+1)%4;moves--;recompute()}
  const cleanup=canvasPointer(tap);config();
  return{resize(W,H){w=W;h=H;cell=Math.min((w-20)/cols,(h-154)/rows);left=(w-cell*cols)/2;top=116},update(){},draw(c){c.fillStyle=isCircuit?'#14191f':'#12171c';c.fillRect(0,0,w,h);hudPanel(c,w,title,`STAGE ${stage}/1000`,`MOVES ${moves}/${maxMoves}`,`SCORE ${score}`);text(c,`${rows}×${cols} ${isCircuit?'CIRCUIT':'NETWORK'}`,20,82,10,'#d3dbe2');gRound(c,left-8,top-8,cols*cell+16,rows*cell+16,14,isCircuit?'#252a30':'#303539','#5b636a',2);for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)drawNetworkTile(c,left+col*cell+cell/2,top+r*cell+cell/2,cell,current(r,col),reachable[r][col],isCircuit,r===source.r&&col===source.c,targets.some(t=>t.r===r&&t.c===col));if(over)overlay(c,w,h,isCircuit?'CIRCUIT FAILED':'PRESSURE LOST',lives(id)<=0?`NEXT LIFE ${lifeCountdown(id)}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,isCircuit?'ALL LOADS POWERED • ROADMAP NEXT':'ALL OUTLETS CONNECTED • ROADMAP NEXT')},reset:config,destroy(){cleanup()},booster(t){if(t==='shield'){moves+=4;return true}if(t==='slow'){moves+=2;return true}if(t==='power'){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(solution[r][c]){for(let k=0;k<4;k++)if(rotMask(masks[r][c],k)===solution[r][c])rots[r][c]=k}recompute();return true}return false}}
}
function drawNetworkTile(c,cx,cy,cell,mask,on,circuit,source,target){const arm=cell*.42;c.strokeStyle=circuit?(on?'#e5c860':'#8e959d'):(on?'#4ba6cc':'#9da4a6');c.lineWidth=Math.max(7,cell*.14);c.lineCap='round';c.beginPath();if(mask&N){c.moveTo(cx,cy);c.lineTo(cx,cy-arm)}if(mask&E){c.moveTo(cx,cy);c.lineTo(cx+arm,cy)}if(mask&S){c.moveTo(cx,cy);c.lineTo(cx,cy+arm)}if(mask&W){c.moveTo(cx,cy);c.lineTo(cx-arm,cy)}c.stroke();c.fillStyle=circuit?(on?'#ffe379':'#666e77'):(on?'#52b1d6':'#737c80');c.beginPath();c.arc(cx,cy,Math.max(6,cell*.12),0,Math.PI*2);c.fill();if(source){c.fillStyle='#db9e3e';c.fillRect(cx-8,cy-8,16,16)}if(target){c.strokeStyle=on?'#85e59f':'#d9dde0';c.lineWidth=3;c.strokeRect(cx-9,cy-11,18,22)}}
function PipeGame(stage){return NetworkGame(stage,'pipe','PIPE FLOW',false)}
function CircuitGame(stage){return NetworkGame(stage,'circuit','CIRCUIT CONNECT',true)}

// ---------- 07 Crane Stack ----------
function CraneGame(stage){
  let w=1,h=1,platformY=0,pLeft=0,pRight=0,craneX=40,dir=1,speed=110,active=null,tower=[],placed=0,target=5,maxMiss=3,miss=0,score=0,last=performance.now(),over=lives('crane')<=0,cleared=false,slowUntil=0;const R=rng(seedHash('crane',stage));const world=stageWorld(stage),local=stageLocal(stage);let cleanup=()=>{};
  function spawn(){if(over||cleared||!w)return;const min=Math.max(44,w*.13),max=Math.max(min,w*(.26-Math.min(.07,world/1600)));active={x:craneX,y:100,w:min+R()*(max-min),h:Math.max(20,Math.min(34,h*.04)),vy:0,fall:false,col:['#c88f4e','#5b93af','#78a279','#9b81b3','#b76f76'][(placed+stage)%5]}}
  function setup(){target=5+Math.min(7,Math.floor((world-1)/10))+(local%3);maxMiss=3;miss=0;placed=0;score=0;tower=[];speed=105+Math.min(170,world*2)+(local%4)*14;over=lives('crane')<=0;cleared=false;active=null;craneX=40;dir=1;last=performance.now();spawn()}
  function drop(){if(active&&!active.fall&&!over&&!cleared)active.fall=true}
  cleanup=canvasPointer(()=>{if(over){if(lives('crane')>0)setup()}else drop()});window.onkeydown=e=>{if(e.code==='Space')drop()};
  function settle(){if(!active)return;const below=tower.at(-1);const sl=below?below.x-below.w/2:pLeft,sr=below?below.x+below.w/2:pRight;const al=active.x-active.w/2,ar=active.x+active.w/2,ol=Math.max(sl,al),or=Math.min(sr,ar),ov=or-ol;if(ov<active.w*.22){miss++;if(miss>=maxMiss){consumeLife('crane');over=true;saveHigh('crane',score)}active=null;spawn();return}active.x=(ol+or)/2;active.w=ov;tower.push(active);placed++;score+=Math.round(100+ov*1.2);active=null;if(placed>=target&&!cleared){cleared=true;claimClear('crane',stage,score);return}spawn()}
  setup();
  return{resize(W,H){const first=w<=2||h<=2;w=W;h=H;platformY=h-88;const width=w*(.58-Math.min(.18,world/700));pLeft=(w-width)/2;pRight=pLeft+width;if(first)setup();else if(!active&&!over&&!cleared)spawn()},update(now){if(over||cleared)return;const dt=Math.min(.035,(now-last)/1000);last=now;const sp=speed*(now<slowUntil?.52:1);if(active&&!active.fall){craneX+=dir*sp*dt;const l=26+active.w/2,r=w-26-active.w/2;if(craneX<l){craneX=l;dir=1}if(craneX>r){craneX=r;dir=-1}active.x=craneX;active.y=100}else if(active){active.vy+=720*dt;active.y+=active.vy*dt;const targetY=(tower.length? tower.at(-1).y-tower.at(-1).h/2:platformY)-active.h/2;if(active.y>=targetY){active.y=targetY;settle()}}},draw(c){c.fillStyle='#14191f';c.fillRect(0,0,w,h);hudPanel(c,w,'CRANE STACK',`STAGE ${stage}/1000`,`BLOCKS ${placed}/${target}`,`MISS ${miss}/${maxMiss}`);c.strokeStyle='#626c76';c.lineWidth=5;c.beginPath();c.moveTo(28,112);c.lineTo(w-28,112);c.stroke();c.strokeStyle='#8b969f';c.lineWidth=3;c.beginPath();c.moveTo(craneX,112);c.lineTo(craneX,active?active.y-active.h/2:150);c.stroke();gRound(c,pLeft,platformY,pRight-pLeft,14,6,'#6f777d');tower.forEach(b=>gRound(c,b.x-b.w/2,b.y-b.h/2,b.w,b.h,5,b.col,'rgba(255,255,255,.25)',1));if(active)gRound(c,active.x-active.w/2,active.y-active.h/2,active.w,active.h,5,active.col,'rgba(255,255,255,.28)',1);if(over)overlay(c,w,h,'TOWER FAILED',lives('crane')<=0?`NEXT LIFE ${lifeCountdown('crane')}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'STACK COMPLETE • ROADMAP NEXT')},reset:setup,destroy(){cleanup();window.onkeydown=null},booster(t){if(t==='shield'){maxMiss++;return true}if(t==='slow'){slowUntil=performance.now()+12000;return true}if(t==='power'){if(active){active.w=Math.min(active.w*1.35,w*.38);return true}return false}return false}}
}

// ---------- 09 Traffic Controller ----------
function TrafficGame(stage){
  let w=1,h=1,cx=0,cy=0,roadW=160,cars=[],nsGreen=true,target=12,passed=0,score=0,spawn=.45,spawnEvery=1,last=performance.now(),over=lives('traffic')<=0,cleared=false,slowUntil=0,autoUntil=0,shield=0;const R=rng(seedHash('traffic',stage)),world=stageWorld(stage),local=stageLocal(stage);const cleanup=canvasPointer(()=>{if(over){if(lives('traffic')>0)setup();return}nsGreen=!nsGreen});
  function setup(){target=12+local*2+Math.min(24,Math.floor(world/4));spawnEvery=Math.max(.5,1.35-world*.007-local*.025);cars=[];nsGreen=true;passed=0;score=0;spawn=.45;over=lives('traffic')<=0;cleared=false;last=performance.now()}
  function addCar(){if(cars.length>14)return;const d=Math.floor(R()*4);if(cars.some(c=>c.d===d&&c.pos<roadW*.7))return;cars.push({d,pos:-roadW*.65,s:105+Math.min(120,world*1.35)*(0.88+R()*.25),len:30+R()*18,col:['#bc6256','#cda052','#739169','#8c76a8'][Math.floor(R()*4)],comm:false})}
  function xy(car){const p=car.pos;if(car.d===0)return{x:cx-roadW*.22,y:cy-roadW*.5+p};if(car.d===1)return{x:cx+roadW*.22,y:cy+roadW*.5-p};if(car.d===2)return{x:cx-roadW*.5+p,y:cy+roadW*.22};return{x:cx+roadW*.5-p,y:cy-roadW*.22}}
  function collision(){for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){const a=xy(cars[i]),b=xy(cars[j]);const av=cars[i].d<=1,bv=cars[j].d<=1;if(av===bv)continue;if(Math.abs(a.x-b.x)<18&&Math.abs(a.y-b.y)<18)return true}return false}
  setup();
  return{resize(W,H){w=W;h=H;cx=w/2;cy=h*.55;roadW=Math.min(w*.42,180)},update(now){if(over||cleared)return;const dt=Math.min(.035,(now-last)/1000);last=now;if(now<autoUntil){const nv=cars.filter(c=>c.d<=1&&c.pos<0).length,ev=cars.filter(c=>c.d>1&&c.pos<0).length;if(nv>ev+1)nsGreen=true;else if(ev>nv+1)nsGreen=false}spawn-=dt;if(spawn<=0){addCar();spawn=spawnEvery*(.78+R()*.48)}const sf=now<slowUntil?.55:1;for(const car of cars){const green=car.d<=1?nsGreen:!nsGreen,stop=-(car.len/2+5);if(!car.comm){if(green){car.pos+=car.s*sf*dt;if(car.pos>stop+2)car.comm=true}else if(car.pos>stop){car.comm=true;car.pos+=car.s*sf*dt}else car.pos=Math.min(car.pos+car.s*sf*dt,stop)}else car.pos+=car.s*sf*dt}if(collision()){if(shield>0){shield--;cars=cars.filter(c=>Math.abs(c.pos)>roadW*.25);score=Math.max(0,score-150)}else{consumeLife('traffic');over=true;saveHigh('traffic',score);return}}const exit=Math.max(w,h)+roadW;for(let i=cars.length-1;i>=0;i--)if(cars[i].pos>exit){cars.splice(i,1);passed++;score+=100;if(passed>=target){cleared=true;claimClear('traffic',stage,score);return}}},draw(c){c.fillStyle='#12181c';c.fillRect(0,0,w,h);hudPanel(c,w,'TRAFFIC CONTROLLER',`STAGE ${stage}/1000`,`PASS ${passed}/${target}`,`SCORE ${score}`);c.fillStyle='#454b50';c.fillRect(cx-roadW/2,105,roadW,h-105);c.fillRect(0,cy-roadW/2,w,roadW);c.fillStyle='#e7e7dd';c.fillRect(cx-2,105,4,h-105);c.fillRect(0,cy-2,w,4);c.fillStyle=nsGreen?'#69bd8c':'#d75c57';c.beginPath();c.arc(cx-20,cy-20,8,0,Math.PI*2);c.fill();c.fillStyle=!nsGreen?'#69bd8c':'#d75c57';c.beginPath();c.arc(cx+20,cy+20,8,0,Math.PI*2);c.fill();cars.forEach(car=>{const q=xy(car);c.save();c.translate(q.x,q.y);if(car.d<=1)c.rotate(Math.PI/2);gRound(c,-car.len/2,-8,car.len,16,5,car.col);c.restore()});if(over)overlay(c,w,h,'COLLISION!',lives('traffic')<=0?`NEXT LIFE ${lifeCountdown('traffic')}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'JUNCTION CLEARED • ROADMAP NEXT')},reset:setup,destroy(){cleanup()},booster(t){if(t==='shield'){shield++;return true}if(t==='slow'){slowUntil=performance.now()+12000;return true}if(t==='power'){autoUntil=performance.now()+15000;return true}return false}}
}

// ---------- 10 Gear Factory ----------
function GearGame(stage){
  const teeth=[24,36,48];let w=1,h=1,slots=3,solution=[],current=[],moves=0,maxMoves=0,score=0,targetRpm=120,targetCW=true,over=lives('gear')<=0,cleared=false,phase=0,last=performance.now(),xs=[],my=0,shield=0;const R=rng(seedHash('gear',stage));
  function setup(){if(stage<=5)slots=3;else if(stage<=15)slots=4;else if(stage<=35)slots=5;else if(stage<=70)slots=6;else slots=7;if(stage>20&&stage%9===0)slots=Math.max(4,slots-1);maxMoves=Math.max(10,slots*4+4-Math.min(7,Math.floor(stageWorld(stage)/15)));moves=maxMoves;solution=Array.from({length:slots},()=>Math.floor(R()*3));current=solution.map(v=>(v+1+Math.floor(R()*2))%3);targetRpm=Math.max(20,Math.round(120*teeth[solution[0]]/teeth[solution[slots-1]]));targetCW=((slots-1)&1)===0;score=0;over=lives('gear')<=0;cleared=false;phase=0;last=performance.now()}
  function currentRpm(){return slots?Math.max(20,Math.round(120*teeth[current[0]]/Math.max(1,teeth[current[slots-1]]))):0}
  function currentCW(){return ((slots-1)&1)===0}
  function solved(){return current.every((v,i)=>v===solution[i])}
  function tap(p){if(over){if(lives('gear')>0)setup();return}if(cleared)return;let best=-1,dist=1e9;xs.forEach((x,i)=>{const d=Math.abs(p.x-x);if(d<dist){dist=d;best=i}});if(best<0||Math.abs(p.y-my)>120)return;current[best]=(current[best]+1)%3;moves--;score=Math.max(0,score+35);if(solved()){cleared=true;score+=700+stage*4;claimClear('gear',stage,score)}else if(moves<=0){if(shield>0){shield--;moves+=3}else{over=true;consumeLife('gear')}}}
  const cleanup=canvasPointer(tap);setup();
  return{resize(W,H){w=Math.max(220,W);h=Math.max(300,H);my=h*.56;xs=Array.from({length:slots},(_,i)=>42+(w-84)*(slots===1?.5:i/(slots-1)))},update(now){const dt=Math.min(.04,Math.max(.001,(now-last)/1000));last=now;phase+=dt*(solved()?2.2:.45)},draw(c){const liveRpm=currentRpm(),liveCW=currentCW();c.fillStyle='#16181b';c.fillRect(0,0,w,h);hudPanel(c,w,'GEAR FACTORY',`STAGE ${stage}/1000`,`MOVES ${moves}/${maxMoves}`,`SCORE ${score}`);text(c,`TARGET ${targetRpm} RPM • ${targetCW?'CW':'CCW'}`,w/2,82,12,'#d7dfe6','center');gRound(c,18,my-105,w-36,210,16,'#2c2f33','#555b61',2);c.strokeStyle='#687078';c.lineWidth=8;c.beginPath();c.moveTo(xs[0],my);c.lineTo(xs.at(-1),my);c.stroke();for(let i=0;i<slots;i++){const r=[28,38,48][current[i]],teethN=teeth[current[i]];drawGear(c,xs[i],my,r,teethN,phase*(i%2?-1:1),i===0?'#d39f58':i===slots-1?'#7da7bb':'#89939d');text(c,`${teethN}T`,xs[i],my+5,10,'#1a1e22','center',900)}drawGearGauge(c,w/2,Math.max(150,my-185),liveRpm,targetRpm,liveCW,cleared);if(over)overlay(c,w,h,'GEAR TRAIN FAILED',lives('gear')<=0?`NEXT LIFE ${lifeCountdown('gear')}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'RPM & DIRECTION MATCHED • ROADMAP NEXT')},reset:setup,destroy(){cleanup()},booster(t){if(t==='shield'){shield++;return true}if(t==='slow'){moves+=2;return true}if(t==='power'){current=solution.slice();cleared=true;score+=900;claimClear('gear',stage,score);return true}return false}}
}
function drawGear(c,x,y,r,n,phase,col){c.save();c.translate(x,y);c.rotate(phase);c.fillStyle=col;c.beginPath();for(let i=0;i<n*2;i++){const a=i*Math.PI/n,rr=i%2===0?r:r*.82;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();c.fillStyle='#2b3035';c.beginPath();c.arc(0,0,r*.34,0,Math.PI*2);c.fill();c.restore()}
function drawGearGauge(c,x,y,currentRpm,targetRpm,cw,locked){const r=54;c.fillStyle='#1f2327';c.beginPath();c.arc(x,y,r+10,0,Math.PI*2);c.fill();c.strokeStyle='#484e54';c.lineWidth=7;c.lineCap='round';c.beginPath();c.arc(x,y,r,140*Math.PI/180,400*Math.PI/180);c.stroke();const angle=rpm=>((140+clamp(rpm,0,300)/300*260)*Math.PI/180);const ta=angle(targetRpm);c.strokeStyle='#c59945';c.lineWidth=3;c.beginPath();c.moveTo(x+Math.cos(ta)*(r-12),y+Math.sin(ta)*(r-12));c.lineTo(x+Math.cos(ta)*r,y+Math.sin(ta)*r);c.stroke();for(let rpm=0;rpm<=300;rpm+=50){const a=angle(rpm),len=rpm%100===0?8:5;c.strokeStyle='#7d858d';c.lineWidth=2;c.beginPath();c.moveTo(x+Math.cos(a)*(r-len),y+Math.sin(a)*(r-len));c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke()}const a=angle(currentRpm);c.strokeStyle=locked?'#71e495':'#e15c4e';c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72);c.stroke();c.fillStyle='#d3d8dc';c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();text(c,`${Math.round(currentRpm)}`,x,y+18,15,locked?'#71e495':'#e8edf1','center',900);text(c,'CURRENT RPM',x,y+32,8,'#aeb6bd','center');text(c,cw?'OUTPUT CW':'OUTPUT CCW',x,y+r+18,9,'#bfc7cd','center');text(c,`TARGET ${targetRpm}`,x,y-r-10,9,'#d5bd70','center')}


// ---------- 11 Arrow Remove ----------
function ArrowGame(stage){
  const U=0,Rt=1,D=2,L=3,dr=[-1,0,1,0],dc=[0,1,0,-1];let w=1,h=1,grid=6,cell=40,left=0,top=118,pieces=[],remaining=0,mistakes=0,maxMist=4,score=0,over=lives('arrow')<=0,cleared=false,removing=null,removeAt=0,shake=null,shakeAt=0,hint=null,hintUntil=0;const Rand=rng(seedHash('arrow',stage));
  function inside(r,c){return r>=0&&r<grid&&c>=0&&c<grid}function contains(p,r,c){return p.cells.some(q=>q.r===r&&q.c===c)}function turn(d,t){return(d+t+4)%4}
  function build(type){for(let tries=0;tries<80;tries++){let rr=Math.floor(Rand()*grid),cc=Math.floor(Rand()*grid),dir=Math.floor(Rand()*4);const p={cells:[{r:rr,c:cc}],dir,active:true,type};const maxSeg=stage<20?2:stage<120?3:4;let turns,lengths;if(type===0){turns=[0];lengths=[2+Math.floor(Rand()*Math.max(1,maxSeg))]}else if(type===1){const t=Rand()<.5?1:-1;turns=[0,t];lengths=[1+Math.floor(Rand()*maxSeg),1+Math.floor(Rand()*maxSeg)]}else if(type===2){const t=Rand()<.5?1:-1;turns=[0,t,t];lengths=[1+Math.floor(Rand()*maxSeg),1+Math.floor(Rand()*maxSeg),1+Math.floor(Rand()*maxSeg)]}else if(type===3){const t=Rand()<.5?1:-1;turns=[0,t,-t];lengths=[1+Math.floor(Rand()*maxSeg),1+Math.floor(Rand()*maxSeg),1+Math.floor(Rand()*maxSeg)]}else if(type===4){const t=Rand()<.5?1:-1;turns=[0,t,-t,t];lengths=[1+Math.floor(Rand()*2),1+Math.floor(Rand()*2),1+Math.floor(Rand()*2),1+Math.floor(Rand()*2)]}else{const t=Rand()<.5?1:-1;turns=[0,t,-t,t,-t];lengths=[1+Math.floor(Rand()*Math.min(3,maxSeg)),1+Math.floor(Rand()*Math.min(3,maxSeg)),1+Math.floor(Rand()*Math.min(3,maxSeg)),1+Math.floor(Rand()*Math.min(3,maxSeg)),1+Math.floor(Rand()*Math.min(3,maxSeg))]}let d=dir,ok=true;for(let s=0;s<turns.length;s++){if(s>0)d=turn(d,turns[s]);for(let k=0;k<lengths[s];k++){rr+=dr[d];cc+=dc[d];if(!inside(rr,cc)||contains(p,rr,cc)){ok=false;break}p.cells.push({r:rr,c:cc})}if(!ok)break}if(ok&&p.cells.length>=2){p.dir=d;return p}}return null}
  function canSlideAgainst(p,occ){for(let sh=1;sh<=grid+2;sh++){let any=false;for(const q of p.cells){const rr=q.r+dr[p.dir]*sh,cc=q.c+dc[p.dir]*sh;if(inside(rr,cc)){any=true;if(occ[rr][cc])return false}}if(!any)return true}return true}
  function canRemove(p){if(!p?.active)return false;const occ=Array.from({length:grid},()=>Array(grid).fill(false));for(const o of pieces)if(o.active&&o!==p)for(const q of o.cells)occ[q.r][q.c]=true;return canSlideAgainst(p,occ)}
  function gen(){pieces=[];const occ=Array.from({length:grid},()=>Array(grid).fill(false));const unlockedTypes=stage<5?2:stage<20?3:stage<60?4:stage<160?5:6;let desired=stage<=10?8+Math.floor((stage-1)/3):Math.min(24,8+Math.floor(Math.sqrt(stage)*.5)),attempt=0;while(pieces.length<desired&&attempt++<4500){const p=build(Math.floor(Rand()*unlockedTypes));if(!p)continue;if(p.cells.some(q=>occ[q.r][q.c]))continue;if(!canSlideAgainst(p,occ))continue;pieces.push(p);for(const q of p.cells)occ[q.r][q.c]=true}pieces.reverse()}
  function setup(){grid=stage<=10?6:stage<=40?7:stage<=120?8:stage<=300?9:stage<=600?10:11;gen();remaining=pieces.length;mistakes=0;maxMist=stage<80?4:3;score=0;over=lives('arrow')<=0;cleared=false;removing=shake=hint=null}
  function segDist(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,l=vx*vx+vy*vy||1,t=clamp(((px-ax)*vx+(py-ay)*vy)/l,0,1),x=ax+t*vx,y=ay+t*vy;return Math.hypot(px-x,py-y)}
  function pick(p){let best=null,bd=1e9,th=Math.max(18,cell*.3);for(let i=pieces.length-1;i>=0;i--){const x=pieces[i];if(!x.active)continue;let d=1e9;for(let j=0;j<x.cells.length-1;j++){const a=x.cells[j],b=x.cells[j+1];d=Math.min(d,segDist(p.x,p.y,left+(a.c+.5)*cell,top+(a.r+.5)*cell,left+(b.c+.5)*cell,top+(b.r+.5)*cell))}if(d<th&&d<bd){bd=d;best=x}}return best}
  function tap(pos){if(over){if(lives('arrow')>0)setup();return}if(cleared||removing)return;const p=pick(pos);if(!p)return;if(canRemove(p)){removing=p;removeAt=performance.now()}else{mistakes++;shake=p;shakeAt=performance.now();score=Math.max(0,score-45);if(mistakes>=maxMist){over=true;consumeLife('arrow')}}}
  const cleanup=canvasPointer(tap);setup();
  return{resize(W,H){w=W;h=H;cell=Math.min((w-28)/grid,(h-170)/grid);left=(w-cell*grid)/2;top=118},update(now){if(removing&&now-removeAt>=320){removing.active=false;removing=null;remaining--;score+=140+Math.min(300,stage);if(remaining<=0&&!cleared){cleared=true;claimClear('arrow',stage,score)}}if(shake&&now-shakeAt>=340)shake=null;if(hint&&now>hintUntil)hint=null},draw(c,w2,h2,now){c.fillStyle='#15191f';c.fillRect(0,0,w,h);hudPanel(c,w,'ARROW REMOVE',`STAGE ${stage}/1000`,`LEFT ${remaining}`,`MISTAKES ${mistakes}/${maxMist}`);text(c,`${grid}×${grid} • MIXED PATHS`,20,82,10,'#d3dbe2');gRound(c,left-10,top-10,grid*cell+20,grid*cell+20,14,'#ebeff2');c.fillStyle='#bcc2c8';for(let r=0;r<grid;r++)for(let col=0;col<grid;col++){c.beginPath();c.arc(left+(col+.5)*cell,top+(r+.5)*cell,1.3,0,Math.PI*2);c.fill()}for(const p of pieces){if(!p.active&&p!==removing)continue;drawArrowPiece(c,p,now,left,top,cell,w,h,canRemove(p),p===removing?clamp((now-removeAt)/320,0,1):0,p===shake?clamp((now-shakeAt)/340,0,1):0,p===hint&&now<hintUntil)}if(over)overlay(c,w,h,'PATH BLOCKED',lives('arrow')<=0?`NEXT LIFE ${lifeCountdown('arrow')} • OPEN STORE`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'ALL PATHS REMOVED • ROADMAP NEXT')},reset:setup,destroy(){cleanup()},booster(t){if(t==='shield'){maxMist++;return true}if(t==='slow'){maxMist+=2;return true}if(t==='power'){const p=pieces.find(canRemove);if(!p)return false;hint=p;hintUntil=performance.now()+5000;return true}return false}}
}
function drawArrowPiece(c,p,now,left,top,cell,w,h,removable,removeT,shakeT,hinted){let dx=0,dy=0,alpha=1;if(removeT>0){const e=1-Math.pow(1-removeT,3),dist=Math.max(w,h)*1.05*e,dr=[-1,0,1,0],dc=[0,1,0,-1];dx=dc[p.dir]*dist;dy=dr[p.dir]*dist;alpha=1-removeT*.72}if(shakeT>0){const sh=Math.sin(shakeT*Math.PI*8)*7*(1-shakeT);if(p.dir===0||p.dir===2)dx+=sh;else dy+=sh}const pts=p.cells.map(q=>({x:left+(q.c+.5)*cell+dx,y:top+(q.r+.5)*cell+dy}));c.globalAlpha=alpha;c.lineCap='round';c.lineJoin='round';c.strokeStyle='#f5f7f9';c.lineWidth=Math.max(9,cell*.17);c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke();const col=hinted?'#3691ff':shakeT>0?'#dc4d44':removable?'#292e34':'#4d5359';c.strokeStyle=col;c.lineWidth=Math.max(4,cell*.075);c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke();const q=pts.at(-1),a=pts.at(-2);arrowHead(c,q.x,q.y,Math.atan2(q.y-a.y,q.x-a.x),col,Math.max(10,cell*.22));c.globalAlpha=1}

// ---------- 12 Tap Bird ----------
function BirdGame(stage){
  let w=1,h=1,bird={x:0,y:0,vy:0,r:16},pipes=[],spawn=0,score=0,target=8,started=false,over=lives('bird')<=0,cleared=false,last=performance.now(),slowUntil=0,powerUntil=0,activePointer=null;
  const world=stageWorld(stage),local=stageLocal(stage),R=rng(seedHash('bird',stage));
  function setup(){bird={x:w*.28,y:h*.48,vy:0,r:16};pipes=[];spawn=.35;score=0;target=8+local+Math.min(20,Math.floor(world/6));started=false;over=lives('bird')<=0;cleared=false;last=performance.now()}
  function flap(){if(over){if(lives('bird')>0)setup();return}if(cleared)return;bird.vy=-340;if(!started){started=true;last=performance.now()}}
  function pointerDown(e){e.preventDefault();activePointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);flap()}
  function pointerUp(e){if(activePointer===e.pointerId){canvas.releasePointerCapture?.(e.pointerId);activePointer=null}}
  function keyDown(e){if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();flap()}}
  canvas.addEventListener('pointerdown',pointerDown,{passive:false});canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);window.addEventListener('keydown',keyDown,{passive:false});setup();
  return{
    resize(W,H){const oldW=w,oldH=h;w=Math.max(220,W);h=Math.max(300,H);if(oldW>2&&oldH>2&&started){const sx=w/oldW,sy=h/oldH;bird.x*=sx;bird.y*=sy;pipes.forEach(p=>{p.x*=sx;p.w*=sx;p.top*=sy;p.bottom*=sy})}else{bird.x=w*.28;bird.y=h*.48}},
    update(now){if(over||cleared||!started)return;const dt=Math.min(.03,Math.max(.001,(now-last)/1000));last=now;const sf=now<slowUntil?.7:1;bird.vy+=980*dt;bird.y+=bird.vy*dt;spawn-=dt;if(spawn<=0){spawn=Math.max(.85,1.55-world*.004);const playTop=112,playBottom=h-18,maxGap=Math.max(92,playBottom-playTop-70),gap=Math.min(maxGap,Math.max(112,170-world*.45));const minMid=playTop+gap/2+20,maxMid=playBottom-gap/2-20,mid=maxMid>minMid?minMid+R()*(maxMid-minMid):(playTop+playBottom)/2;pipes.push({x:w+40,w:Math.max(56,Math.min(68,w*.16)),top:mid-gap/2,bottom:mid+gap/2,passed:false})}for(const p of pipes)p.x-=(190+world*.9)*sf*dt;pipes=pipes.filter(p=>p.x>-100);for(const p of pipes){if(!p.passed&&p.x+p.w<bird.x){p.passed=true;score++;if(score>=target){cleared=true;claimClear('bird',stage,score);return}}if(bird.x+bird.r>p.x&&bird.x-bird.r<p.x+p.w&&(bird.y-bird.r<p.top||bird.y+bird.r>p.bottom)){if(now<powerUntil){p.x=-120}else{over=true;consumeLife('bird');saveHigh('bird',score);return}}}if(bird.y>h-14||bird.y<108){over=true;consumeLife('bird');saveHigh('bird',score)}},
    draw(c){const grd=c.createLinearGradient(0,0,0,h);grd.addColorStop(0,'#315d7d');grd.addColorStop(1,'#15283d');c.fillStyle=grd;c.fillRect(0,0,w,h);hudPanel(c,w,'TAP BIRD',`STAGE ${stage}/1000`,`GATES ${score}/${target}`,`LIVES ${lives('bird')}`);c.fillStyle='#69bd8c';pipes.forEach(p=>{c.fillRect(p.x,105,p.w,Math.max(0,p.top-105));c.fillRect(p.x,p.bottom,p.w,Math.max(0,h-p.bottom))});c.fillStyle=performance.now()<powerUntil?'#f4e06b':'#ffcb61';c.beginPath();c.arc(bird.x,bird.y,bird.r,0,Math.PI*2);c.fill();c.fillStyle='#202830';c.beginPath();c.arc(bird.x+6,bird.y-5,2.5,0,Math.PI*2);c.fill();if(!started&&!over){text(c,'TAP TO FLAP',w/2,h*.52,24,'#fff','center',900);text(c,'SPACE / ↑ also works',w/2,h*.52+26,10,'#d8e2ea','center')}if(over)overlay(c,w,h,'BIRD DOWN!',lives('bird')<=0?`NEXT LIFE ${lifeCountdown('bird')}`:`Tap to retry Stage ${stage}`);if(cleared)stageClearBanner(c,w,h,`STAGE ${stage} CLEARED!`,'FLIGHT COMPLETE • ROADMAP NEXT')},
    reset:setup,
    destroy(){canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);window.removeEventListener('keydown',keyDown)},
    booster(t){if(t==='shield'){addLives('bird',1);return true}if(t==='slow'){slowUntil=performance.now()+12000;return true}if(t==='power'){powerUntil=performance.now()+12000;return true}return false}
  }
}

// boot
bindUI();renderHome();renderStorePicker();refreshSummaries();setInterval(()=>{if(currentScreen==='homeScreen')renderHome();else refreshSummaries()},30000);
})();
