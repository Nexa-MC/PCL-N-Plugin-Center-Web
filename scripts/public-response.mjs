// Cloudflare's observed precursor injection is a delivery-layer addition. Match
// its exact program and constrained opaque fields; never strip arbitrary scripts.
const precursor = /<script>window\.__CF\$cv\$params=\{r:'[a-f0-9]{1,64}',t:'[A-Za-z0-9+/=]{1,128}',u:'[a-f0-9]{1,128}',ut:'[A-Za-z0-9_.-]{1,2048}',i:\d{1,6}\};\(function\(\)\{if\(!document\.body\)return;var s=document\.createElement\('script'\);s\.src='\/cdn-cgi\/challenge-platform\/scripts\/precursor\/main\.js';document\.head\.appendChild\(s\);\}\)\(\);<\/script>(?=<\/body>)/g;
export function canonicalPublicHtml(bytes) {
  const text = bytes.toString('utf8'), matches = [...text.matchAll(precursor)];
  return matches.length === 1 ? Buffer.from(text.replace(precursor, '')) : bytes;
}
