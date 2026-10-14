(()=>{
  const root=document.documentElement;
  const toggle=document.getElementById('theme-toggle');
  const icon=document.getElementById('theme-icon');
  const key='just24-theme';
  try {const value=localStorage.getItem(key); if(value==='light'||value==='dark')root.dataset.theme=value;}catch(e){}
  function refreshTheme(){const dark=root.dataset.theme==='dark'; if(icon)icon.textContent=dark?'☀':'☾'; if(toggle)toggle.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#1b201c':'#faf9f5');}
  refreshTheme();
  toggle?.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,root.dataset.theme);}catch(e){}refreshTheme();});
  const menu=document.getElementById('menu-toggle'),links=document.getElementById('nav-links');
  const closeMenu=()=>{links?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation');};
  menu?.addEventListener('click',()=>{const opening=!links.classList.contains('is-open');links.classList.toggle('is-open',opening);menu.setAttribute('aria-expanded',String(opening));menu.setAttribute('aria-label',opening?'Close navigation':'Open navigation');});
  links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-nav'))closeMenu()});
  document.querySelectorAll('button[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    const chosen=button.dataset.filter;
    document.querySelectorAll('button[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('.app-card[data-category]').forEach(card=>{card.hidden=!(chosen==='all'||card.dataset.category===chosen)});
  }));

  // Our 24 topics: independent from the J Apps filter.
  const topicButtons=[...document.querySelectorAll('[data-topic-filter]')];
  const topicCards=[...document.querySelectorAll('[data-topic-group]')];
  const topicCounter=document.getElementById('topic-counter');
  topicButtons.forEach(button=>button.addEventListener('click',()=>{
    const chosen=button.dataset.topicFilter;
    topicButtons.forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    let visible=0;
    topicCards.forEach(card=>{const show=chosen==='all'||card.dataset.topicGroup===chosen;card.hidden=!show;if(show)visible++;});
    if(topicCounter)topicCounter.textContent=`${visible} ${visible===1?'topic':'topics'}`;
  }));
  // Shared Back to Top control: available on every site page, including reduced-motion mode.
  const backTop=document.createElement('button');
  backTop.type='button';
  backTop.className='jj-back-to-top';
  backTop.setAttribute('aria-label','Back to top');
  backTop.setAttribute('title','Back to top');
  backTop.setAttribute('aria-hidden','true');
  backTop.tabIndex=-1;
  const backArrow=document.createElement('span');
  backArrow.className='jj-back-to-top-arrow';
  backArrow.textContent='↑';
  backArrow.setAttribute('aria-hidden','true');
  const backText=document.createElement('span');
  backText.textContent='Back to top';
  backTop.append(backArrow,backText);
  document.body.append(backTop);
  let scrollQueued=false;
  function updateBackTop(){
    scrollQueued=false;
    const visible=(window.scrollY||document.documentElement.scrollTop||0)>Math.max(400,window.innerHeight*.5);
    backTop.classList.toggle('is-visible',visible);
    backTop.tabIndex=visible?0:-1;
    backTop.setAttribute('aria-hidden',String(!visible));
  }
  function queueBackTop(){
    if(scrollQueued)return;
    scrollQueued=true;
    window.requestAnimationFrame(updateBackTop);
  }
  window.addEventListener('scroll',queueBackTop,{passive:true});
  window.addEventListener('resize',queueBackTop,{passive:true});
  backTop.addEventListener('click',()=>{
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0,left:0,behavior:reduce?'instant':'smooth'});
  });
  updateBackTop();

  const year=document.getElementById('year'); if(year)year.textContent=String(new Date().getFullYear());
})();
