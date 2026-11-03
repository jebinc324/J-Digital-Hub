/* Just24Things: Goo Goo, Boo Boo, Koo Koo & Kili Kili.
   Mouse hover previews greetings; click/tap also speaks when the browser permits.
   Self-contained; never injected on contact/privacy; no duplicate inside game iframes. */
(function(){
  "use strict";
  if(window.self !== window.top || /^\/(contact|privacy)(\/|$)/i.test(location.pathname)) return;
  if(document.querySelector(".jj-friends-layer")) return;

  const goo='<svg viewBox="0 0 80 96" aria-hidden="true"><ellipse cx="40" cy="89" rx="27" ry="4" fill="#164c5b" opacity=".18"/><path d="M25 70L19 81M55 70l6 11" stroke="#1888aa" stroke-width="7" stroke-linecap="round"/><path d="M19 35Q10 22 21 12Q30 6 34 23Q45 4 54 14Q61 23 56 34" fill="#75d9ee" stroke="#198aaf" stroke-width="2.5"/><path d="M13 51Q10 24 40 24Q69 24 68 51Q67 77 40 79Q13 77 13 51Z" fill="#7de5f3" stroke="#168fb2" stroke-width="3"/><ellipse cx="22" cy="57" rx="7" ry="5" fill="#ff9cae" opacity=".8"/><ellipse cx="59" cy="57" rx="7" ry="5" fill="#ff9cae" opacity=".8"/><ellipse cx="31" cy="46" rx="3.6" ry="5" fill="#163b58"/><ellipse cx="49" cy="46" rx="3.6" ry="5" fill="#163b58"/><circle cx="32" cy="44" r="1.1" fill="#fff"/><circle cx="50" cy="44" r="1.1" fill="#fff"/><path d="M34 59Q40 66 47 59" fill="none" stroke="#15475f" stroke-width="2.8" stroke-linecap="round"/><path d="M14 57L6 51M66 57l8-6" stroke="#168fb2" stroke-width="5" stroke-linecap="round"/></svg>';
  const boo='<svg viewBox="0 0 80 96" aria-hidden="true"><ellipse cx="40" cy="89" rx="24" ry="4" fill="#31265e" opacity=".18"/><path d="M15 50Q15 18 40 18Q65 18 65 50L65 75Q57 69 50 77Q43 69 35 77Q28 69 20 77L15 70Z" fill="#e7dbff" stroke="#8760cf" stroke-width="3"/><path d="M22 25Q36 10 50 23" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/><ellipse cx="30" cy="46" rx="4" ry="5.5" fill="#35235f"/><ellipse cx="51" cy="46" rx="4" ry="5.5" fill="#35235f"/><circle cx="31" cy="44" r="1.3" fill="#fff"/><circle cx="52" cy="44" r="1.3" fill="#fff"/><ellipse cx="23" cy="57" rx="5.5" ry="4" fill="#f6a7d4"/><ellipse cx="57" cy="57" rx="5.5" ry="4" fill="#f6a7d4"/><path d="M35 58Q40 64 45 58" fill="none" stroke="#35235f" stroke-width="2.5" stroke-linecap="round"/><path d="M14 52L6 46M66 52l8-9" stroke="#8760cf" stroke-width="5" stroke-linecap="round"/><path d="M54 11l3 5 5 2-5 2-3 5-2-5-5-2 5-2Z" fill="#ffc953"/></svg>';
  const koo='<svg viewBox="0 0 80 96" aria-hidden="true"><ellipse cx="40" cy="89" rx="26" ry="4" fill="#5a4218" opacity=".16"/><circle cx="18" cy="30" r="13" fill="#ffcf72" stroke="#a76c22" stroke-width="3"/><circle cx="62" cy="30" r="13" fill="#ffcf72" stroke="#a76c22" stroke-width="3"/><circle cx="18" cy="30" r="7" fill="#ff8fa0"/><circle cx="62" cy="30" r="7" fill="#ff8fa0"/><path d="M18 50Q16 24 40 24Q64 24 62 50L62 68Q58 80 40 80Q22 80 18 68Z" fill="#ffd27f" stroke="#ae7127" stroke-width="3"/><path d="M26 73L22 83M54 73l4 10" stroke="#ae7127" stroke-width="6" stroke-linecap="round"/><ellipse cx="30" cy="46" rx="3.3" ry="4.5" fill="#563924"/><ellipse cx="50" cy="46" rx="3.3" ry="4.5" fill="#563924"/><ellipse cx="40" cy="56" rx="9" ry="7" fill="#fff2d9"/><ellipse cx="40" cy="54" rx="5.5" ry="4.5" fill="#6d4935"/><path d="M36 63Q40 67 44 63" fill="none" stroke="#75402e" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="22" cy="58" rx="5" ry="4" fill="#ff9a94"/><ellipse cx="58" cy="58" rx="5" ry="4" fill="#ff9a94"/><path d="M17 59L8 54M63 59l9-7" stroke="#ae7127" stroke-width="5" stroke-linecap="round"/></svg>';
  const kili='<svg viewBox="0 0 80 96" aria-hidden="true"><ellipse cx="40" cy="89" rx="25" ry="4" fill="#2e6337" opacity=".16"/><path d="M27 73l-3 9M50 73l3 9" stroke="#e98b35" stroke-width="5" stroke-linecap="round"/><path d="M17 50Q13 23 39 21Q66 22 65 50Q63 75 41 78Q18 76 17 50Z" fill="#9ee8a3" stroke="#378e65" stroke-width="3"/><path d="M22 50Q1 40 9 63Q14 75 29 65M58 50Q77 39 72 60Q66 73 53 65" fill="#62c9a0" stroke="#378e65" stroke-width="2.5"/><path d="M35 23L31 12 42 20 44 9 47 24" fill="#4bb77f" stroke="#378e65" stroke-width="2"/><ellipse cx="31" cy="45" rx="3.4" ry="4.6" fill="#1d4a40"/><ellipse cx="49" cy="45" rx="3.4" ry="4.6" fill="#1d4a40"/><circle cx="32" cy="43" r="1.3" fill="#fff"/><circle cx="50" cy="43" r="1.3" fill="#fff"/><path d="M34 54L46 54L40 62Z" fill="#ffad45" stroke="#d77d2b" stroke-width="2"/><ellipse cx="24" cy="56" rx="5" ry="3.5" fill="#ffb8a1"/><ellipse cx="56" cy="56" rx="5" ry="3.5" fill="#ffb8a1"/></svg>';

  const friends=[
    {name:"Goo Goo",message:"Hi! I'm Goo Goo! How are you?",svg:goo,lane:20,mobile:16,trip:32,delay:-4,pitch:1.24,slot:0},
    {name:"Boo Boo",message:"Hello! I'm Boo Boo! Have a lovely day!",svg:boo,lane:80,mobile:24,trip:39,delay:-18,pitch:1.12,slot:1},
    {name:"Koo Koo",message:"Hey! I'm Koo Koo! How's your day going?",svg:koo,lane:44,mobile:42,trip:35,delay:-27,pitch:0.95,slot:2},
    {name:"Kili Kili",message:"Hi! I'm Kili Kili! Nice to meet you!",svg:kili,lane:104,mobile:34,trip:43,delay:-33,pitch:1.4,slot:3}
  ];
  const root=document.createElement("div");
  root.className="jj-friends-layer";
  root.setAttribute("aria-label","Just24Things animated friends");
  const controls=document.createElement("div");
  controls.className="jj-friends-controls";
  const soundButton=document.createElement("button");
  soundButton.type="button"; soundButton.textContent="🔊 Voice";
  soundButton.setAttribute("aria-label","Mute character voices");
  soundButton.setAttribute("aria-pressed","true");
  const visibleButton=document.createElement("button");
  visibleButton.type="button"; visibleButton.textContent="👋 Friends";
  visibleButton.setAttribute("aria-label","Hide animated friends");
  visibleButton.setAttribute("aria-pressed","true");
  let voiceOn=true,visible=true,lastSpeechAt=0;
  const canSpeak="speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if(!canSpeak){voiceOn=false;soundButton.textContent="🔇 Voice unavailable";soundButton.disabled=true;}
  const nodes=[];
  function speak(friend,force){
    if(!voiceOn||!canSpeak||(!force&&Date.now()-lastSpeechAt<3500)) return;
    lastSpeechAt=Date.now();
    try{
      window.speechSynthesis.cancel();
      const say=new SpeechSynthesisUtterance(friend.message);
      say.lang="en-US";say.pitch=friend.pitch;say.rate=.95;say.volume=.9;
      window.speechSynthesis.speak(say);
    }catch(e){/* Some browsers require a tap before allowing speech. */}
  }
  function greet(friend,button,force){
    if(!visible)return;
    button.classList.add("is-greeting");
    clearTimeout(button.jjTimer);
    button.jjTimer=setTimeout(()=>button.classList.remove("is-greeting"),3300);
    speak(friend,force);
  }
  friends.forEach(friend=>{
    const button=document.createElement("button");
    button.type="button";button.className="jj-friend";
    button.setAttribute("aria-label","Greet "+friend.name);
    button.style.setProperty("--lane",friend.lane+"px");
    button.style.setProperty("--mobile-lane",friend.mobile+"px");
    button.style.setProperty("--trip",friend.trip+"s");
    button.style.setProperty("--mobile-trip",(friend.trip*.8)+"s");
    button.style.setProperty("--delay",friend.delay+"s");
    button.style.setProperty("--slot",String(friend.slot));
    button.innerHTML='<span class="jj-friend-art">'+friend.svg+'</span><span class="jj-friend-bubble">'+friend.message+'</span>';
    button.addEventListener("pointerenter",event=>{if(event.pointerType==="mouse"||event.pointerType==="pen")greet(friend,button,false);});
    button.addEventListener("focus",()=>greet(friend,button,false));
    button.addEventListener("click",()=>greet(friend,button,true));
    button.addEventListener("pointerleave",()=>{if(!button.matches(":focus-visible"))button.classList.remove("is-greeting");});
    nodes.push(button);
    root.appendChild(button);
  });
  soundButton.addEventListener("click",()=>{
    voiceOn=!voiceOn;
    soundButton.textContent=voiceOn?"🔊 Voice":"🔇 Muted";
    soundButton.setAttribute("aria-label",voiceOn?"Mute character voices":"Enable character voices");
    soundButton.setAttribute("aria-pressed",String(voiceOn));
    if(!voiceOn&&canSpeak)window.speechSynthesis.cancel();
  });
  visibleButton.addEventListener("click",()=>{
    visible=!visible;
    root.classList.toggle("is-hidden",!visible);
    visibleButton.textContent=visible?"👋 Friends":"👋 Show";
    visibleButton.setAttribute("aria-label",visible?"Hide animated friends":"Show animated friends");
    visibleButton.setAttribute("aria-pressed",String(visible));
    if(!visible&&canSpeak)window.speechSynthesis.cancel();
  });
  controls.append(soundButton,visibleButton);
  root.appendChild(controls);
  document.body.appendChild(root);
  document.addEventListener("visibilitychange",()=>{
    root.classList.toggle("is-paused",document.hidden);
    if(document.hidden&&canSpeak)window.speechSynthesis.cancel();
  });
  window.addEventListener("pagehide",()=>{if(canSpeak)window.speechSynthesis.cancel();});
})();
