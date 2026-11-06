import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const js=readFileSync('admin/media-studio/publisher.js','utf8');
const start=js.indexOf('function updatePageCounts(');
const end=js.indexOf('\nasync function publishApp()',start);
assert.ok(start>=0 && end>start);
const context={releaseBase:'https://github.com/jebinc324/J-Digital-Hub/releases/download/just24-public-v1/',
 families:{Android:'.apk','Revit Add-ins':'.zip','Revit Dynamo':'.zip'}};
vm.runInNewContext(js.slice(start,end),context);
const update=context.updatePageCounts;

test('local publisher edits only labelled stats',()=>{
 const items=[{family:'Android',access:'public',releaseAsset:'test.apk',downloadUrl:context.releaseBase+'test.apk'},
              {family:'Revit Add-ins',access:'public',releaseAsset:'revit.zip',downloadUrl:context.releaseBase+'revit.zip'}];
 const home='<p>Unrelated example 43</p><span data-count-total>43</span>';
 assert.equal(update(home,43,items,false),'<p>Unrelated example 43</p><span data-count-total>2</span>');
 const access='<strong><span data-count-total>43</span> · <span data-count-ready>42</span> · <span data-count-pending>1</span></strong>';
 const out=update(access,43,items,false,true);
 assert.ok(out.includes('data-count-total>2'));
 assert.ok(out.includes('data-count-ready>2'));
 assert.ok(out.includes('data-count-pending>0'));
});

test('local publisher fails closed when markers are missing',()=>{
 assert.throws(()=>update('42 or 43 unrelated',43,[],false),/Missing data-count-total/);
});
