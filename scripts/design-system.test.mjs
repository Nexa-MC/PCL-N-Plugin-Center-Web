import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const css = await readFile(new URL('../src/styles/design-system.css', import.meta.url), 'utf8');
function palette(selector) { const block = css.slice(css.indexOf(selector + ' {')).split('}')[0]; return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[a-f0-9]{6});/gi)].map(m => [m[1], m[2]])); }
function luminance(hex) { return hex.slice(1).match(/../g).map(s => {const x=parseInt(s,16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0); }
function contrast(a,b) { const [high,low]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(high+.05)/(low+.05); }
for (const mode of ['html:root','html.dark']) test(`${mode} text, actions and semantic states meet AA contrast`,()=>{
 const p=palette(mode);for(const [foreground,background] of [['--market-text','--market-surface'],['--market-muted','--market-bg'],['--market-muted','--market-surface'],['--nc-accent','--market-surface'],['--nc-on-accent','--nc-accent'],['--ui-danger','--ui-danger-soft'],['--ui-warning','--ui-warning-soft']]) assert.ok(contrast(p[foreground],p[background])>=4.5, `${foreground} on ${background}`);
});
