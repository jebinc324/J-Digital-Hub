(() => {
"use strict";
const $=id=>document.getElementById(id),canvas=$("carromBoard");
if(!canvas)return;
const ctx=canvas.getContext("2d");
if(!ctx){$("carromStatus").textContent="Canvas not supported in this browser.";return;}
const W=800,H=800,POCKETS=[[95,95],[705,95],[95,705],[705,705]];
const LIMIT={min:88,max:712};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let coins=[],striker=null,player=0,scores=[0,0],aim=null,dragging=false,moving=false,won=false,shotPocket=0,shotFoul=false,lastTime=0,frameId=0;
const playerColors=["#68f6f5","#ff80c9"];
function makeCoin(x,y,type){
 return {x,y,r:17,vx:0,vy:0,type,alive:true,mass:1};
}
function start(){
 if(frameId)cancelAnimationFrame(frameId);frameId=0;lastTime=0;
 player=0;scores=[0,0];moving=false;won=false;shotPocket=0;shotFoul=false;aim=null;dragging=false;
 coins=[makeCoin(400,400,"queen")];
 for(let i=0;i<6;i++){const a=i*Math.PI/3;coins.push(makeCoin(400+39*Math.cos(a),400+39*Math.sin(a),i%2?"black":"white"));}
 for(let i=0;i<12;i++){const a=(i+.5)*Math.PI/6;coins.push(makeCoin(400+79*Math.cos(a),400+79*Math.sin(a),i%2?"black":"white"));}
 $("strikerPos").value=50;placeStriker();
 refresh("Player 1 · aim your shot");draw();
}
function placeStriker(){
 const fraction=Number($("strikerPos").value)/100;
 striker={x:225+350*fraction,y:player===0?632:168,r:23,vx:0,vy:0,type:"striker",alive:true,mass:1.75};
 draw();
}
function refresh(message){
 $("p1Score").textContent=scores[0];$("p2Score").textContent=scores[1];
 $("p1Box").classList.toggle("active",player===0);$("p2Box").classList.toggle("active",player===1);
 $("coinCount").textContent=coins.filter(c=>c.alive).length;
 $("carromStatus").textContent=message||("Player "+(player+1)+" · aim your shot");
 const strength=aim?Math.round(clamp(Math.hypot(aim.dx,aim.dy)/165,0,1)*100):0;
 $("powerLabel").textContent=strength+"%";$("powerFill").style.width=strength+"%";
 $("strikerPos").disabled=moving||won;
}
function circle(x,y,r,fill,stroke="",sw=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}}
function line(x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function drawBoard(){
 const wood=ctx.createLinearGradient(0,0,800,800);wood.addColorStop(0,"#533b2a");wood.addColorStop(.48,"#be915a");wood.addColorStop(1,"#493527");
 ctx.fillStyle="#091526";ctx.fillRect(0,0,W,H);
 ctx.fillStyle=wood;ctx.fillRect(30,30,740,740);
 ctx.fillStyle="#f1d6a2";ctx.fillRect(78,78,644,644);
 ctx.strokeStyle="#713a2d";ctx.lineWidth=4;ctx.strokeRect(82,82,636,636);
 ctx.strokeStyle="rgba(91,41,43,.7)";ctx.lineWidth=3;
 for(const r of [68,102]){ctx.beginPath();ctx.arc(400,400,r,0,Math.PI*2);ctx.stroke();}
 circle(400,400,25,"rgba(161,68,62,.07)","#ad6a4e",2);
 for(const [x,y] of POCKETS){circle(x,y,38,"#573c27","#e3b66a",6);circle(x,y,30,"#10151f","#27140d",4);}
 for(const y of [156,644]){
  line(216,y,584,y,"#823b34",3);
  for(const x of [215,585]){circle(x,y,15,"#e7bd81","#893d34",3);circle(x,y,5,"#943e36");}
 }
 for(const x of [156,644]){
  line(x,216,x,584,"#904737",2.5);
  for(const y of [215,585])circle(x,y,13,"#f0c990","#a45340",2);
 }
 for(const [x,y,sx,sy] of [[162,162,1,1],[638,162,-1,1],[162,638,1,-1],[638,638,-1,-1]]){
  line(x,y,x+sx*83,y+sy*83,"rgba(142,62,51,.35)",4);
 }
 ctx.fillStyle="rgba(8,14,32,.6)";ctx.font="800 13px system-ui";ctx.textAlign="center";
 ctx.fillText("J&J CARROM",400,66);ctx.fillText("FREE PLAY",400,747);
}
function drawDisc(ball){
 if(!ball.alive)return;
 ctx.save();ctx.shadowColor="rgba(0,0,0,.4)";ctx.shadowBlur=13;ctx.shadowOffsetY=4;
 let fill;
 if(ball.type==="white")fill="#f7ebcc";
 else if(ball.type==="black")fill="#172334";
 else if(ball.type==="queen")fill="#d44a64";
 else fill="#69eff3";
 circle(ball.x,ball.y,ball.r,fill,"#704c36",2);ctx.restore();
 if(ball.type==="striker"){
  circle(ball.x,ball.y,ball.r-6,"transparent","#25748d",3);
  circle(ball.x,ball.y,5,"#e9fff7");
 }else{
  circle(ball.x,ball.y,ball.r-5,"transparent",ball.type==="black"?"#adbfbe":ball.type==="queen"?"#ffeeb0":"#a2774c",1.8);
  circle(ball.x,ball.y,3,ball.type==="black"?"#cbd7d2":"#9c6750");
 }
}
function draw(){
 ctx.clearRect(0,0,W,H);drawBoard();
 for(const coin of coins)drawDisc(coin);
 if(striker?.alive)drawDisc(striker);
 if(aim&&!moving&&striker?.alive){
  const length=Math.hypot(aim.dx,aim.dy),power=clamp(length/165,0,1);
  if(length>5){
   const endX=striker.x-aim.dx*1.9,endY=striker.y-aim.dy*1.9;
   ctx.setLineDash([13,8]);
   line(striker.x,striker.y,endX,endY,playerColors[player],3+power*3);
   ctx.setLineDash([]);circle(endX,endY,6,playerColors[player]);
   line(striker.x,striker.y,striker.x+aim.dx,striker.y+aim.dy,"#ffde95",2);
  }
 }
 if(won){
  ctx.fillStyle="rgba(7,16,31,.75)";ctx.fillRect(115,340,570,125);
  ctx.textAlign="center";ctx.fillStyle="#ffe6a0";ctx.font="900 34px system-ui";
  const result=scores[0]===scores[1]?"DRAW GAME":("PLAYER "+(scores[0]>scores[1]?1:2)+" WINS!");
  ctx.fillText(result,400,395);ctx.fillStyle="#eafaff";ctx.font="600 17px system-ui";
  ctx.fillText("Use NEW GAME for another match",400,429);
 }
}
function coordinates(e){
 const box=canvas.getBoundingClientRect();
 return {x:(e.clientX-box.left)/box.width*W,y:(e.clientY-box.top)/box.height*H};
}
canvas.addEventListener("pointerdown",e=>{
 if(moving||won||!striker?.alive)return;
 const p=coordinates(e);
 if(dist(p,striker)>67)return;
 e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch(_){}
 dragging=true;aim={dx:0,dy:0};draw();
});
canvas.addEventListener("pointermove",e=>{
 if(!dragging||moving||won)return;
 const p=coordinates(e),dx=p.x-striker.x,dy=p.y-striker.y,k=Math.min(1,165/(Math.hypot(dx,dy)||1));
 aim={dx:dx*k,dy:dy*k};
 refresh();draw();
});
function release(e){
 if(!dragging)return;
 dragging=false;
 const p=coordinates(e),dx=p.x-striker.x,dy=p.y-striker.y,k=Math.min(1,165/(Math.hypot(dx,dy)||1));
 aim={dx:dx*k,dy:dy*k};
 const length=Math.hypot(aim.dx,aim.dy);
 if(length<15){aim=null;refresh();draw();return;}
 striker.vx=-aim.dx*.16;striker.vy=-aim.dy*.16;
 moving=true;shotPocket=0;shotFoul=false;aim=null;
 refresh("Player "+(player+1)+" · shot in motion");
 lastTime=0;frameId=requestAnimationFrame(frame);
}
canvas.addEventListener("pointerup",release);
canvas.addEventListener("pointercancel",()=>{dragging=false;aim=null;refresh();draw();});
$("strikerPos").addEventListener("input",()=>{if(!moving&&!won)placeStriker();});
$("resetCarrom").addEventListener("click",start);
function sink(b){
 b.alive=false;b.vx=0;b.vy=0;
 if(b.type==="striker"){shotFoul=true;scores[player]=Math.max(0,scores[player]-1);}
 else{shotPocket++;scores[player]+=b.type==="queen"?3:1;}
}
function physics(){
 const all=coins.filter(c=>c.alive);
 if(striker?.alive)all.push(striker);
 for(const b of all){
  b.x+=b.vx;b.y+=b.vy;
  for(const [x,y] of POCKETS){if(Math.hypot(b.x-x,b.y-y)<31){sink(b);break;}}
  if(!b.alive)continue;
  if(b.x<LIMIT.min+b.r){b.x=LIMIT.min+b.r;b.vx=Math.abs(b.vx)*.88;}
  if(b.x>LIMIT.max-b.r){b.x=LIMIT.max-b.r;b.vx=-Math.abs(b.vx)*.88;}
  if(b.y<LIMIT.min+b.r){b.y=LIMIT.min+b.r;b.vy=Math.abs(b.vy)*.88;}
  if(b.y>LIMIT.max-b.r){b.y=LIMIT.max-b.r;b.vy=-Math.abs(b.vy)*.88;}
  b.vx*=.985;b.vy*=.985;
  if(Math.hypot(b.vx,b.vy)<.075){b.vx=0;b.vy=0;}
 }
 const alive=all.filter(b=>b.alive);
 for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
  const a=alive[i],b=alive[j];
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),limit=a.r+b.r;
  if(d>=limit)continue;
  const nx=d?dx/d:1,ny=d?dy/d:0,overlap=limit-(d||.0001);
  const total=a.mass+b.mass;
  a.x-=nx*overlap*(b.mass/total);a.y-=ny*overlap*(b.mass/total);
  b.x+=nx*overlap*(a.mass/total);b.y+=ny*overlap*(a.mass/total);
  const along=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(along<0){
   const impulse=-(1+.9)*along/(1/a.mass+1/b.mass);
   a.vx-=impulse*nx/a.mass;a.vy-=impulse*ny/a.mass;
   b.vx+=impulse*nx/b.mass;b.vy+=impulse*ny/b.mass;
  }
 }
 return alive.some(b=>Math.hypot(b.vx,b.vy)>.08);
}
function finish(){
 moving=false;frameId=0;lastTime=0;
 const remaining=coins.filter(c=>c.alive).length;
 if(remaining===0){won=true;refresh(scores[0]===scores[1]?"Draw game!":("Player "+(scores[0]>scores[1]?1:2)+" wins!"));draw();return;}
 const same=shotPocket>0&&!shotFoul;
 if(!same)player=1-player;
 placeStriker();
 refresh(same?("Player "+(player+1)+" scored! Shoot again"):("Player "+(player+1)+" · aim your shot"));
 draw();
}
function frame(now){
 if(!moving)return;
 const elapsed=lastTime?Math.min(34,now-lastTime):16.67;lastTime=now;
 const steps=Math.max(1,Math.min(2,Math.round(elapsed/16.67)));
 let active=false;
 for(let i=0;i<steps;i++)active=physics()||active;
 refresh("Player "+(player+1)+" · shot in motion");
 draw();
 if(active){frameId=requestAnimationFrame(frame);}else finish();
}
start();
})();