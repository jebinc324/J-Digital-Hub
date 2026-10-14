
(()=>{'use strict';
 const cards=document.getElementById('catalog-grid');
 if(!cards)return;
 const count=document.getElementById('catalog-count'),empty=document.getElementById('catalog-empty');
 const search=document.getElementById('app-search');
 const statusFilter=document.getElementById('j-upload-status');
 const familyButtons=[...document.querySelectorAll('button[data-family]')];
 let all=[],family='all',releaseAssets=new Map();
 function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
 function iconFor(type){return {'Android':'▣','Revit Add-ins':'⌗','Revit Dynamo':'◇','Windows & Trading':'▤'}[type]||'J';}
 function getRelease(item){
   if(!item||item.access!=='public'||!item.releaseAsset)return null;
   const asset=releaseAssets.get(item.releaseAsset);
   const raw=item.downloadUrl||asset?.browser_download_url;
   if(typeof raw!=='string')return null;
   try{
     const url=new URL(raw);
     const path='/jebinc324/J-Digital-Hub/releases/download/just24-public-v1/'+encodeURIComponent(item.releaseAsset);
     if(url.protocol!=='https:'||url.hostname!=='github.com'||url.pathname!==path)return null;
     const sizeBytes=Number(item.verifiedUpload?.sizeBytes||asset?.size||0);
     return {url:url.href,sizeBytes:Number.isFinite(sizeBytes)?sizeBytes:0};
   }catch(_){return null;}
 }
 function makeCard(item){
   const available=getRelease(item);
   const card=el('article','j-card');
   const top=el('div','j-card-top');
   top.append(el('span','j-card-icon',iconFor(item.family)),el('span','j-card-badge public',available?'FREE':'FREE · COMING SOON'));
   card.append(top,el('div','j-card-type',item.family),el('h3','',item.name),el('p','j-card-desc',item.description));
   if(item.note&&(item.launchStatus==='uploaded-unverified'||!available))card.append(el('p','j-card-note',item.note));
   const bottom=el('div','j-card-bottom');
   const size=available&&available.sizeBytes?(available.sizeBytes/1048576).toFixed(2)+' MiB':'';
   bottom.append(el('span','j-card-file',available?'FREE DOWNLOAD'+(size?' · '+size:''):'FREE · RELEASE PENDING'));
   if(available){
      const a=el('a','j-card-action','Download ↗');
      a.href=available.url;a.target='_blank';a.rel='noopener noreferrer';
      a.setAttribute('aria-label','Download '+item.name+' from official GitHub Releases');bottom.append(a);
   }else{bottom.append(el('span','j-card-pending','Upload pending'));}
   card.append(bottom);return card;
 }
  function draw(){
   const q=search.value.trim().toLocaleLowerCase();
   const filtered=all.filter(item=>(family==='all'||item.family===family)&&( !statusFilter || statusFilter.value==='all' || (statusFilter.value==='uploaded' ? Boolean(getRelease(item)) : statusFilter.value==='pending' ? !getRelease(item) : false))&&
      [item.name,item.family,item.description].some(s=>s.toLocaleLowerCase().includes(q)));
   cards.replaceChildren(...filtered.map(makeCard));count.textContent=`Showing ${filtered.length} of ${all.length} selected projects`;
   empty.hidden=filtered.length>0;
   const ready=all.filter(item=>Boolean(getRelease(item))).length;
   const progress=document.getElementById('j-progress-label');if(progress)progress.textContent=ready+' ready · '+(all.length-ready)+' pending';
   const readyStat=document.getElementById('j-ready-count'),pendingStat=document.getElementById('j-pending-count');
   if(readyStat)readyStat.textContent=String(ready);if(pendingStat)pendingStat.textContent=String(all.length-ready);
 }
 familyButtons.forEach(button=>button.addEventListener('click',()=>{
   family=button.dataset.family;
   familyButtons.forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
   draw();
 }));
 search.addEventListener('input',draw);
 statusFilter?.addEventListener('change',draw);
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
