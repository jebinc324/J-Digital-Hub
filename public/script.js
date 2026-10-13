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
  const year=document.getElementById('year'); if(year)year.textContent=String(new Date().getFullYear());
})();
