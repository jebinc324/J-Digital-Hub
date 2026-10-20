(() => {
"use strict";
const REPO="jebinc324/J-Digital-Hub", API="/github/", BRANCH="main";
const $=id=>document.getElementById(id);
const form=$("mediaForm"),selector=$("appSelect"),tokenInput=$("token"),newGroup=$("newAppGroup"),newIdInput=$("newAppId");
const logoInput=$("logoUpload"),shotsInput=$("shotsUpload"),button=$("uploadBtn"),status=$("status");
let currentCatalog=null,loading=false,previews=[];
let loadedScreenshots=null;
const PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function setStatus(message,level){
 status.textContent=message;
 status.className="status"+(level?" "+level:"");
}
function controlBusy(busy){
 loading=busy;button.disabled=busy;
 if($("publishBtn"))$("publishBtn").disabled=busy;
 if($("loadShotsBtn"))$("loadShotsBtn").disabled=busy;
 if($("removeShotsBtn"))$("removeShotsBtn").disabled=busy||!loadedScreenshots||!currentShotSelection().length;
 button.textContent=busy?"Uploading… please do not close this tab":"⬆ Upload & Attach Images";
}
function getID(){
 const selection=selector.value;
 return selection==="__new__"?newIdInput.value.trim():selection;
}
function refreshSelection(){newGroup.hidden=selector.value!=="__new__";}
function cleanPreviews(){previews.forEach(url=>URL.revokeObjectURL(url));previews=[];}
function showFiles(input,containerId){
 const host=$(containerId),files=Array.from(input.files||[]);
 host.replaceChildren();
 for(const file of files.slice(0,8)){
  const tile=document.createElement("div");tile.className="preview-item";
  const img=document.createElement("img"),note=document.createElement("small");
  const url=URL.createObjectURL(file);previews.push(url);
  img.src=url;img.alt=file.name;note.textContent=file.name;
  tile.append(img,note);host.append(tile);
 }
 if(files.length>8){const note=document.createElement("small");note.textContent="Maximum 8 screenshots — select fewer files.";note.style.color="#ffb8bc";host.append(note);}
}
logoInput.addEventListener("change",()=>{cleanPreviews();showFiles(logoInput,"logoPreview");showFiles(shotsInput,"screensPreview");});
shotsInput.addEventListener("change",()=>{cleanPreviews();showFiles(logoInput,"logoPreview");showFiles(shotsInput,"screensPreview");});
selector.addEventListener("change",()=>{refreshSelection();invalidateShots();syncPublishFields();});
async function loadApps(){
 try{
  const response=await fetch("/apps/catalog.json",{cache:"no-store"});
  if(!response.ok)throw Error("Cannot read catalogue.");
  const catalogue=await response.json();
  if(!Array.isArray(catalogue.items))throw Error("Catalogue format invalid");
  currentCatalog=catalogue;
  selector.replaceChildren();
  const option=document.createElement("option");option.value="__new__";option.textContent="＋ Upcoming / New App";selector.append(option);
  for(const app of catalogue.items.slice().sort((a,b)=>a.name.localeCompare(b.name))){
   const opt=document.createElement("option");opt.value=app.id;opt.textContent=app.name;selector.append(opt);
  }
  const expense=[...selector.options].find(o=>o.value==="j-expense-tracker-my-expense-tracker");
  selector.value=expense?expense.value:selector.options[0].value;
  refreshSelection();syncPublishFields();invalidateShots();setStatus("Ready. Choose an app, attach files, and upload.");
 }catch(error){
  selector.replaceChildren();
  setStatus("Unable to load J Apps. Reload this page. "+error.message,"error");
 }
}
async function github(path,method,body,token,allowNotFound){
 const response=await fetch(API+path,{
  method:method||"GET",
  headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28","X-Local-Request":"1",...(body?{"Content-Type":"application/json"}:{})},
  body:body?JSON.stringify(body):undefined,
  cache:"no-store"
 });
 if(allowNotFound&&response.status===404)return null;
 if(!response.ok){
  let detail="";try{const json=await response.json();detail=(json.message||"").slice(0,240);}catch(_){}
  throw Error("GitHub "+response.status+": "+(detail||"Please check token permissions and try again."));
 }
 return response.json();
}
function decodeBase64Text(text){
 const binary=atob(text.replace(/\s+/g,""));
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
}
async function dataToBase64(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(Error("Could not read a selected image."));
  reader.onload=()=>resolve(String(reader.result).split(",")[1]);
  reader.readAsDataURL(blob);
 });
}
async function optimizeImage(file,icon){
 const formats=["image/png","image/jpeg","image/webp"];
 if(!formats.includes(file.type))throw Error("Unsupported image: "+file.name+". Choose PNG, JPG or WebP.");
 if(file.size>12*1024*1024)throw Error(file.name+" is over the 12 MB limit.");
 const image=await new Promise((resolve,reject)=>{
  const src=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(src);resolve(img);};
  img.onerror=()=>{URL.revokeObjectURL(src);reject(Error("Cannot open image: "+file.name));};
  img.src=src;
 });
 if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>10000||image.naturalHeight>10000)throw Error("Image dimensions not supported: "+file.name);
 const canvas=document.createElement("canvas");
 if(icon){canvas.width=512;canvas.height=512;}
 else{
  const ratio=Math.min(1,1500/image.naturalWidth,2400/image.naturalHeight);
  canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
 }
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("Your browser cannot optimize images.");
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 if(icon){const ratio=Math.min(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);
  const w=image.naturalWidth*ratio,h=image.naturalHeight*ratio;
  ctx.drawImage(image,(512-w)/2,(512-h)/2,w,h);
 }else ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const output=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error("Image conversion failed.")),"image/webp",.86));
 if(output.size>3*1024*1024)throw Error(file.name+" cannot be compressed below 3 MB.");
 return dataToBase64(output);
}
function confirmPayload(appId,logo,shots,isNew){
 const desc=(isNew?"Upcoming new app":"Existing app")+" "+appId;
 return window.confirm("Upload "+(logo?"1 logo":"no logo")+" and "+shots.length+" screenshot(s) for "+desc+"?\n\nThe images will be saved to GitHub main branch, and existing app gallery links will update automatically.");
}
function readCurrentItem(catalog,id){return catalog.items.find(x=>x.id===id);}
async function process(event){
 event.preventDefault();
 if(loading)return;
 const id=getID(),token=tokenInput.value.trim();
 const logo=logoInput.files?.[0]||null,shots=Array.from(shotsInput.files||[]);
 const selectedNew=selector.value==="__new__";
 if(!PATTERN.test(id)){setStatus("Enter a valid lowercase app ID. Example: j-my-new-app","error");return;}
 if(!token){setStatus("Paste a fine-grained GitHub token with repository Contents: Read and write.","error");return;}
 if(!logo&&!shots.length){setStatus("Choose at least one logo or screenshot image.","error");return;}
 if(shots.length>8){setStatus("A maximum of 8 screenshots is supported.","error");return;}
 if(!confirmPayload(id,logo,shots,selectedNew))return;
 controlBusy(true);
 try{
  setStatus("Connecting securely to GitHub…");
  const ref=await github("git/ref/heads/"+BRANCH,"GET",null,token);
  const head=ref.object.sha;
  const commit=await github("git/commits/"+encodeURIComponent(head),"GET",null,token);
  const raw=await github("contents/public/apps/catalog.json?ref="+encodeURIComponent(head),"GET",null,token);
  const catalog=JSON.parse(decodeBase64Text(raw.content));
  if(!Array.isArray(catalog.items))throw Error("Repository catalogue invalid.");
  const app=readCurrentItem(catalog,id);
  if(selectedNew&&app)throw Error("App already exists in GitHub. Select it from Existing App and try again.");
  if(!selectedNew&&!app)throw Error("App no longer exists. Refresh and select its current ID.");
  const mediaPath="public/assets/apps/media/"+id+".json";
  const prev=await github("contents/"+mediaPath+"?ref="+encodeURIComponent(head),"GET",null,token,true);
  let media={appId:id,logo:app?.logo||"",screenshots:Array.isArray(app?.screenshots)?app.screenshots.slice():[]};
  if(prev){
   const item=JSON.parse(decodeBase64Text(prev.content));
   if(item.appId===id){media.logo=item.logo||media.logo;media.screenshots=Array.isArray(item.screenshots)?item.screenshots:media.screenshots;}
  }
  const modifications=[];
  if(logo){
   setStatus("Optimizing original app logo…");
   const content=await optimizeImage(logo,true);
   media.logo="/assets/apps/icons/"+id+".webp";
   modifications.push({path:"public"+media.logo,content:content});
  }
  if(shots.length){
   media.screenshots=[];
   for(let i=0;i<shots.length;i++){
    setStatus("Optimizing screenshot "+(i+1)+" of "+shots.length+"…");
    const path="/assets/apps/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".webp";
    modifications.push({path:"public"+path,content:await optimizeImage(shots[i],false)});
    media.screenshots.push(path);
   }
  }
  media={appId:id,logo:media.logo,screenshots:media.screenshots};
  // All images, metadata and existing catalogue fields are committed together.
  modifications.push({path:mediaPath,content:await dataToBase64(new Blob([JSON.stringify(media,null,2)+"\n"],{type:"application/json"}))});
  if(app){
   if(logo)app.logo=media.logo;
   if(shots.length)app.screenshots=media.screenshots.slice();
   modifications.push({path:"public/apps/catalog.json",content:await dataToBase64(new Blob([JSON.stringify(catalog,null,2)+"\n"],{type:"application/json"}))});
  }
  const trees=[];
  for(let i=0;i<modifications.length;i++){
   const change=modifications[i];
   setStatus("Uploading "+(i+1)+" of "+modifications.length+" file(s) to GitHub…");
   const blob=await github("git/blobs","POST",{content:change.content,encoding:"base64"},token);
   trees.push({path:change.path,mode:"100644",type:"blob",sha:blob.sha});
  }
  setStatus("Creating one atomic commit for your images…");
  const tree=await github("git/trees","POST",{base_tree:commit.tree.sha,tree:trees},token);
  const created=await github("git/commits","POST",{
   message:"J Apps media: "+id+" ("+(logo?"logo ":"")+(shots.length?shots.length+" screenshots":"")+")",
   tree:tree.sha,parents:[head]
  },token);
  setStatus("Publishing media to main branch…");
  await github("git/refs/heads/main","PATCH",{sha:created.sha,force:false},token);
  // Successful ref update: all written files are in one commit.
  if(app){
   setStatus("✓ Success! Original images uploaded and linked to "+app.name+". GitHub commit "+created.sha.slice(0,8)+". Wait for Render deploy, then refresh the J Apps page.","success");
  }else{
   setStatus("✓ Success! Images uploaded for upcoming app "+id+" (commit "+created.sha.slice(0,8)+"). Open J Apps Publisher → add, enter this same app ID, and your uploaded images will automatically attach. No paths to copy.","success");
  }
  logoInput.value="";shotsInput.value="";cleanPreviews();$("logoPreview").replaceChildren();$("screensPreview").replaceChildren();invalidateShots();
 }catch(error){
  setStatus("Upload stopped — "+error.message+". No GitHub branch update is considered successful unless you see the success message. If main changed during upload, refresh and retry.","error");
 }finally{controlBusy(false);}
}

/* ─── Private screenshot management and Add / Update / Remove publisher ─── */
const loadShotsBtn=$("loadShotsBtn"),removeShotsBtn=$("removeShotsBtn");
const currentShots=$("currentShots"),removeStatus=$("removeStatus");
const pubMode=$("publishMode"),pubBtn=$("publishBtn"),pubStatus=$("publishStatus");
const releaseBase="https://github.com/"+REPO+"/releases/download/just24-public-v1/";
const families={"Android":".apk","Revit Add-ins":".zip","Revit Dynamo":".zip"};
const categories=["Engineering","Automation","Finance & Trading","Productivity & Files","Media & Creative","Kids & Games","Device & Safety","Lifestyle"];
function publishState(message,kind){
 pubStatus.textContent=message;pubStatus.className="status"+(kind?" "+kind:"");
}
function removeState(message,kind){
 removeStatus.textContent=message;removeStatus.className="status"+(kind?" "+kind:"");
}
function currentShotSelection(){return [...currentShots.querySelectorAll("input[name=removeShot]:checked")].map(x=>x.value);}
function invalidateShots(){
 loadedScreenshots=null;
 currentShots.replaceChildren();
 const p=document.createElement("p");p.className="hint";p.textContent="Click Load Current Screenshots to see this app's gallery.";currentShots.append(p);
 removeShotsBtn.disabled=true;
 removeState("No screenshots selected.");
}
function syncPublishFields(){
 const mode=pubMode.value,added=mode==="add",removing=mode==="remove";
 $("publishFields").hidden=removing;
 $("removeConfirmGroup").hidden=!removing;
 pubBtn.textContent=removing?"✕ Remove App Card":added?"＋ Add New App":"✓ Update App";
 const app=currentCatalog?.items?.find(x=>x.id===getID());
 const version=$("appVersion"),title=$("appName"),description=$("appDescription");
 for(const input of [$("appFilename"),version,title,description,$("removeAppConfirmation")])input.value="";
 $("appCategory").value="";
 version.placeholder=app?.versionLabel||"v1.0.0";
 title.placeholder=app?.name||"J My New App";
 description.placeholder=app?.description||"What the app does";
 $("appFilename").placeholder=app?.releaseAsset||"j-my-app-v1.0.0.apk";
 $("appFamily").value=app?.family||"Android";
 publishState(removing?"Choose an existing app and enter the REMOVE confirmation. GitHub Release file is not deleted.":added?"Choose Upcoming / New App above and enter its details. Upload APK/ZIP to the official Release first.":"Choose an existing app and enter its latest APK/ZIP filename.");
}
pubMode.addEventListener("change",()=>{
 if(pubMode.value==="add"&&selector.value!=="__new__"){selector.value="__new__";refreshSelection();invalidateShots();}
 if(pubMode.value!=="add"&&selector.value==="__new__"){
  const existing=[...selector.options].find(o=>o.value!=="__new__");
  if(existing){selector.value=existing.value;refreshSelection();invalidateShots();}
 }
 syncPublishFields();
});
function imagePathSafe(path){return typeof path==="string"&&/^\/assets\/apps\/[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg)$/i.test(path)&&!path.includes("//");}
function mediaFor(snapshot,id){
 const item=snapshot.app||{},stored=snapshot.manifest;
 if(stored){
  if(stored.appId!==id||!Array.isArray(stored.screenshots)||stored.screenshots.length>8)throw Error("Saved image gallery data is invalid.");
  return {appId:id,logo:stored.logo||item.logo||"",screenshots:stored.screenshots.slice()};
 }
 return {appId:id,logo:item.logo||"",screenshots:Array.isArray(item.screenshots)?item.screenshots.slice():[]};
}
async function getSnapshot(token,id){
 const ref=await github("git/ref/heads/main","GET",null,token);
 const head=ref?.object?.sha;
 if(!/^[a-f0-9]{40}$/.test(head||""))throw Error("Cannot read current main branch revision.");
 const commit=await github("git/commits/"+head,"GET",null,token);
 const raw=await github("contents/public/apps/catalog.json?ref="+head,"GET",null,token);
 const catalog=JSON.parse(decodeBase64Text(raw.content));
 if(!Array.isArray(catalog.items))throw Error("GitHub catalogue is invalid.");
 const app=catalog.items.find(x=>x.id===id)||null;
 const existing=await github("contents/public/assets/apps/media/"+id+".json?ref="+head,"GET",null,token,true);
 const manifest=existing?JSON.parse(decodeBase64Text(existing.content)):null;
 return {head,commit,catalog,app,manifest};
}
async function commitChanges(snapshot,token,changes,message,notify){
 if(!changes.length)throw Error("Nothing was changed.");
 const entries=[];
 for(let i=0;i<changes.length;i++){
  if(notify)notify("Preparing GitHub change "+(i+1)+" / "+changes.length+"…");
  const item=changes[i],blob=await github("git/blobs","POST",{content:await dataToBase64(new Blob([item.content],{type:"text/plain;charset=utf-8"})),encoding:"base64"},token);
  entries.push({path:item.path,mode:"100644",type:"blob",sha:blob.sha});
 }
 const tree=await github("git/trees","POST",{base_tree:snapshot.commit.tree.sha,tree:entries},token);
 const commit=await github("git/commits","POST",{message,tree:tree.sha,parents:[snapshot.head]},token);
 if(notify)notify("Saving the new revision to GitHub main branch…");
 await github("git/refs/heads/main","PATCH",{sha:commit.sha,force:false},token);
 return commit.sha.slice(0,8);
}
async function readTextAt(token,path,ref){
 const raw=await github("contents/"+path+"?ref="+ref,"GET",null,token);
 return decodeBase64Text(raw.content);
}
async function loadCurrentScreenshots(){
 if(loading)return;
 const id=getID(),token=tokenInput.value.trim();
 if(!PATTERN.test(id)){removeState("Select a valid app first.","error");return;}
 if(!token){removeState("Enter your GitHub token first.","error");return;}
 controlBusy(true);
 try{
  removeState("Loading current screenshots directly from GitHub…");
  const snapshot=await getSnapshot(token,id);
  const media=mediaFor(snapshot,id);
  if(!media.screenshots.every(imagePathSafe))throw Error("App gallery contains invalid image paths.");
  loadedScreenshots={id,items:media.screenshots.slice(),head:snapshot.head};
  currentShots.replaceChildren();
  if(!media.screenshots.length){
   const p=document.createElement("p");p.className="hint";p.textContent="This app does not have screenshots to remove.";currentShots.append(p);
   removeState("No screenshots on this app.");
  }else{
   for(let i=0;i<media.screenshots.length;i++){
    const path=media.screenshots[i],label=document.createElement("label");
    label.className="shot-option";
    const image=document.createElement("img");image.loading="lazy";image.alt="Screenshot "+(i+1);
    image.src="https://raw.githubusercontent.com/"+REPO+"/main/public"+path;
    const caption=document.createElement("span");caption.className="shot-caption";
    const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.name="removeShot";checkbox.value=path;
    const title=document.createElement("strong");title.textContent="Remove #"+(i+1);
    caption.append(checkbox,title);label.append(image,caption);currentShots.append(label);
   }
   removeState(media.screenshots.length+" screenshot(s) loaded. Tick only the ones to remove.");
  }
 }catch(error){invalidateShots();removeState("Could not load gallery: "+error.message,"error");}
 finally{controlBusy(false);}
}
loadShotsBtn.addEventListener("click",loadCurrentScreenshots);
currentShots.addEventListener("change",()=>{
 const n=currentShotSelection().length;
 removeShotsBtn.disabled=loading||!loadedScreenshots||n===0;
 removeState(n?String(n)+" screenshot(s) selected for removal.":"No screenshots selected.");
});
async function removeChosenScreenshots(){
 if(loading||!loadedScreenshots)return;
 const id=getID(),token=tokenInput.value.trim();
 const selected=currentShotSelection();
 if(id!==loadedScreenshots.id){removeState("App selection changed. Reload screenshots.","error");return;}
 if(!selected.length)return;
 if(!window.confirm("Remove "+selected.length+" screenshot(s) from the "+id+" website gallery?\n\nThe original image files will remain in GitHub for recovery. This does not delete the app or its logo."))return;
 controlBusy(true);
 try{
  removeState("Checking for newer GitHub changes…");
  const snapshot=await getSnapshot(token,id);
  const media=mediaFor(snapshot,id);
  if(snapshot.head!==loadedScreenshots.head||JSON.stringify(media.screenshots)!==JSON.stringify(loadedScreenshots.items)){
   throw Error("Repository changed after you loaded screenshots. Click Load Current Screenshots and try again.");
  }
  const remaining=media.screenshots.filter(path=>!selected.includes(path));
  if(remaining.length===media.screenshots.length)throw Error("None of the selected screenshots is attached to this app.");
  media.screenshots=remaining;
  const files=[{path:"public/assets/apps/media/"+id+".json",content:JSON.stringify(media,null,2)+"\n"}];
  if(snapshot.app){snapshot.app.screenshots=remaining.slice();files.push({path:"public/apps/catalog.json",content:JSON.stringify(snapshot.catalog,null,2)+"\n"});}
  const sha=await commitChanges(snapshot,token,files,"J Apps media: unlink "+selected.length+" screenshots from "+id,message=>removeState(message));
  invalidateShots();
  removeState("✓ Removed "+selected.length+" screenshot(s) from the "+id+" website gallery. Commit "+sha+". Refresh after Render deploy. Original image files remain on GitHub.","success");
 }catch(error){removeState("Removal stopped: "+error.message,"error");}
 finally{controlBusy(false);}
}
removeShotsBtn.addEventListener("click",removeChosenScreenshots);
function updatePageCounts(html,oldCount,items,isApps){
 const total=items.length;
 const countRe=new RegExp("(?<![\\w.])"+oldCount+"(?![\\w.])","g");
 if(!countRe.test(html))throw Error("Could not locate current project count on a website page.");
 html=html.replace(new RegExp("(?<![\\w.])"+oldCount+"(?![\\w.])","g"),String(total));
 if(isApps){
  for(const family of ["all",...Object.keys(families)]){
   const amount=family==="all"?total:items.filter(x=>x.family===family).length;
   const re=new RegExp('(<button[^>]*data-family="'+family+'"[^>]*>[^<]*<span>)\\d+(</span>)');
   if(!re.test(html))throw Error("Cannot safely update "+family+" filter count.");
   html=html.replace(re,(_whole,before,after)=>before+amount+after);
  }
  const ready=items.filter(item=>item.access==="public"&&item.releaseAsset&&item.downloadUrl===releaseBase+item.releaseAsset).length;
  html=html.replace(/(<strong id="j-ready-count">)\d+/,(_m,b)=>b+ready)
    .replace(/(<strong id="j-pending-count">)\d+/,(_m,b)=>b+(total-ready))
    .replace(/(<span id="j-progress-label">)\d+ ready · \d+ pending/,(_m,b)=>b+ready+" ready · "+(total-ready)+" pending");
 }
 return html;
}
async function publishApp(){
 if(loading)return;
 const id=getID(),token=tokenInput.value.trim(),mode=pubMode.value,adding=mode==="add",removing=mode==="remove";
 const filename=$("appFilename").value.trim(),version=$("appVersion").value.trim();
 const appName=$("appName").value.trim(),description=$("appDescription").value.trim();
 const family=$("appFamily").value,category=$("appCategory").value;
 if(!PATTERN.test(id)){publishState("Select an existing app or enter a valid new app ID.","error");return;}
 if(!token){publishState("Enter your GitHub token in the authorization field first.","error");return;}
 if(adding!== (selector.value==="__new__")){publishState(adding?"Choose Upcoming / New App above.":"Choose an existing app above.","error");return;}
 if(removing){
  if($("removeAppConfirmation").value.trim()!=="REMOVE:"+id){publishState("Type exactly REMOVE:"+id+" to confirm app removal.","error");return;}
  if(!window.confirm("REMOVE APP CARD: "+id+"?\n\nThe public website card will disappear after deploy. APK binaries and uploaded images will NOT be deleted."))return;
 }else{
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(apk|zip)$/i.test(filename)){publishState("Enter the exact APK/ZIP filename, not a URL.","error");return;}
  if(version&&!/^v?[0-9][0-9a-zA-Z.+_-]{0,39}$/.test(version)){publishState("Version must look like v1.0.0.","error");return;}
  if(adding&&(!version||!appName||!description)){publishState("New apps require version, title and description.","error");return;}
  if(!Object.hasOwn(families,family)||category&&!categories.includes(category)){publishState("Choose a valid family and category.","error");return;}
  if(!window.confirm((adding?"ADD":"UPDATE")+" "+id+" using "+filename+"?\n\nThis will update GitHub catalogue and the website after Render deploy."))return;
 }
 controlBusy(true);
 try{
  publishState("Checking latest catalogue in GitHub…");
  const snapshot=await getSnapshot(token,id),catalog=snapshot.catalog,items=catalog.items;
  const oldCount=items.length,existing=snapshot.app;
  if(adding&&existing)throw Error("App already exists. Choose Update mode.");
  if(!adding&&!existing)throw Error("App not found. Choose Add mode or refresh.");
  const date=new Date().toISOString().slice(0,10);
  let ready=0;
  if(removing){
   if(items.length<=1)throw Error("Refusing to remove the last app.");
   catalog.items=items.filter(item=>item.id!==id);
   if(Array.isArray(catalog.launch?.unverifiedBuilds))catalog.launch.unverifiedBuilds=catalog.launch.unverifiedBuilds.filter(name=>name!==id);
  }else{
   if(filename.slice(-families[existing?.family||family].length).toLowerCase()!==families[existing?.family||family])throw Error("File extension does not match app family.");
   publishState("Verifying "+filename+" from the official GitHub Release…");
   const response=await fetch("/apps/release.json",{cache:"no-store"});
   if(!response.ok)throw Error("Could not verify the GitHub Release.");
   const release=await response.json(),assets=release.assets||[];
   if(release.tag_name!=="just24-public-v1")throw Error("Wrong GitHub Release.");
   const matches=assets.filter(asset=>asset.name===filename);
   if(matches.length!==1)throw Error("Asset not found in official GitHub Release. Upload the exact APK/ZIP filename first.");
   const asset=matches[0],digest=String(asset.digest||"").match(/^sha256:([a-f0-9]{64})$/i);
   if(asset.browser_download_url!==releaseBase+filename||!Number.isSafeInteger(asset.size)||asset.size<=0||!digest)throw Error("Release file URL, size or SHA-256 cannot be verified.");
   const media=mediaFor(snapshot,id);
   if(media.logo&&!imagePathSafe(media.logo))throw Error("Logo path is invalid.");
   if(!media.screenshots.every(imagePathSafe))throw Error("Screenshot gallery paths are invalid.");
   let item;
   if(adding){
    item={id,name:appName,family,type:family==="Android"?"Android app":family==="Revit Add-ins"?"Revit add-in":"Dynamo script",access:"public",
      description,versionLabel:version,category:category||(family==="Android"?"Productivity & Files":"Engineering"),
      note:"Release uploaded; installation, signing and functionality are not independently verified."};
    items.push(item);
   }else{
    item=existing;
    if(appName)item.name=appName;
    if(description)item.description=description;
    if(version)item.versionLabel=version;
    if(category)item.category=category;
   }
   if(media.logo)item.logo=media.logo;
   if(snapshot.manifest&&Array.isArray(media.screenshots))item.screenshots=media.screenshots.slice();
   item.uploadedFile=true;
   item.releaseAsset=filename;
   item.downloadUrl=releaseBase+filename;
   item.approxSizeMB=Math.round(asset.size/1048576*100)/100;
   item.verifiedUpload={file:filename,sizeBytes:asset.size,sha256:digest[1].toLowerCase()};
   item.launchStatus="uploaded-unverified";
   catalog.release.lastVerified=date;
   catalog.launch.currentReleaseAssets=assets.length;
  }
  catalog.launch.updatedAt=date;
  catalog.launch.listedProjects=catalog.items.length;
  if(catalog.items.length!==oldCount){
   catalog.notice=String(catalog.notice||"").replace("all "+oldCount+" project download files","all "+catalog.items.length+" project download files");
  }
  const changes=[{path:"public/apps/catalog.json",content:JSON.stringify(catalog,null,2)+"\n"}];
  if(adding||removing){
   publishState("Updating website download counts…");
   for(const page of ["public/index.html","public/apps/index.html"]){
    const html=await readTextAt(token,page,snapshot.head);
    changes.push({path:page,content:updatePageCounts(html,oldCount,catalog.items,page==="public/apps/index.html")});
   }
  }
  const sha=await commitChanges(snapshot,token,changes,"J Apps local Publisher "+mode+": "+id,message=>publishState(message));
  const action=adding?"Added":removing?"Removed":"Updated";
  publishState("✓ "+action+" "+id+" successfully. GitHub commit "+sha+". Wait for Render deploy, then verify the J Apps website. Published APK files and other apps stay intact.","success");
  // Avoid reloading the public catalogue before Render deploy: it may still be
  // stale and would erase the success message. The next session refreshes it.
  invalidateShots();
 }catch(error){publishState("Publisher stopped: "+error.message+" If the main branch changed, reload and try again.","error");}
 finally{controlBusy(false);}
}
pubBtn.addEventListener("click",publishApp);

form.addEventListener("submit",process);
window.addEventListener("pagehide",cleanPreviews);
loadApps();
})();