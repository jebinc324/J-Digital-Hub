/* J&J Arcade — single-page height bridge.
   Same-origin iframe is used to isolate original 12-game CSS/JS from the site.
   Expand the embedded browser document to its contents; outer website scrolls.
   Keep an independent viewport for canvas gameplay / the 1000-stage roadmap. */
(()=>{
 'use strict';
 const frame=document.getElementById('j-arcade-player');
 if(!frame)return;
 let innerDoc=null,screenObserver=null,contentObserver=null,resizeObserver=null;
 let scheduled=false,activeId='',measured=0;
 const preferredGameHeight=()=>Math.max(680,Math.min(860,Math.round(window.innerHeight*.9)));
 const getActive=()=>innerDoc?.querySelector('.screen.active');
 const queue=()=>{
   if(scheduled)return;
   scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;resize();});
 };
 function setHeight(px){
   const height=Math.min(8000,Math.max(500,Math.ceil(px)));
   if(Math.abs(height-measured)<=2)return;
   measured=height;
   frame.style.height=height+'px';
 }
 function resize(){
   if(!innerDoc||!frame.isConnected)return;
   const active=getActive();
   if(!active)return;
   const id=active.id;
   const base=preferredGameHeight();
   if(id!==activeId){
     activeId=id;
     // Reset away from the previous screen's oversized home height BEFORE
     // measuring a viewport-sized game/roadmap (100dvh) screen.
     if(id!=='homeScreen'&&id!=='storeScreen'){
       setHeight(base);
       return;
     }
   }
   if(id==='homeScreen'||id==='storeScreen'){
     const blocks=id==='homeScreen'
       ? [active.querySelector('.home-header'),active.querySelector('.home-scroll')]
       : [active.querySelector('.sub-header'),active.querySelector('.store-body')];
     let natural=0;
     for(const part of blocks){if(part)natural+=Math.ceil(part.getBoundingClientRect().height);}
     // Screen.scrollHeight captures footer, padding and any dynamic boosters.
     // Do not use documentElement.scrollHeight; that includes a 100dvh minimum.
     natural=Math.max(natural,active.scrollHeight);
     setHeight(Math.max(base,natural+6));
   }else{
     setHeight(base);
   }
 }
 function connect(){
   try{
     const doc=frame.contentDocument;
     if(!doc||!doc.querySelector('#homeScreen'))return;
     screenObserver?.disconnect();contentObserver?.disconnect();resizeObserver?.disconnect();
     innerDoc=doc;activeId='';measured=0;
     // Only the game's *inner document* is removed as a scrolling surface.
     // The roadmap's #roadmapScroll keeps its game-specific stage navigation.
     doc.documentElement.classList.add('jj-in-page-arcade');
     screenObserver=new MutationObserver(queue);
     for(const screen of doc.querySelectorAll('.screen')){
       screenObserver.observe(screen,{attributes:true,attributeFilter:['class']});
     }
     contentObserver=new MutationObserver(queue);
     contentObserver.observe(doc.getElementById('gameGrid'),{childList:true});
     const store=doc.getElementById('storeBody');
     if(store)contentObserver.observe(store,{childList:true,subtree:false});
     if('ResizeObserver' in window){
       resizeObserver=new ResizeObserver(queue);
       const home=doc.querySelector('.home-scroll');
       if(home)resizeObserver.observe(home);
       if(store)resizeObserver.observe(store);
     }
     setHeight(preferredGameHeight());
     queue();
   }catch(error){/* Standalone game still works if frame access fails. */}
 }
 frame.addEventListener('load',connect);
 if(frame.contentDocument?.readyState==='complete')connect();
 window.addEventListener('resize',queue,{passive:true});
})();
