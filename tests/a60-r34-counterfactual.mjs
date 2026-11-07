// Offline sensitivity probe using the original 27-scenario road-space observer.
// Run only with --measure-only. Neither variant is a release candidate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const variant=process.argv.find(x=>x.startsWith('--variant='))?.slice(10);
assert.ok(process.argv.includes('--measure-only'));
const sourcePath=path.resolve('dist/highway.js');
let source=fs.readFileSync(sourcePath,'utf8');
const changes={
 'without-hold':['if(best>=0&&!(intention.state===\'EXECUTE_PASS\'&&!intention.passCompleted)){','if(best>=0){'],
 'without-reconsider':['const eligible=!car.changing&&car.cooldown<=0&&this.clock>=intention.reconsiderAt;','const eligible=!car.changing&&car.cooldown<=0;'],
};
const change=changes[variant];assert.ok(change,'Choose without-hold or without-reconsider');
assert.equal(source.split(change[0]).length,2,'Audit probe must match one production branch');
source=source.replace(...change).replace(/from '\.\/([^']+)'/g,(_,name)=>'from '+JSON.stringify(pathToFileURL(path.join(path.dirname(sourcePath),name)).href));
const moduleURL='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const replay=fs.readFileSync('tests/a60-visible-flow.mjs','utf8').replace("'../dist/highway.js'",JSON.stringify(moduleURL));
await import('data:text/javascript;base64,'+Buffer.from(replay).toString('base64'));
