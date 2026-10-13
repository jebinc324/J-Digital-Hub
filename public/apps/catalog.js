
(()=>{'use strict';
 const cards=document.getElementById('catalog-grid');
 if(!cards)return;
 const count=document.getElementById('catalog-count'),empty=document.getElementById('catalog-empty');
 const search=document.getElementById('app-search');
 const accessButtons=[...document.querySelectorAll('button[data-access]')];
 const familyButtons=[...document.querySelectorAll('button[data-family]')];
 let all=[],access='all',family='all',releaseAssets=new Map();
 function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
 function iconFor(type){return {'Android':'▣','Revit Add-ins':'⌗','Revit Dynamo':'◇','Windows & Trading':'▤'}[type]||'J';}
 function makeCard(item){
   const card=el('article','j-card');
   const top=el('div','j-card-top');
   top.append(el('span','j-card-icon',iconFor(item.family)),el('span','j-card-badge '+item.access,item.access==='public'?'OPEN':'RESTRICTED'));
   card.append(top,el('div','j-card-type',item.family),el('h3','',item.name),el('p','j-card-desc',item.description));
   if(item.note){
      const note=el('p','j-card-note',item.note);card.append(note);
   }
   const bottom=el('div','j-card-bottom');
   const ver=item.approxSizeMB && item.access==='public' ? `${item.approxSizeMB} MB • FILE RECEIVED`:
     item.uploadedFile?'FILE RECEIVED':'FILE NOT SUPPLIED';
   bottom.append(el('span','j-card-file',ver));
   if(item.access==='restricted'){
     const a=el('a','j-card-action','Access details ↗');
     a.href='/apps/access/?app='+encodeURIComponent(item.id);
     bottom.append(a);
   } else {
     const asset=item.releaseAsset ? releaseAssets.get(item.releaseAsset):undefined;
     let url=null;try{
      if(asset){const u=new URL(asset.browser_download_url);if(u.protocol==='https:' && u.hostname==='github.com')url=u.href;}
     }catch(_){}
     if(url){
       const a=el('a','j-card-action','Download ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
       a.setAttribute('aria-label','Download '+item.name+' from official GitHub Releases');bottom.append(a);
     }else{
       bottom.append(el('span','j-card-pending',item.uploadedFile?'Release pending':'No file yet'));
     }
   }
   card.append(bottom);return card;
 }
 function draw(){
   const q=search.value.trim().toLocaleLowerCase();
   const filtered=all.filter(item=>(access==='all'||item.access===access)&&(family==='all'||item.family===family)&&
      [item.name,item.family,item.description].some(s=>s.toLocaleLowerCase().includes(q)));
   cards.replaceChildren(...filtered.map(makeCard));count.textContent=`Showing ${filtered.length} of ${all.length} selected projects`;
   empty.hidden=filtered.length>0;
 }
 accessButtons.forEach(button=>button.addEventListener('click',()=>{
   access=button.dataset.access;
   accessButtons.forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
   draw();
 }));
 familyButtons.forEach(button=>button.addEventListener('click',()=>{
   family=button.dataset.family;
   familyButtons.forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
   draw();
 }));
 search.addEventListener('input',draw);
 async function init(){
   try{
     const result=await fetch('/apps/catalog.json',{cache:'no-store'});
     if(!result.ok)throw Error('Catalogue unavailable');
     const data=await result.json();
     if(!Array.isArray(data.items))throw Error('Invalid catalogue');
     all=data.items.filter(item=>item&&typeof item.name==='string'&&['public','restricted'].includes(item.access));
     draw();
     // Optional GitHub public release lookup. A 404 means "no public assets yet".
     const {repository,tag}=data.release||{};
     if(repository==='jebinc324/J-Digital-Hub'&&tag==='just24-public-v1'){
       try{
         const response=await fetch('https://api.github.com/repos/jebinc324/J-Digital-Hub/releases/tags/just24-public-v1');
         if(response.ok){
           const githubRelease=await response.json();
           if(Array.isArray(githubRelease.assets)){
             releaseAssets=new Map(githubRelease.assets.filter(a=>a&&a.name&&a.browser_download_url).map(a=>[a.name,a]));
             draw();
           }
         }
       }catch(_){/* Keep catalogue usable if API unavailable. */}
     }
   }catch(_){count.textContent='Catalogue unavailable';empty.hidden=false;empty.textContent='Unable to load catalogue. Please refresh the page.';}
 }
 init();
})();
