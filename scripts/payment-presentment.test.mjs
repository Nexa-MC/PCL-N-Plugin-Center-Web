import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentPresentments } from '../src/utils/paymentPresentment.ts';
import { browserPresentmentCurrency, browserRegionalPricing } from '../src/config/regionalPricing.ts';
test('Chinese billing hint preserves USD price currency while permitting CNY presentment',()=>{
 assert.equal(browserPresentmentCurrency(['zh-CN']),'CNY');assert.equal(browserRegionalPricing(['zh-CN']).currency,'USD');
 assert.equal(browserPresentmentCurrency(['zh-HK']),'HKD');assert.equal(browserPresentmentCurrency(['invalid_!','ja']),'JPY');
});
test('actual payment records retain provider amounts and reject malformed input',()=>{
 const row={id:'p',currency:'CNY',amount:'15.01',paidAt:'2026-10-26T00:00:00Z'};
 assert.deepEqual(paymentPresentments({payments:[row]}),[row]);
 for(const patch of [{currency:'usd'},{amount:'-1'},{amount:'1e3'},{paidAt:'invalid'}])assert.throws(()=>paymentPresentments({payments:[{...row,...patch}]}));
 assert.deepEqual(paymentPresentments({payments:[]}),[]);assert.throws(()=>paymentPresentments({}));
});
