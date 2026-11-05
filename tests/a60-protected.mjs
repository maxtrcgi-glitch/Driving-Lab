import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/a52-dist.json')).files,allowed=new Set(['highway.js','app.js','index.html']);let protectedFiles=0;
for(const [name,sha] of Object.entries(baseline))if(!allowed.has(name)){assert.equal(createHash('sha256').update(fs.readFileSync('dist/'+name)).digest('hex'),sha,name+' must remain exact A52');protectedFiles++;}
assert.equal(protectedFiles,31);console.log({passed:true,protectedFiles,allowedTrafficAndVersionChanges:[...allowed]});

