/* Just 24 Things by J&J · Progressive Motion System
   No external animation dependency. No content hidden when JS or motion API is unavailable. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window)||!('requestAnimationFrame' in window))return;

  const seen=new WeakSet();
  // Keep observing: an element is reset only after completely leaving the
  // visible region. Entering again from above OR below replays its formation.
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.isIntersecting){
        entry.target.classList.add('jj-visible');
      }else{
        const bounds=entry.boundingClientRect;
        if(bounds.bottom<=0||bounds.top>=window.innerHeight*.93){
          entry.target.classList.remove('jj-visible');
        }
      }
    }
  },{rootMargin:'0px 0px -7% 0px',threshold:0});

  function animate(el,type='rise',delay=0){
    if(!el||seen.has(el)||el.closest('dialog'))return;
    seen.add(el);
    el.dataset.jjMotion=type;
    el.style.setProperty('--jj-delay',String(Math.min(delay,450))+'ms');
    observer.observe(el);
  }
  function scatter(el){
    if(!el||seen.has(el))return;
    seen.add(el);
    let index=0;
    const textNodes=[];
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(node.nodeValue?.trim()&&!node.parentElement.closest('.jj-word,svg,script,style'))textNodes.push(node);
    }
    for(const node of textNodes){
      const frag=document.createDocumentFragment();
      const tokens=node.nodeValue.match(/\s+|\S+/g)||[];
      for(const token of tokens){
        if(/^\s+$/.test(token)){frag.append(document.createTextNode(token));continue;}
        const word=document.createElement('span');word.className='jj-word';word.textContent=token;
        const direction=index%2===0?-1:1;
        word.style.setProperty('--jj-x',(direction*(13+(index%4)*8))+'px');
        word.style.setProperty('--jj-y',((index%3===0?-1:1)*(10+(index%4)*5))+'px');
        word.style.setProperty('--jj-r',(direction*(3+index%4))+'deg');
        word.style.setProperty('--jj-word-delay',(60+Math.min(index,16)*48)+'ms');
        frag.append(word);index++;
      }
      node.replaceWith(frag);
    }
    el.dataset.jjMotion='scatter';
    observer.observe(el);
  }

  // Word-by-word hero entrance; keep heading semantics, nested <em> and <br> intact.
  document.querySelectorAll('.intro-left h2,.j-hero-text h1,.inner-hero h1').forEach(scatter);

  // Explicit editorial reveals across the home, apps, arcade and channel pages.
  const groups=[
    ['.masthead-top','.cover-frame','.intro-left .intro-overline','.intro-right','.section-heading','.topic-filter-bar','.arcade-copy','.arcade-panel','.connect-card','.cloud-note','.j2-section-line','.j-catalog-intro','.j-toolbar','.j-family-tabs','.j-download-guide','.inner-hero .section-label','.inner-hero .inner-lead','.inner-actions','.j-apps-access .j-access-info','footer .footer-main'],
    ['.topic-section .thing-card','.app-grid .app-card','.info-grid .info-card','.channel-topics .channel-topic','.j2-featured-grid .j2-feature-card','.j-card-grid .j2-card'],
    ['.cover-frame','.connect-card-logo','.j-hero-logo']
  ];
  groups[0].forEach(selector=>document.querySelectorAll(selector).forEach((el,i)=>animate(el,'rise',(i%4)*65)));
  groups[1].forEach(selector=>document.querySelectorAll(selector).forEach((el,i)=>animate(el,'zoom',(i%4)*70)));
  groups[2].forEach(selector=>document.querySelectorAll(selector).forEach(el=>{
    if(!seen.has(el))animate(el,'zoom',80);
  }));
  document.querySelectorAll('.j-hero-text .j-kicker,.j-hero-text>p,.j-hero-ctas,.j-stats').forEach((el,i)=>animate(el,'rise',140+i*85));

  // J Apps builds its 42 cards after a JSON fetch; register newly drawn cards safely.
  for(const id of ['catalog-grid','j-featured-grid']){
    const host=document.getElementById(id);
    if(!host||!('MutationObserver' in window))continue;
    let update;
    const watch=new MutationObserver(()=>{
      if(update)return;
      update=requestAnimationFrame(()=>{
        update=0;
        [...host.children].forEach((card,i)=>animate(card,id==='catalog-grid'?'zoom':'rise',(i%4)*65));
      });
    });
    watch.observe(host,{childList:true});
  }

  // Lightweight reading progress and very small transform-only parallax.
  const bar=document.createElement('div');
  bar.className='jj-scroll-progress';
  bar.setAttribute('aria-hidden','true');
  document.body.append(bar);
  const heroLogo=document.querySelector('.j-hero-logo');
  const cover=document.querySelector('.cover-frame');
  if(heroLogo)heroLogo.classList.add('jj-parallax-logo');
  // Paper roll v2: collapse real layout height, not just clip the image.
  // The cover is pinned inside an overflow-hidden slot. Scrolling upward
  // expands the slot again so no blank cover-sized gap remains.
  const paperSlot=cover?.closest('.jj-paper-slot');
  const introRow=paperSlot?.closest('.masthead')?.querySelector('.intro-row');
  let paperStart=0,paperDistance=1,paperNaturalHeight=0,introNaturalGap=0;
  function measurePaper(){
    if(!cover||!paperSlot)return;
    // Read the image's original size even while its outer slot is collapsed.
    paperNaturalHeight=Math.max(1,cover.offsetHeight);
    paperStart=Math.max(35,paperSlot.getBoundingClientRect().top+(window.scrollY||0)-125);
    paperDistance=Math.max(260,Math.min(830,paperNaturalHeight*.95));
    if(introRow){
      introRow.style.marginTop='';
      introNaturalGap=parseFloat(getComputedStyle(introRow).marginTop)||0;
    }
  }
  if(paperSlot){
    measurePaper();
    paperSlot.style.height=paperNaturalHeight+'px';
    paperSlot.style.setProperty('--jj-paper-edge-opacity','0');
    root.classList.add('jj-paper-active');
  }
  let scheduled=false;
  function paint(){
    scheduled=false;
    const y=Math.max(0,window.scrollY||0);
    if(heroLogo)heroLogo.style.setProperty('--jj-parallax',Math.min(30,y*.035).toFixed(1)+'px');
    if(paperSlot){
      const t=Math.max(0,Math.min(1,(y-paperStart)/paperDistance));
      const p=t*t*(3-2*t);
      const left=Math.max(0,paperNaturalHeight*(1-p));
      // This height is in normal flow, so the next section rises with the roll.
      paperSlot.style.height=left.toFixed(2)+'px';
      paperSlot.style.setProperty('--jj-paper-edge-opacity',Math.min(1,Math.sin(Math.PI*p)*2).toFixed(3));
      // Shrink the old decorative 72/52/42px intro gap too.
      if(introRow){
        introRow.style.marginTop=Math.max(18,introNaturalGap-(introNaturalGap-18)*p).toFixed(2)+'px';
      }
    }
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    bar.style.transform='scaleX('+Math.min(1,y/max).toFixed(4)+')';
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint);}
  function resizePaper(){
    if(paperSlot){
      // Temporarily show full slot before measuring its natural image height.
      // Original cover aspect ratio is unaffected by the rolling viewport.
      measurePaper();
    }
    schedule();
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',resizePaper,{passive:true});
  window.addEventListener('pageshow',schedule,{passive:true});
  root.classList.add('jj-motion-enabled');
  schedule();
})();
