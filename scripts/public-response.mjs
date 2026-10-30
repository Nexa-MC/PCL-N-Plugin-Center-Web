// Cloudflare's observed precursor injection is a delivery-layer addition. Match
// its exact program and constrained opaque fields; never strip arbitrary scripts.
const precursor = /<script>window\.__CF\$cv\$params=\{r:'[a-f0-9]{1,64}',t:'[A-Za-z0-9+/=]{1,128}',u:'[a-f0-9]{1,128}',ut:'[A-Za-z0-9_.-]{1,2048}',i:\d{1,6}\};\(function\(\)\{if\(!document\.body\)return;var s=document\.createElement\('script'\);s\.src='\/cdn-cgi\/challenge-platform\/scripts\/precursor\/main\.js';document\.head\.appendChild\(s\);\}\)\(\);<\/script>(?=<\/body>)/g;
const precursorV2 = new RegExp("<script>window\\.__CF\\$cv\\$params=\\{r:'(?<ray>[a-f0-9]{1,64})',t:'[A-Za-z0-9+/=]{1,128}',u:'[a-f0-9]{1,128}',ut:'[A-Za-z0-9_.-]{1,2048}',i:\\d{1,6}\\};\\(function\\(\\)\\{if\\(!document\\.body\\)return;var\\ l=window\\.location,o;try\\{o=new\\ URL\\(l\\.origin\\)\\.origin\\}catch\\(e\\)\\{try\\{o=new\\ URL\\(new\\ URL\\(l\\.href\\)\\.origin\\)\\.origin\\}catch\\(e\\)\\{o=''\\}\\}var\\ u='/cdn\\-cgi/challenge\\-platform/scripts/precursor/main\\.js\\?ray=\\k<ray>',s=document\\.createElement\\('script'\\);s\\.src=o\\?new\\ URL\\(u,o\\)\\.href:u;document\\.head\\.appendChild\\(s\\);\\}\\)\\(\\);</script>(?=</body>)", 'g');
export function canonicalPublicHtml(bytes) {
  const text = bytes.toString('utf8');
  const matches=[...text.matchAll(precursor),...text.matchAll(precursorV2)];
  return matches.length===1 && text.split('window.__CF$cv$params=').length===2 ? Buffer.from(text.replace(matches[0][0],'')) : bytes;
}
