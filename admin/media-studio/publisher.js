(() => {
"use strict";
const REPO="jebinc324/J-Digital-Hub", API="/github/", BRANCH="main";
const $=id=>document.getElementById(id);
const form=$("mediaForm"),selector=$("appSelect"),tokenInput=$("token"),newGroup=$("newAppGroup"),newIdInput=$("newAppId");
const logoInput=$("logoUpload"),shotsInput=$("shotsUpload"),button=$("uploadBtn"),status=$("status");
let currentCatalog=null,loading=false,previews=[];
const PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function setStatus(message,level){
 status.textContent=message;
 status.className="status"+(level?" "+level:"");
}
function controlBusy(busy){
 loading=busy;button.disabled=busy;
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
selector.addEventListener("change",refreshSelection);
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
  refreshSelection();setStatus("Ready. Choose an app, attach files, and upload.");
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
  logoInput.value="";shotsInput.value="";cleanPreviews();$("logoPreview").replaceChildren();$("screensPreview").replaceChildren();
 }catch(error){
  setStatus("Upload stopped — "+error.message+". No GitHub branch update is considered successful unless you see the success message. If main changed during upload, refresh and retry.","error");
 }finally{controlBusy(false);}
}
form.addEventListener("submit",process);
window.addEventListener("pagehide",cleanPreviews);
loadApps();
})();