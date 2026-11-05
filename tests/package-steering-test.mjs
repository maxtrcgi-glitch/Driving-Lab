// Separate static test build; canonical physics/module bytes are preserved.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),destination=process.argv[2];if(!destination||!path.isAbsolute(destination))throw Error('Pass absolute NEW test project directory');
const source=path.join(root,'dist'),target=path.join(destination,'dist');if(fs.existsSync(path.join(destination,'.openai/hosting.json')))throw Error('Refuse to overwrite existing site identity');
fs.mkdirSync(target,{recursive:true});fs.cpSync(source,target,{recursive:true});
const fingerprint=crypto.createHash('sha256');for(const name of fs.readdirSync(source).filter(x=>x.endsWith('.js')).sort())fingerprint.update(name).update(fs.readFileSync(path.join(source,name)));
const buildId='v014a52-'+fingerprint.digest('hex').slice(0,12),modules=path.join(target,'modules',buildId);fs.mkdirSync(modules,{recursive:true});
const hashes={};for(const name of fs.readdirSync(source)){if(!name.endsWith('.js'))continue;const data=fs.readFileSync(path.join(source,name));fs.writeFileSync(path.join(modules,name),data);hashes[name]=crypto.createHash('sha256').update(data).digest('hex');}
let html=fs.readFileSync(path.join(target,'index.html'),'utf8').replace('src="./app.js"',`src="./modules/${buildId}/app.js"`).replace('href="./style.css"',`href="./style.css?v=${buildId}"`);
if(!html.includes(`src="./modules/${buildId}/app.js"`))throw Error('Entry replacement failed');fs.writeFileSync(path.join(target,'index.html'),html);
fs.writeFileSync(path.join(target,'BUILD_RECEIPT.json'),JSON.stringify({version:'0.14A.5.2',title:'DRIVING LAB v0.14A.5.2 — Cockpit Seat Adjustment',buildId,moduleDirectory:'modules/'+buildId,hashes,canonicalPhysicsUnmodified:true,physicsChange:'None relative to accepted A.5.1'},null,2));
console.log(JSON.stringify({destination,buildId,moduleFiles:Object.keys(hashes).length}));
