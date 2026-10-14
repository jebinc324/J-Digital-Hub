const cfg = window.J_ARCADE_FIREBASE_CONFIG || {};
const configured = Boolean(cfg.apiKey && cfg.authDomain && cfg.databaseURL && cfg.projectId && cfg.appId);

const api = {
  enabled: false,
  roomCode: null,
  uid: null,
  slot: null,
  room: null,
  _roomUnsub: null,
  _callbacks: new Set(),
  onRoom(cb){ this._callbacks.add(cb); return () => this._callbacks.delete(cb); },
  _emit(data){ this.room = data; this._callbacks.forEach(cb => { try{ cb(data); }catch(e){ console.error(e); } }); },
  async createRoom(){ throw new Error('Firebase multiplayer is not configured.'); },
  async joinRoom(){ throw new Error('Firebase multiplayer is not configured.'); },
  async updateScore(){},
  async selectGame(){},
  async setReady(){},
  async leave(){}
};
window.JArcadeMultiplayer = api;
window.dispatchEvent(new CustomEvent('jarcade-multiplayer-ready', {detail:{enabled:false}}));

if (!configured) {
  // Keep the whole site fully playable in solo mode.
} else {
  try {
    const APP_VER = '12.19.0';
    const [{initializeApp}, authMod, dbMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${APP_VER}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${APP_VER}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${APP_VER}/firebase-database.js`)
    ]);

    const {getAuth, signInAnonymously} = authMod;
    const {getDatabase, ref, get, set, update, onValue, remove, onDisconnect, serverTimestamp} = dbMod;
    const app = initializeApp(cfg);
    const auth = getAuth(app);
    const db = getDatabase(app);
    const cred = await signInAnonymously(auth);
    api.uid = cred.user.uid;
    api.enabled = true;

    function makeCode(){
      const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let out='';
      for(let i=0;i<6;i++) out += chars[Math.floor(Math.random()*chars.length)];
      return out;
    }

    async function watchRoom(code){
      if(api._roomUnsub) api._roomUnsub();
      const roomRef = ref(db, `rooms/${code}`);
      api._roomUnsub = onValue(roomRef, snap => {
        const data = snap.val();
        api._emit(data);
        if(!data){ api.roomCode=null; api.slot=null; }
      });
      await onDisconnect(ref(db, `rooms/${code}/players/${api.slot}/online`)).set(false);
    }

    api.createRoom = async function(name='Player', gameId='car'){
      let code='';
      for(let tries=0;tries<8;tries++){
        code = makeCode();
        const snap = await get(ref(db, `rooms/${code}`));
        if(!snap.exists()) break;
        code='';
      }
      if(!code) throw new Error('Could not create a unique room. Try again.');
      const now = serverTimestamp();
      await set(ref(db, `rooms/${code}`), {
        createdAt: now,
        hostUid: api.uid,
        gameId,
        status:'lobby',
        startAt:0,
        players:{
          host:{uid:api.uid,name:String(name).slice(0,16),score:0,ready:false,online:true}
        }
      });
      api.roomCode=code; api.slot='host';
      await watchRoom(code);
      return code;
    };

    api.joinRoom = async function(code, name='Player'){
      code=String(code||'').trim().toUpperCase();
      if(code.length!==6) throw new Error('Enter the 6-character room code.');
      const roomRef=ref(db,`rooms/${code}`);
      const snap=await get(roomRef);
      if(!snap.exists()) throw new Error('Room not found.');
      const room=snap.val();
      if(room.players?.guest?.uid && room.players.guest.uid!==api.uid) throw new Error('Room is full.');
      await update(roomRef, {
        'players/guest':{uid:api.uid,name:String(name).slice(0,16),score:0,ready:false,online:true},
        status:'lobby'
      });
      api.roomCode=code; api.slot='guest';
      await watchRoom(code);
      return code;
    };

    api.selectGame = async function(gameId){
      if(!api.roomCode || api.slot!=='host') return;
      await update(ref(db,`rooms/${api.roomCode}`), {gameId, status:'lobby', startAt:0});
      await update(ref(db,`rooms/${api.roomCode}/players/host`), {ready:false,score:0});
      const guestSnap=await get(ref(db,`rooms/${api.roomCode}/players/guest`));
      if(guestSnap.exists()) await update(ref(db,`rooms/${api.roomCode}/players/guest`), {ready:false,score:0});
    };

    api.updateScore = async function(score){
      if(!api.roomCode || !api.slot) return;
      await update(ref(db,`rooms/${api.roomCode}/players/${api.slot}`), {score:Number(score)||0, online:true});
    };

    api.setReady = async function(ready=true){
      if(!api.roomCode || !api.slot) return;
      await update(ref(db,`rooms/${api.roomCode}/players/${api.slot}`), {ready:Boolean(ready),online:true});
      const snap=await get(ref(db,`rooms/${api.roomCode}`));
      const r=snap.val();
      if(api.slot==='host' && r?.players?.host?.ready && r?.players?.guest?.ready){
        await update(ref(db,`rooms/${api.roomCode}`), {status:'countdown', startAt:Date.now()+3200});
      }
    };

    api.setPlaying = async function(){
      if(!api.roomCode || api.slot!=='host') return;
      await update(ref(db,`rooms/${api.roomCode}`), {status:'playing'});
    };

    api.leave = async function(){
      if(!api.roomCode || !api.slot) return;
      const code=api.roomCode, slot=api.slot;
      if(slot==='host'){
        await remove(ref(db,`rooms/${code}`));
      } else {
        await remove(ref(db,`rooms/${code}/players/guest`));
        await update(ref(db,`rooms/${code}`), {status:'lobby',startAt:0});
      }
      if(api._roomUnsub) api._roomUnsub();
      api.roomCode=null; api.slot=null; api.room=null;
      api._emit(null);
    };

    window.dispatchEvent(new CustomEvent('jarcade-multiplayer-ready', {detail:{enabled:true}}));
  } catch (err) {
    console.error('Firebase multiplayer init failed:', err);
    api.enabled=false;
    window.dispatchEvent(new CustomEvent('jarcade-multiplayer-error', {detail:{message:err.message}}));
  }
}
