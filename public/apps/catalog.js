(()=>{
 'use strict';
 const grid=document.getElementById('catalog-grid'),counter=document.getElementById('catalog-count'),empty=document.getElementById('catalog-empty');
 if(!grid)return;
 const search=document.getElementById('app-search'),platform=document.getElementById('platform-filter');
 const buttons=[...document.querySelectorAll('[data-access]')]; let filter='all',apps=[];
 const text=(tag,value,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;node.textContent=value;return node};
 function safeReleaseLink(url){try{const u=new URL(url);return u.protocol==='https:' && (u.hostname==='github.com' && /^\/[^/]+\/[^/]+\/releases\/download\/[^/]+\/.+/.test(u.pathname))?u.href:null}catch{return null}}
 function makeCard(app){
  const card=document.createElement('article');card.className='catalog-card';card.dataset.access=app.access;
  const top=text('div','', 'catalog-card-top');const icon=text('span',app.symbol||'J','catalog-icon');icon.setAttribute('aria-hidden','true'); const access=text('span',app.access==='public'?'PUBLIC · PLANNED':'RESTRICTED','catalog-badge '+app.access);top.append(icon,access);card.append(top);
  card.append(text('div',app.platform+' / '+app.category,'catalog-category'),text('h3',app.name),text('p',app.description));
  const bottom=text('div','','catalog-card-bottom');bottom.append(text('span',app.version?'v'+app.version:'RELEASE PENDING','catalog-version'));
  if(app.access==='public'){
   const url=safeReleaseLink(app.downloadUrl||'');
   if(url){const a=text('a','Download ↗','catalog-action');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Download '+app.name+' from GitHub Releases');bottom.append(a)}
   else {const label=text('span','Download coming soon','catalog-pending');bottom.append(label)}
  }else{const a=text('a','Access details ↗','catalog-action restricted-action');a.href='/apps/access/?app='+encodeURIComponent(app.id);bottom.append(a)}
  card.append(bottom);return card;
 }
 function draw(){const q=search.value.trim().toLocaleLowerCase();const pf=platform.value;const found=apps.filter(a=>(filter==='all'||a.access===filter)&&(pf==='all'||(pf==='Android' ? a.platform.includes('Android'):/Windows|MT5/i.test(a.platform)))&&[a.name,a.category,a.description,a.platform].some(v=>v.toLocaleLowerCase().includes(q)));grid.replaceChildren(...found.map(makeCard));empty.hidden=!!found.length;counter.textContent=`${found.length} of ${apps.length} apps`;}
 buttons.forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.access;buttons.forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});draw()}));
 search.addEventListener('input',draw);platform.addEventListener('change',draw);
 fetch('/apps/catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Cannot load catalogue');return r.json()}).then(data=>{if(!Array.isArray(data.apps))throw Error('Invalid catalogue');apps=data.apps.filter(a=>a && typeof a.name==='string' && (a.access==='public'||a.access==='restricted') && typeof a.platform==='string' && typeof a.category==='string' && typeof a.description==='string');draw()}).catch(()=>{counter.textContent='Catalogue unavailable';empty.hidden=false;empty.textContent='Could not load the app catalogue. Please refresh the page.'});
})();
