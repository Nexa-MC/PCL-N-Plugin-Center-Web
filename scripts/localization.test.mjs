import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';

const root = new URL('../', import.meta.url);
const messages = JSON.parse(await readFile(new URL('src/languages/uiMessages.json', root), 'utf8'));
const source = (await readFile(new URL('src/languages/ui.ts', root), 'utf8')).replace("import messages from './uiMessages.json';", `const messages = ${JSON.stringify(messages)};`);
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { translateUi } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const han = /\p{Script=Han}/u;
const slots = text => [...text.matchAll(/\{\d+\}/g)].map(m => m[0]).sort();

test('UI catalog supplies English copy and preserves every interpolation slot', () => {
  assert.ok(Object.keys(messages).length > 900);
  for (const [key, english] of Object.entries(messages)) {
    assert.equal(han.test(english), false, key);
    assert.deepEqual(slots(english), slots(key), key);
    if (!['《', '》'].includes(key)) assert.ok(english.trim(), key);
  }
});

test('dynamic messages can reorder values without translating user content', () => {
  assert.equal(translateUi('距离 Lv{0} 还需 {1} Exp', 'en', [5, '7,150']), '7,150 Exp to Lv5');
  assert.equal(translateUi('移除「{0}」后，该设备无法再用它验证登录。', 'en', ['我的设备']), 'After removing “我的设备”, this device can no longer verify sign-ins.');
  assert.equal(translateUi('距离 Lv5 还需 7,150 Exp', 'en'), '7,150 Exp to Lv5');
  assert.equal(translateUi(' · 月付', 'en'), ' · Monthly');
  assert.equal(translateUi('这是一条用户撰写的工单，不属于界面文案。', 'en'), '这是一条用户撰写的工单，不属于界面文案。');
  assert.equal(translateUi('等级与经验', 'zh'), '等级与经验');
  assert.equal(translateUi('Paddle API key is not configured', 'zh'), 'Paddle 服务凭据尚未配置');
  for (const text of ['constructor', 'toString', '__proto__', '中文姓名']) assert.equal(translateUi(text, 'en'), text);
  assert.equal(translateUi('不存在的消息 {0}', 'en', ['原文']), '不存在的消息 原文');
});

test('authorization errors retain diagnostics and accurately describe a rejected connection', () => {
  const id = 'af1ed424-0d0f-4694-a770-68c5bc77763a';
  assert.equal(translateUi(`Minecraft 服务登录未完成，请稍后重试（HTTP 403；诊断号 ${id}）`, 'en'), `Minecraft service sign-in was not completed. Try again later (HTTP 403; Reference ${id})`);
  assert.equal(translateUi(`Minecraft 接口访问被拒绝，当前无法完成授权，需由管理员处理（HTTP 403；错误码 123；诊断号 ${id}）`, 'en'), `Minecraft rejected the connection. Authorization cannot be completed; an administrator must resolve this (HTTP 403; Error code 123; Reference ${id})`);
  assert.equal(translateUi('未识别的错误（HTTP 403）', 'en'), '未识别的错误（HTTP 403）');
});

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}

test('every static Chinese template message is localized and has a catalog entry', async () => {
  const failures = [];
  for (const file of (await files(fileURLToPath(new URL('src/', root)))).filter(file => file.endsWith('.vue'))) {
    const { descriptor } = parse(await readFile(file, 'utf8'));
    function expression(value) {
      const tree = ts.createSourceFile('expression.ts', `(${value})`, ts.ScriptTarget.Latest, true);
      function visit(node) {
        if (ts.isBinaryExpression(node) && ['===', '!==', '==', '!='].includes(node.operatorToken.getText(tree))) {
          assert.equal(/\$ui\(/.test(node.getText(tree)), false, `translated text must not change control flow: ${file}`);
        }
        if (ts.isCallExpression(node) && node.expression.getText(tree) === '$ui' && ts.isStringLiteral(node.arguments[0])) {
          if (messages[node.arguments[0].text] === undefined) failures.push(`${file}: missing ${node.arguments[0].text}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
    function visit(node) {
      if (node.type === 2 && han.test(node.content)) failures.push(`${file}: unlocalized text ${node.content}`);
      if (node.type === 5) expression(node.content.content);
      if (node.type === 1) for (const prop of node.props) {
        if (prop.type === 6 && prop.value && han.test(prop.value.content)) failures.push(`${file}: unlocalized ${prop.name}`);
        if (prop.type === 7 && prop.exp) expression(prop.exp.content);
      }
      for (const child of node.children ?? []) visit(child);
    }
    if (descriptor.template) visit(descriptor.template.ast);
  }
  assert.deepEqual(failures, []);
});

test('current English legal translations retain section identifiers and key published limits', async () => {
  for (const doc of ['terms', 'privacy', 'publisher', 'refunds']) {
    const chinese = await readFile(new URL(`public/legal/current/${doc}.zh-CN.md`, root), 'utf8');
    const english = await readFile(new URL(`public/legal/current/${doc}.en.md`, root), 'utf8');
    const sections = text => [...text.matchAll(/^#{2,3} (\d+(?:\.\d+)?)\.? /gm)].map(m => m[1]);
    assert.deepEqual(sections(english), sections(chinese), doc);
    assert.match(english, new RegExp(`Version: ${['terms', 'privacy'].includes(doc) ? '1\\.1' : '1\\.0'}`));
    assert.match(english, /support@pcln\.top/);
    assert.match(english, /privacy@pcln\.top/);
  }
  const privacy = await readFile(new URL('public/legal/current/privacy.en.md', root), 'utf8');
  for (const required of ['30 days', '180 days', '396 days', '500 Exp', 'Asia/Shanghai', 'SESSDATA', 'AES-GCM']) assert.ok(privacy.includes(required), required);
});
