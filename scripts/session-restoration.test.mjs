import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/api/platform.ts', import.meta.url), 'utf8');
const fn = ts.createSourceFile('platform.ts', source, ts.ScriptTarget.Latest, true).statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'mintToken');
const compiled = ts.transpile(fn.getText(), { target: ts.ScriptTarget.ES2022 });
const run = new Function('authFetch', `class ApiError extends Error { constructor(message,status){super(message);this.status=status;} } let accessToken='',currentUser; ${compiled};return mintToken();`);
test('only expired or missing sessions become logged out; service rejection remains an error', async () => {
 assert.equal(await run(async()=>new Response('{}',{status:401})), undefined);
 for(const status of [403,429,500,503]) await assert.rejects(run(async()=>new Response('{}',{status})), e=>e.status===status);
 await assert.rejects(run(async()=>{throw new TypeError('network failure')}), /network failure/);
 const user=await run(async()=>Response.json({token:'fixture',user:{id:'owner'}})); assert.equal(user.id,'owner'); assert.equal(user.scope,'console');
});
