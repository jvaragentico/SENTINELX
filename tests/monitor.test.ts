import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyTransaction,contributionScore,isStale} from '../src/lib/monitor';
test('large flow threshold is exact and does not declare maliciousness',()=>{assert.equal(classifyTransaction({hash:'0x01',to:null,value:10n**19n-1n,input:'0x'},'3'),null);const o=classifyTransaction({hash:'0x01',to:null,value:10n**19n,input:'0x'},'3');assert.equal(o?.severity,'medium');assert.match(o!.detail,/does not establish malicious/);});
test('duplicate transaction yields stable replay key',()=>{const tx={hash:'0xabc',to:'0xdef',value:11n*10n**18n,input:'0x'};assert.equal(classifyTransaction(tx,'4')?.id,classifyTransaction(tx,'4')?.id);});
test('oracle missing future and stale timestamps fail',()=>{assert.equal(isStale(0n,100n,20n),true);assert.equal(isStale(101n,100n,20n),true);assert.equal(isStale(79n,100n,20n),true);assert.equal(isStale(80n,100n,20n),false);});
test('bond alone cannot earn and score caps resist concentration',()=>{assert.equal(contributionScore(0,2,1e9,1,1),0);assert.equal(contributionScore(100,10,1e9,2,2),20000);assert.equal(contributionScore(1,1,100,1,0),0);assert.throws(()=>contributionScore(NaN,1,1,1,1));assert.throws(()=>contributionScore(1,-1,1,1,1));});
