import messages from './uiMessages.json';

type Language = 'zh' | 'en' | string;
const english: Readonly<Record<string, string>> = messages;
const lookup = (key: string) => Object.prototype.hasOwnProperty.call(english, key) ? english[key] : undefined;
const chinese: Readonly<Record<string, string>> = {
  DOCUMENTATION: '文档',
  'Paddle API key is not configured': 'Paddle 服务凭据尚未配置',
  'PADDLE_ENV is not set or invalid (sandbox/production)': 'Paddle 环境未配置或无效（sandbox/production）',
  'Paddle webhook signing secret is not configured': 'Paddle 回调签名密钥尚未配置'
};
const placeholder = /\{(\d+)\}/g;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.entries(english).filter(([key]) => /\{\d+\}/.test(key) && !key.startsWith('<!doctype')).map(([key, translation]) => {
  const indices: number[] = [];
  let start = 0, source = '^';
  for (const match of key.matchAll(placeholder)) {
    source += escapeRegex(key.slice(start, match.index)) + '([\\s\\S]+?)';
    indices.push(Number(match[1]));
    start = match.index + match[0].length;
  }
  return { regex: new RegExp(source + escapeRegex(key.slice(start)) + '$'), indices, translation };
});

function format(value: string, parameters: readonly unknown[]) {
  return value.replace(placeholder, (match, index: string) => Number(index) < parameters.length ? String(parameters[Number(index)] ?? '') : match);
}

/** Translate owned UI messages only. Unknown text, including user content, stays intact. */
export function translateUi(value: unknown, language: Language, parameters?: readonly unknown[]): string {
  const text = value == null ? '' : String(value);
  if (language !== 'en') {
    const localized = Object.prototype.hasOwnProperty.call(chinese, text) ? chinese[text] : text;
    return parameters ? format(localized, parameters) : localized;
  }
  const translated = lookup(text);
  if (translated !== undefined) return parameters ? format(translated, parameters) : translated;
  if (!parameters) {
    // Auth's safe diagnostic suffix is structured. Preserve status, code and ID exactly.
    const diagnostic = /^(.*)（((?:HTTP \d{3}|错误码 \d+|诊断号 [0-9a-f-]{36})(?:；(?:HTTP \d{3}|错误码 \d+|诊断号 [0-9a-f-]{36}))*)）$/.exec(text);
    if (diagnostic && lookup(diagnostic[1])) {
      const details = diagnostic[2].split('；').map(part => translateUi(part, language));
      return `${lookup(diagnostic[1])} (${details.join('; ')})`;
    }
    for (const pattern of patterns) {
      const match = pattern.regex.exec(text);
      if (match) {
        const values: string[] = [];
        pattern.indices.forEach((index, i) => { values[index] = match[i + 1]; });
        return format(pattern.translation, values);
      }
    }
  }
  return parameters ? format(text, parameters) : text;
}
