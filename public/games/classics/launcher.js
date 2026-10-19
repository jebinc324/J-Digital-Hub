(() => {
"use strict";
const buttons=[...document.querySelectorAll("[data-j-classic]")];
const frame=document.getElementById("j-classic-frame");
const label=document.getElementById("j-classic-playing");
const direct=document.getElementById("j-classic-direct");
if(!frame||buttons.length!==2)return;
const games={
 chess:{src:"/games/classics/chess.html",title:"J CHESS · YOUR MOVE"},
 carrom:{src:"/games/classics/carrom.html",title:"J CARROM · AIM AND FLICK"}
};
function choose(id){
 if(!Object.prototype.hasOwnProperty.call(games,id))return;
 const g=games[id];
 buttons.forEach(b=>{const active=b.dataset.jClassic===id;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));});
 label.textContent=g.title;
 direct.href=g.src;
 if(frame.getAttribute("src")!==g.src){frame.setAttribute("src",g.src);frame.title="Play "+(id==="chess"?"J Chess":"J Carrom")+" inside Just 24 Things";}
}
buttons.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.jClassic)));
const hash=location.hash;
choose(hash==="#play-carrom"?"carrom":"chess");
})();