(()=>{'use strict';
 const cards=document.getElementById('catalog-grid');
 if(!cards)return;
 const count=document.getElementById('catalog-count'),empty=document.getElementById('catalog-empty');
 const search=document.getElementById('app-search'),statusFilter=document.getElementById('j-upload-status');
 const familyButtons=[...document.querySelectorAll('button[data-family]')];
 const featured=document.getElementById('j-featured-grid');
 const dialog=document.getElementById('j-app-dialog'),details=document.getElementById('j-detail-content');
 let all=[],family='all',releaseAssets=new Map(),currentId=null;
 const features=['j-control-hub','j-mep-toolbox','j-earth-time-machine'];
 const colors=['j2-teal','j2-indigo','j2-violet','j2-orange','j2-blue','j2-lime'];
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function monogram(item){const words=item.name.replace(/^J\s+/i,'').replace(/[^a-z0-9 ]/gi,' ').split(/\s+/).filter(Boolean);return ((words.length>1?words[0][0]+words[1][0]:(words[0]||'J').slice(0,2))||'J').toUpperCase();}
 function colorFor(item){let n=0;for(const char of item.id)n=(n+char.charCodeAt(0))%colors.length;return colors[n];}
 function size(bytes){return bytes?(bytes/1048576).toFixed(2)+' MB':'';}
 function isLocalAsset(s){return typeof s==='string'&&/^\/assets\/apps\/[a-zA-Z0-9/_-]+\.(png|webp|jpg|jpeg)$/i.test(s);}
 function getRelease(item){
   if(!item||item.access!=='public'||!item.releaseAsset)return null;
   const asset=releaseAssets.get(item.releaseAsset),raw=item.downloadUrl||asset?.browser_download_url;
   if(typeof raw!=='string')return null;
   try{
     const url=new URL(raw);
     const wanted='/jebinc324/J-Digital-Hub/releases/download/just24-public-v1/'+encodeURIComponent(item.releaseAsset);
     if(url.protocol!=='https:'||url.hostname!=='github.com'||url.pathname!==wanted)return null;
     const bytes=Number(item.verifiedUpload?.sizeBytes||asset?.size||0);
     return {url:url.href,bytes:Number.isFinite(bytes)?bytes:0,hash:item.verifiedUpload?.sha256||''};
   }catch(_){return null;}
 }
 function logo(item,big=false){
   const box=el('span','j2-logo '+colorFor(item)+(big?' j2-logo-big':''));
   const fallback=el('span','j2-letters',monogram(item));
   box.append(fallback);
   if(isLocalAsset(item.logo)){
     const img=el('img','j2-logo-image');img.alt=item.name+' official app icon';img.loading='lazy';img.src=item.logo;
     img.addEventListener('load',()=>box.classList.add('j2-has-image'));
     img.addEventListener('error',()=>{img.remove();box.classList.remove('j2-has-image');});
     box.append(img);
   }
   return box;
 }
 function btn(text,cls,click){const b=el('button',cls,text);b.type='button';b.addEventListener('click',click);return b;}
 function openDetails(item,updateUrl=true){
   if(!dialog||!details)return;
   currentId=item.id;details.replaceChildren();
   const release=getRelease(item);
   const media=el('div','j2-detail-media '+colorFor(item));
   const mediaMark=el('div','j2-detail-art');mediaMark.append(logo(item,true),el('span','j2-art-kicker','JUST 24 THINGS · BY J&J'),el('strong','j2-art-title',item.name));
   media.append(mediaMark);
   const panel=el('div','j2-detail-panel');
   panel.append(el('p','j2-overline',item.family+' / J APPS COLLECTION'),el('h2','j2-detail-title',item.name),el('p','j2-detail-desc',item.description));
   const tags=el('div','j2-detail-tags');
   tags.append(el('span','j2-pill',item.versionLabel||'Version not listed'),el('span','j2-pill','Free download'));
   if(release?.bytes)tags.append(el('span','j2-pill',size(release.bytes)));
   panel.append(tags);
   const box=el('div','j2-detail-cta');
   if(release){
     const a=el('a','j2-primary','↓ Download file');a.href=release.url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);
     box.append(btn('Copy link','j2-secondary',()=>{navigator.clipboard?.writeText(release.url).then(()=>{box.querySelector('.j2-secondary').textContent='Link copied ✓';}).catch(()=>{window.prompt('Copy download link:',release.url);});}));
   }else box.append(el('p','j2-notice','Release upload pending.'));
   panel.append(box);
   if(item.note){
     const caution=el('p','j2-note',item.note);
     panel.append(caution);
   }
   const gallery=el('section','j2-screenshots');
   gallery.append(el('h3','', 'App screenshots'),el('p','j2-gallery-caption','Original screenshots only · No generated previews'));
   const shots=Array.isArray(item.screenshots)?item.screenshots.filter(isLocalAsset):[];
   if(shots.length){
     const strip=el('div','j2-shot-strip');
     shots.slice(0,8).forEach((url,index)=>{const frame=el('a','j2-shot');frame.href=url;frame.target='_blank';frame.rel='noopener noreferrer';const img=el('img');img.src=url;img.alt=item.name+' screenshot '+(index+1);img.loading='lazy';frame.append(img);strip.append(frame);});
     gallery.append(strip);
   }else{
     const placeholder=el('div','j2-shot-placeholder');placeholder.append(el('span','','▧'),el('strong','','Official screenshots coming soon'),el('p','','The original app screens will appear here once added to the media library.'));gallery.append(placeholder);
   }
   panel.append(gallery);
   if(release?.hash){
     const checksum=el('details','j2-hash');checksum.append(el('summary','','Download checksum (SHA-256)'),el('code','',release.hash));panel.append(checksum);
   }
   details.append(media,panel);
   if(!dialog.open)dialog.showModal();
   if(updateUrl){const u=new URL(location.href);u.searchParams.set('app',item.id);history.pushState({jApp:item.id},'',u);}
 }
 function makeCard(item){
   const release=getRelease(item);
   const card=el('article','j-card j2-card');
   const preview=el('div','j2-card-cover '+colorFor(item));
   const decor=el('div','j2-cover-decor');
   preview.append(decor,logo(item),el('span','j2-cover-text','J&J / '+(item.family==='Android'?'APPS':item.family==='Revit Add-ins'?'REVIT':'DYNAMO')));
   card.append(preview);
   const body=el('div','j2-card-body');
   const head=el('div','j2-card-header');
   head.append(el('span','j2-category',item.family),el('span','j2-free',release?'FREE':'COMING SOON'));
   body.append(head,el('h3','',item.name),el('p','j2-card-desc',item.description));
   const meta=el('div','j2-card-meta');
   meta.append(el('span','',item.versionLabel||'Version not listed'));
   if(release?.bytes)meta.append(el('span','',size(release.bytes)));
   body.append(meta);
   const actions=el('div','j2-card-actions');
   if(release){
     const download=el('a','j2-download','↓ Download');download.href=release.url;download.target='_blank';download.rel='noopener noreferrer';
     download.setAttribute('aria-label','Download '+item.name);actions.append(download);
   }else actions.append(el('span','j2-download j2-disabled','Not available'));
   actions.append(btn('View details ↗','j2-more',()=>openDetails(item)));
   body.append(actions);card.append(body);
   return card;
 }
 function makeFeature(item){
   const card=el('article','j2-feature-card '+colorFor(item));
   const left=el('div','j2-feature-copy');
   left.append(el('p','j2-overline',item.family+' · FEATURED'),el('h3','',item.name),el('p','',item.description));
   const more=btn('Explore app ↗','j2-feature-link',()=>openDetails(item));
   left.append(more);card.append(left,logo(item,true));return card;
 }
 function draw(){
   const q=search?.value.trim().toLocaleLowerCase()||'';
   const filtered=all.filter(item=>(family==='all'||item.family===family)
     &&(!statusFilter||statusFilter.value==='all'||(statusFilter.value==='uploaded'?Boolean(getRelease(item)):statusFilter.value==='pending'?!getRelease(item):false))
     &&[item.name,item.family,item.description,item.versionLabel||''].some(s=>s.toLocaleLowerCase().includes(q)));
   cards.replaceChildren(...filtered.map(makeCard));
   count.textContent='Showing '+filtered.length+' of '+all.length+' projects';
   empty.hidden=filtered.length>0;
   const ready=all.filter(item=>Boolean(getRelease(item))).length;
   const progress=document.getElementById('j-progress-label');if(progress)progress.textContent=ready+' ready · '+(all.length-ready)+' pending';
   const readyStat=document.getElementById('j-ready-count'),pendingStat=document.getElementById('j-pending-count');
   if(readyStat)readyStat.textContent=String(ready);
   if(pendingStat)pendingStat.textContent=String(all.length-ready);
 }
 familyButtons.forEach(b=>b.addEventListener('click',()=>{
   family=b.dataset.family;
   familyButtons.forEach(other=>{const active=b===other;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});
   draw();
 }));
 search?.addEventListener('input',draw);
 statusFilter?.addEventListener('change',draw);
 dialog?.addEventListener('close',()=>{
   const u=new URL(location.href);
   if(u.searchParams.get('app')===currentId){u.searchParams.delete('app');history.replaceState(null,'',u);}
   currentId=null;
 });
 document.getElementById('j-dialog-close')?.addEventListener('click',()=>dialog.close());
 dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 window.addEventListener('popstate',()=>{
   const id=new URL(location.href).searchParams.get('app');
   const item=all.find(a=>a.id===id);
   if(item){openDetails(item,false);}else if(dialog?.open)dialog.close();
 });
 async function init(){
   try{
     const result=await fetch('/apps/catalog.json',{cache:'no-store'});
     if(!result.ok)throw Error('Catalogue unavailable');
     const data=await result.json();
     if(!Array.isArray(data.items))throw Error('Invalid catalogue');
     all=data.items.filter(item=>item&&typeof item.name==='string'&&item.access==='public');
     if(featured)featured.replaceChildren(...features.map(id=>all.find(x=>x.id===id)).filter(Boolean).map(makeFeature));
     draw();
     const param=new URL(location.href).searchParams.get('app'),chosen=all.find(x=>x.id===param);
     if(chosen)openDetails(chosen,false);
     if(data.release?.repository==='jebinc324/J-Digital-Hub'&&data.release?.tag==='just24-public-v1'){
       try{
         const response=await fetch('https://api.github.com/repos/jebinc324/J-Digital-Hub/releases/tags/just24-public-v1');
         if(response.ok){const gh=await response.json();
           if(Array.isArray(gh.assets)){
             releaseAssets=new Map(gh.assets.filter(a=>a&&a.name&&a.browser_download_url).map(a=>[a.name,a]));
             draw();
           }
         }
       }catch(_){/* Cached catalogue links remain available. */}
     }
   }catch(_){count.textContent='Catalogue unavailable';empty.hidden=false;empty.textContent='Unable to load catalogue. Please refresh the page.';}
 }
 init();
})();
