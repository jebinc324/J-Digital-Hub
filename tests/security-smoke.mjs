import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Regression check: multiplayer room data may come from an untrusted peer.
test('multiplayer room names render as text, not HTML', () => {
  const js = readFileSync('public/games/retro-arcade/app.js', 'utf8');
  const line = js.split('\n').find(s => s.startsWith('function bindRoom(){'));
  assert.ok(line, 'bindRoom implementation should exist');

  const room = {
    classList: { add() {}, remove() {} },
    children: [],
    replaceChildren(...nodes) { this.children = nodes; }
  };
  let onRoom;
  const mp = {
    slot: 'host',
    roomCode: 'ABC123',
    onRoom(callback) { onRoom = callback; return () => {}; }
  };
  const context = {
    roomUnsub: null,
    roomState: null,
    window: {JArcadeMultiplayer: mp},
    $: () => room,
    gameById: () => ({title: 'CAR RACE'}),
    document: {
      createElement: tag => ({tagName: tag.toUpperCase(), textContent: ''}),
      createTextNode: value => ({nodeType: 3, nodeValue: String(value)})
    }
  };
  vm.runInNewContext(line + '\nbindRoom();', context);
  assert.equal(typeof onRoom, 'function');

  const payload = '<img src=x onerror=alert(1)>';
  onRoom({
    players: {host: {name:'Host'}, guest:{name:payload}},
    gameId:'race',
    status:'<svg onload=alert(1)>'
  });
  assert.equal(room.children.length, 5);
  assert.equal(room.children[0].tagName, 'B');
  assert.equal(room.children[2].nodeType, 3);
  assert.equal(room.children[2].nodeValue, 'Host vs ' + payload);
  assert.equal(room.children[4].nodeType, 3);
  assert.equal(room.children[4].nodeValue, 'CAR RACE • <svg onload=alert(1)>');
  assert.ok(room.children.every(n => !['IMG','SVG','SCRIPT'].includes(n.tagName)));
});

test('room code generation uses a cryptographic random source', () => {
  const js = readFileSync('public/games/retro-arcade/firebase-multiplayer.js', 'utf8');
  const block = js.split('function makeCode(){')[1]?.split('async function watchRoom')[0];
  assert.ok(block, 'room code generator should exist');
  assert.match(block, /crypto\.getRandomValues/);
  assert.doesNotMatch(block, /Math\.random/);
});
