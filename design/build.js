const fs=require('fs');
const SRC=fs.readFileSync('./shell.html','utf8');
const snip=n=>fs.readFileSync(n,'utf8');
const APPS={
  mirror:{repo:'robocopy-gui',tool:'Robocopy',name:'Mirror',tile:'m',icon:'mirror',color:'#0A7660',
    other:{key:'fetch',name:'Fetch',bin:'wget',tile:'f',icon:'fetch',url:'https://ar-puuk.github.io/wget-gui/'},
    desc:'Build Robocopy commands visually for backups, syncs and moves. Every option explained, risky ones flagged, jobs exported as one script. Runs in your browser.',
    defaults:"{mode:'copy',subs:'e',retries:'3',wait:'5'}"},
  fetch:{repo:'wget-gui',tool:'Wget',name:'Fetch',tile:'f',icon:'fetch',color:'#BA4F0A',
    other:{key:'mirror',name:'Mirror',bin:'robocopy',tile:'m',icon:'mirror',url:'https://ar-puuk.github.io/robocopy-gui/'},
    desc:'Build Wget commands visually to download a file, a folder of files or a whole site. Every option explained, risky ones flagged, jobs exported as one script. Runs in your browser.',
    defaults:"{mode:'single',tries:'5'}"}
};
function rep(h,from,to,why){if(!h.includes(from))throw new Error('missing: '+(why||from.slice(0,70)));return h.split(from).join(to);}
function between(h,a,b,why){const i=h.indexOf(a),j=h.indexOf(b,i+1);if(i<0||j<0)throw new Error('missing range: '+why);return [i,j];}

function build(app){
  const A=APPS[app],o=A.other;
  const style=SRC.match(/<style>([\s\S]*?)<\/style>/)[1];
  let body=SRC.slice(SRC.indexOf('</style>')+8);
  let script=body.match(/<script>([\s\S]*)<\/script>/)[1];
  body=body.replace(/<script>[\s\S]*<\/script>/,'').trim();

  /* markup */
  body=rep(body,'<div class="app" id="app" data-module="mirror">',`<div class="app" id="app" data-module="${app}">`);
  body=rep(body,'<a class="brand" href="#mirror"',`<a class="brand" href="#${app}"`);
  const tools=`<nav class="rail-group" aria-label="Tools">
      <span>Tools</span>
      <a class="nav" href="#${app}" data-r="${app}"><span class="tile ${A.tile}"><svg class="ic"><use href="#i-${A.icon}"/></svg></span>${A.name}</a>
      <a class="nav" href="${o.url}" rel="noopener"><span class="tile ${o.tile}"><svg class="ic"><use href="#i-${o.icon}"/></svg></span>${o.name}<svg class="ic" style="margin-left:auto;width:14px;height:14px"><use href="#i-ext"/></svg></a>
    </nav>`;
  let [i,j]=between(body,'<nav class="rail-group" aria-label="Tools">','</nav>','tools nav');
  body=body.slice(0,i)+tools+body.slice(j+6);
  [i,j]=between(body,'<nav class="rail-group" aria-label="Reference">','</nav>','reference nav');
  body=body.slice(0,i)+body.slice(j+6);

  /* script: keep one tool */
  {
    const a=script.indexOf('\nmirror:{'),b=script.indexOf('\nfetch:{'),c=script.indexOf('}};\n\n/* ------------------------------------------------------------------ engine */');
    if(a<0||b<0||c<0)throw new Error('module markers');
    const mirrorTxt=script.slice(a+1,b),fetchTxt=script.slice(b+1,c+1);
    const keep=app==='mirror'?mirrorTxt.replace(/,\s*$/,''):fetchTxt;
    script=script.slice(0,a+1)+keep+script.slice(c+1);
  }
  script=script.replace(/  defaults:\{[^\n]*\},\n  need/,()=>`  defaults:${A.defaults},\n  need`);
  script=script.split('\n').map(l=>l.includes('set:{')?l.split('D:\\\\Logs\\\\').join('%USERPROFILE%\\\\Documents\\\\'):l).join('\n');

  script=rep(script,"'use strict';",`'use strict';\nconst APP='${app}',OTHER=${JSON.stringify(o)};`);
  script=rep(script,"const S={mirror:{...blank(MODULES.mirror),...MODULES.mirror.defaults},fetch:{...blank(MODULES.fetch),...MODULES.fetch.defaults}};","const S={};Object.keys(MODULES).forEach(k=>{S[k]={...blank(MODULES[k]),...MODULES[k].defaults}});");
  script=rep(script,"cur='mirror',page='mirror';","cur=APP,page=APP;");
  [i,j]=between(script,'const seedQ=','/* ------------------------------------------------------------------ helpers */','seeds');
  script=script.slice(0,i)+snip('state.snip')+script.slice(j);
  script=rep(script,"function updQ(){const c=$('#qcount');c.textContent=queue.length;c.hidden=!queue.length}","function updQ(){const c=$('#qcount');c.textContent=queue.length;c.hidden=!queue.length;persist()}");
  script=rep(script,"  paintSteps();\n}\nfunction loadValues","  paintSteps();persist();\n}\nfunction loadValues");
  script=rep(script,"function renderQueue(){\n","function renderQueue(){\n  persist();\n");
  script=rep(script,"Jobs run top to bottom. Sample jobs are loaded so you can try reordering and exporting.","Jobs run top to bottom. Export them together as one script.");
  script=rep(script,"<button class=\"btn primary grow\" type=\"button\" data-q=\"copyscript\" ${queue.length?'':'disabled'}>${ic('copy')}Copy script</button>","<button class=\"btn primary grow\" type=\"button\" data-q=\"download\" ${queue.length?'':'disabled'}>${ic('download')}Download .${fmt}</button><button class=\"btn sec grow\" type=\"button\" data-q=\"copyscript\" ${queue.length?'':'disabled'}>${ic('copy')}Copy script</button>");
  script=rep(script,"else if(qa==='copyscript')","else if(qa==='download')downloadScript();\n    else if(qa==='copyscript')");
  script=rep(script,"function renderQueue(){",snip('download.snip')+"function renderQueue(){");
  [i,j]=between(script,'/* ------------------------------------------------------------------ design system */','/* ------------------------------------------------------------------ palette */','design system');
  script=script.slice(0,i)+script.slice(j);
  script=rep(script,"[['Open Mirror','#mirror'],['Open Fetch','#fetch'],['Open Queue','#queue'],['Open Profiles','#profiles'],['Open Design system','#system']].forEach(a=>A.push({l:a[0],h:'Go',run:()=>{location.hash=a[1]}}));","[[`Open ${MODULES[APP].name}`,'#'+APP],['Open Queue','#queue'],['Open Profiles','#profiles']].forEach(a=>A.push({l:a[0],h:'Go',run:()=>{location.hash=a[1]}}));\n  A.push({l:`Open ${OTHER.name} (${OTHER.bin})`,h:'Other app',run:()=>{location.href=OTHER.url}});");
  script=rep(script,"if(page==='system')renderSystem()","");
  script=rep(script,"const PAGES=['mirror','fetch','queue','profiles','system'];","const PAGES=[APP,'queue','profiles'];");
  script=rep(script,"const TITLES={mirror:'Mirror',fetch:'Fetch',queue:'Queue',profiles:'Profiles',system:'Design system'};","const TITLES={[APP]:MODULES[APP].name,queue:'Queue',profiles:'Profiles'};");
  script=rep(script,"const h=(location.hash||'#mirror').slice(1);page=PAGES.includes(h)?h:'mirror';","const h=(location.hash||'#'+APP).slice(1);page=PAGES.includes(h)?h:APP;");
  script=rep(script,"else if(page==='profiles')renderProfiles();else renderSystem();","else renderProfiles();");
  if(/renderSystem|#system/.test(script))throw new Error('leftover design-system reference');

  const fav=encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${A.color}"/><g transform="translate(6 6) scale(.8333)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z" /><path d="M17 21v-2" /><path d="M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10" /><path d="M21 21v-2" /><path d="M3 5V3" /><path d="M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z" /><path d="M7 5V3" /></g></svg>`);
  const css=style.replace(/\/\* Hallmark:[^\n]*\n/,'/* Conduit design system. Shared by Mirror (robocopy-gui) and Fetch (wget-gui). Keep tokens and components identical in both. */\n').replace(/\/\* Layout:[^\n]*\n/,'');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${A.name}, a ${A.tool} command builder | Conduit</title>
<meta name="description" content="${A.desc}">
<meta name="theme-color" content="${A.color}">
<link rel="icon" href="data:image/svg+xml,${fav}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style>
</head>
<body>
${body}
<script>${script}</script>
</body>
</html>
`;
}

const TARGETS={mirror:'../index.html',fetch:'../../wget-gui/index.html'};
for(const app of Object.keys(APPS)){const html=build(app);const dest=TARGETS[app];if(!fs.existsSync(require('path').dirname(dest))){console.log('skip',app,'(folder not found: '+dest+')');continue}fs.writeFileSync(dest,html);console.log('wrote',dest,html.length,'bytes')}
