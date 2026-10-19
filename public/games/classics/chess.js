(() => {
"use strict";
const $=id=>document.getElementById(id), boardEl=$("chessBoard");
if(!boardEl)return;
const GLYPHS={wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟"};
const VALUE={P:1,N:3,B:3,R:5,Q:9,K:100}, LETTERS="abcdefgh";
const other=c=>c==="w"?"b":"w", at=(r,c)=>r>=0&&r<8&&c>=0&&c<8, name=(r,c)=>LETTERS[c]+(8-r);
function initial(){
 const b=Array.from({length:8},()=>Array(8).fill(null));
 const back=["R","N","B","Q","K","B","N","R"];
 for(let c=0;c<8;c++){b[0][c]="b"+back[c];b[1][c]="bP";b[6][c]="wP";b[7][c]="w"+back[c];}
 return {b,turn:"w",rights:{wK:true,wQ:true,bK:true,bQ:true},ep:null,last:null,moveNumber:0,ended:false};
}
let game=initial(),selected=null,possible=[],log=[],stack=[],bot=false,token=0;
function clone(g){return {b:g.b.map(row=>row.slice()),turn:g.turn,rights:{...g.rights},ep:g.ep?{...g.ep}:null,last:g.last?{...g.last}:null,moveNumber:g.moveNumber,ended:g.ended};}
function kingSquare(g,color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(g.b[r][c]===color+"K")return [r,c];return null;}
function attacked(g,r,c,by){
 const b=g.b,dir=by==="w"?-1:1;
 for(const dc of [-1,1]){const pr=r-dir,pc=c+dc;if(at(pr,pc)&&b[pr][pc]===by+"P")return true;}
 for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){if(at(r+dr,c+dc)&&b[r+dr][c+dc]===by+"N")return true;}
 for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]){
  const diagonal=dr!==0&&dc!==0;
  for(let n=1;n<8;n++){const nr=r+dr*n,nc=c+dc*n;if(!at(nr,nc))break;const p=b[nr][nc];if(!p)continue;if(p[0]===by){if(n===1&&p[1]==="K")return true;if(diagonal&&(p[1]==="B"||p[1]==="Q"))return true;if(!diagonal&&(p[1]==="R"||p[1]==="Q"))return true;}break;}
 }
 return false;
}
function inCheck(g,color){const pos=kingSquare(g,color);return !pos||attacked(g,pos[0],pos[1],other(color));}
function moves(g,r,c){
 const p=g.b[r][c];if(!p)return[];
 const color=p[0],kind=p[1],out=[];
 const add=(nr,nc,flag="")=>{if(!at(nr,nc))return;const q=g.b[nr][nc];if(!q||q[0]!==color&&q[1]!=="K")out.push({fr:r,fc:c,tr:nr,tc:nc,flag});};
 if(kind==="P"){
  const dir=color==="w"?-1:1,start=color==="w"?6:1,nr=r+dir;
  if(at(nr,c)&&!g.b[nr][c]){add(nr,c);if(r===start&&!g.b[r+dir*2][c])add(r+dir*2,c,"double");}
  for(const dc of [-1,1]){const nc=c+dc;if(!at(nr,nc))continue;const q=g.b[nr][nc];if(q&&q[0]!==color&&q[1]!=="K")add(nr,nc);if(g.ep&&g.ep.r===nr&&g.ep.c===nc&&g.b[r][nc]===other(color)+"P")out.push({fr:r,fc:c,tr:nr,tc:nc,flag:"ep"});}
 }else if(kind==="N"){
  for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+dr,c+dc);
 }else if(kind==="K"){
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(r+dr,c+dc);
  const home=color==="w"?7:0;
  if(r===home&&c===4&&!inCheck(g,color)){
   if(g.rights[color+"K"]&&!g.b[home][5]&&!g.b[home][6]&&g.b[home][7]===color+"R"&&!attacked(g,home,5,other(color))&&!attacked(g,home,6,other(color)))out.push({fr:r,fc:c,tr:home,tc:6,flag:"castleK"});
   if(g.rights[color+"Q"]&&!g.b[home][1]&&!g.b[home][2]&&!g.b[home][3]&&g.b[home][0]===color+"R"&&!attacked(g,home,3,other(color))&&!attacked(g,home,2,other(color)))out.push({fr:r,fc:c,tr:home,tc:2,flag:"castleQ"});
  }
 }else{
  let dirs=[];
  if(kind==="R"||kind==="Q")dirs.push([1,0],[-1,0],[0,1],[0,-1]);
  if(kind==="B"||kind==="Q")dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
  for(const [dr,dc] of dirs){for(let n=1;n<8;n++){const nr=r+dr*n,nc=c+dc*n;if(!at(nr,nc))break;const q=g.b[nr][nc];add(nr,nc);if(q)break;}}
 }
 return out;
}
function apply(g,m){
 const p=g.b[m.fr][m.fc],color=p[0],captured=g.b[m.tr][m.tc],kind=p[1];
 if(kind==="K"){g.rights[color+"K"]=false;g.rights[color+"Q"]=false;}
 if(kind==="R"){
  const home=color==="w"?7:0;
  if(m.fr===home&&m.fc===0)g.rights[color+"Q"]=false;
  if(m.fr===home&&m.fc===7)g.rights[color+"K"]=false;
 }
 if(captured&&captured[1]==="R"){
  const home=captured[0]==="w"?7:0;
  if(m.tr===home&&m.tc===0)g.rights[captured[0]+"Q"]=false;
  if(m.tr===home&&m.tc===7)g.rights[captured[0]+"K"]=false;
 }
 g.b[m.tr][m.tc]=p;g.b[m.fr][m.fc]=null;
 if(m.flag==="ep")g.b[m.fr][m.tc]=null;
 if(m.flag==="castleK"){g.b[m.fr][5]=g.b[m.fr][7];g.b[m.fr][7]=null;}
 if(m.flag==="castleQ"){g.b[m.fr][3]=g.b[m.fr][0];g.b[m.fr][0]=null;}
 if(kind==="P"&&(m.tr===0||m.tr===7))g.b[m.tr][m.tc]=color+"Q";
 g.ep=m.flag==="double"?{r:(m.fr+m.tr)/2,c:m.fc}:null;
 g.last={fr:m.fr,fc:m.fc,tr:m.tr,tc:m.tc};
 g.moveNumber++;g.turn=other(color);
 return {capture:!!captured||m.flag==="ep",promoted:kind==="P"&&(m.tr===0||m.tr===7)};
}
function legal(g,color){
 const out=[];
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){if(g.b[r][c]?.[0]!==color)continue;
  for(const m of moves(g,r,c)){const t=clone(g);apply(t,m);if(!inCheck(t,color))out.push(m);}
 }
 return out;
}
function verdict(){
 const viable=legal(game,game.turn);
 if(viable.length)return inCheck(game,game.turn)?(game.turn==="w"?"White":"Black")+" is in check":(game.turn==="w"?"White":"Black")+" to move";
 game.ended=true;
 return inCheck(game,game.turn)?("CHECKMATE · "+(game.turn==="w"?"Black":"White")+" wins!"):"STALEMATE · Draw!";
}
function paint(status){
 boardEl.replaceChildren();
 const checkPos=inCheck(game,game.turn)?kingSquare(game,game.turn):null;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const p=game.b[r][c],sq=document.createElement("button");sq.type="button";
  sq.className="square "+((r+c)%2?"dark":"light");
  if(game.last&&((game.last.fr===r&&game.last.fc===c)||(game.last.tr===r&&game.last.tc===c)))sq.classList.add("last");
  if(selected?.r===r&&selected?.c===c)sq.classList.add("selected");
  const target=possible.find(m=>m.tr===r&&m.tc===c);
  if(target){sq.classList.add("target");if(p)sq.classList.add("capture");}
  if(checkPos&&checkPos[0]===r&&checkPos[1]===c)sq.classList.add("king-check");
  sq.setAttribute("role","gridcell");sq.setAttribute("aria-label",name(r,c)+": "+(p?(p[0]==="w"?"white ":"black ")+({P:"pawn",K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight"}[p[1]]):"empty")+(target?", legal move":""));
  if(p){const span=document.createElement("span");span.className="piece "+p[0];span.textContent=GLYPHS[p];sq.append(span);}
  if(r===7||c===7){const cord=document.createElement("span");cord.className="coordinate";cord.textContent=r===7?LETTERS[c]:(8-r);sq.append(cord);}
  sq.addEventListener("click",()=>tap(r,c));boardEl.append(sq);
 }
 $("chessStatus").textContent=status||verdict();
 $("turnLabel").textContent=game.turn==="w"?"WHITE":"BLACK";
 $("moveCount").textContent=String(log.length);
 const history=$("moveHistory");history.replaceChildren();
 for(let i=Math.max(0,log.length-18);i<log.length;i++){const li=document.createElement("li");li.textContent=(i+1)+". "+log[i];history.append(li);}
 history.scrollTop=history.scrollHeight;
 $("friendMode").classList.toggle("is-on",!bot);$("botMode").classList.toggle("is-on",bot);
}
function play(m,byBot=false){
 const piece=game.b[m.fr][m.fc],taken=game.b[m.tr][m.tc]|| (m.flag==="ep"?game.b[m.fr][m.tc]:null);
 stack.push({state:clone(game),history:log.slice()});
 const extra=apply(game,m);
 const label=(piece[0]==="w"?"White ":"Black ")+(m.flag==="castleK"?"O-O":m.flag==="castleQ"?"O-O-O":name(m.fr,m.fc)+(taken?" × ":" → ")+name(m.tr,m.tc))+(extra.promoted?" =Q":"");
 log.push(label);
 selected=null;possible=[];
 const status=verdict();paint(status);
 if(bot&&game.turn==="b"&&!game.ended&&!byBot){const stamp=++token;setTimeout(()=>{if(stamp===token&&bot&&game.turn==="b"&&!game.ended)computer();},320);}
}
function tap(r,c){
 if(game.ended||(bot&&game.turn==="b"))return;
 const m=possible.find(x=>x.tr===r&&x.tc===c);
 if(m){play(m);return;}
 if(game.b[r][c]?.[0]===game.turn){selected={r,c};possible=legal(game,game.turn).filter(x=>x.fr===r&&x.fc===c);}
 else{selected=null;possible=[];}
 paint();
}
function computer(){
 const all=legal(game,"b");if(!all.length)return;
 let best=-1e9,pick=all[0];
 for(const m of all){
  const capture=game.b[m.tr][m.tc]|| (m.flag==="ep"?game.b[m.fr][m.tc]:null);
  const trial=clone(game);apply(trial,m);
  const threat=inCheck(trial,"w")?0.7:0;
  const queen=game.b[m.fr][m.fc]?.[1]==="P"&&m.tr===7?8:0;
  const score=(capture?VALUE[capture[1]]*7:0)+threat+queen+(Math.random()*3)-Math.abs(3.5-m.tc)*.08;
  if(score>best){best=score;pick=m;}
 }
 play(pick,true);
}
function restart(){token++;game=initial();selected=null;possible=[];stack=[];log=[];paint();}
$("friendMode").addEventListener("click",()=>{bot=false;restart();});
$("botMode").addEventListener("click",()=>{bot=true;restart();});
$("resetBtn").addEventListener("click",restart);
$("undoBtn").addEventListener("click",()=>{
 if(!stack.length)return;token++;
 let n=bot&&game.turn==="w"?2:1;
 while(n--&&stack.length){const entry=stack.pop();game=entry.state;log=entry.history;}
 selected=null;possible=[];paint();
 if(bot&&game.turn==="b"&&!game.ended){const stamp=++token;setTimeout(()=>{if(stamp===token&&bot)computer();},330);}
});
paint();
})();