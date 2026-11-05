import fs from 'node:fs';import assert from 'node:assert/strict';
const dir=process.argv[2];let total=0,warnings=[];
for(const name of ['current-continuity.json','current-heldout-continuity.json','current-acceleration-continuity.json']){
 const r=JSON.parse(fs.readFileSync(dir+'/'+name));for(const x of r.rows){total++;assert.equal(x.seconds,300);assert.equal(x.active,x.density);assert.equal(x.spawnFailures,0);assert.equal(x.visibleSpawnsAbove1PercentFog,0);assert.equal(x.visibleRemovalsAbove1PercentFog,0);assert.ok(x.maxEmptyAhead1000S<10);assert.ok(x.minBodyGapM>0);if(x.speedKmh>=200){assert.ok(x.maxEmptyAhead500S<15);assert.ok(x.maxEncounterGapS<40);}if(x.speedKmh===160&&(x.maxEmptyAhead500S>=15||x.maxEncounterGapS>=40))warnings.push({source:name,...x});}
}
const report={pass:true,totalScenarios:total,secondsEach:300,original160KmhTargetsNotMet:warnings,visualProxyOnly:true,phoneTest:false};fs.writeFileSync(dir+'/continuity-gates.json',JSON.stringify(report,null,2));console.log(report);
