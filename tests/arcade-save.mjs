import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync('public/games/retro-arcade/app.js', 'utf8');
const start = source.indexOf("const SAVE_KEY=");
const end = source.indexOf("// One-time v0.2.1 migration:", start);
assert.ok(start >= 0 && end > start, 'save-state functions must remain testable');
const snippet = source.slice(start, end);
const GAMES = ['race','blocks','shooter','brick','match','pipe','crane','circuit','traffic','gear','arrow','bird'].map(id=>({id}));

function load(raw, readError=false, writeError=false) {
  const writes = [];
  const storage = {
    getItem() { if(readError)throw Error('Storage unavailable'); return raw; },
    setItem(key,value) { if(writeError)throw Error('Quota'); writes.push([key,value]); }
  };
  const context={GAMES,MAX_STAGE:1000,localStorage:storage};
  vm.runInNewContext(snippet,context);
  const result=vm.runInNewContext('({state, saved:saveState()})',context);
  return {...result,writes};
}

test('missing, null and malformed saves recover',()=>{
  for(const raw of ['{}','null','{"lives":null}','{"boosters":null}', '{broken', '{"points":"<img src=x>"}']) {
    const {state}=load(raw);
    assert.equal(typeof state.points,'number');
    assert.equal(state.unlocked.race,1);
    assert.equal(state.lives.race.count,3);
    assert.equal(state.boosters.race.power,0);
  }
});

test('valid stage, wallet, lives and boosters survive migration',()=>{
  const {state}=load(JSON.stringify({webVersion:'0.2.1',points:125,unlocked:{pipe:450},lives:{pipe:{count:0,last:12345}},boosters:{pipe:{power:7}}}));
  assert.equal(state.points,125);
  assert.equal(state.unlocked.pipe,450);
  assert.equal(state.lives.pipe.count,0);
  assert.equal(state.boosters.pipe.power,7);
});

test('hostile or out-of-range state values are safely normalized',()=>{
  const {state}=load(JSON.stringify({theme:'maybe',fontColor:'red',points:-500,highs:{race:'<svg>'},unlocked:{pipe:100000},lives:{race:{count:-7,last:99999999999999}},boosters:{pipe:{power:1e50}}}));
  assert.equal(state.theme,'light');
  assert.equal(state.fontColor,null);
  assert.equal(state.points,0);
  assert.equal(state.highs.race,0);
  assert.equal(state.unlocked.pipe,1000);
  assert.equal(state.lives.race.count,0);
  assert.equal(state.boosters.pipe.power,100000);
});

test('blocked localStorage never prevents initialization or save',()=>{
  assert.equal(load(null,true,true).saved,false);
  assert.equal(load('{}',false,true).state.lives.race.count,3);
});
