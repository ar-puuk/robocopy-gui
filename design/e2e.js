const {JSDOM}=require('jsdom');
const fs=require('fs');
const file=process.argv[2];
const html=fs.readFileSync(file,'utf8').replace(/<link[^>]*fonts[^>]*>/g,'');
const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){
  w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};
  w.addEventListener('error',e=>errs.push(e.message));
  w.__blobs=[];w.URL.createObjectURL=b=>{w.__blobs.push(b);return 'blob:x'};w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){w.__dl=this.download};
}});
const w=dom.window,d=w.document;
const $=s=>d.querySelector(s),$$=s=>[...d.querySelectorAll(s)];
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const fire=(el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
const setv=(id,v)=>{const e=$('#f-'+id);e.value=v;fire(e,'input')};
const vis=()=>$$('section.sec').filter(s=>!s.hidden).map(s=>s.id);
setTimeout(async()=>{
  const app=$('#app').dataset.module;
  ok(!errs.length,'no script errors on boot '+errs.join(';'));
  ok(/<title>/.test(html)&&d.title.includes('command builder'),'title: '+d.title);
  ok($$('.nav').length===4,'rail has 4 items (tool, other app, queue, profiles): '+$$('.nav').map(a=>a.textContent.trim()).join('|'));
  ok(!!$$('.nav').find(a=>a.href.includes('github.io')),'link to sibling app');
  ok(!$('#qcount')||$('#qcount').hidden,'queue empty at first (no sample data)');
  console.log('settings label:',$('.finder-n').textContent,'| tabs:',$$('[data-tab]').length);
  if(app==='mirror'){setv('src','C:\\My Data');setv('dst','D:\\Backup')}else{setv('url','https://example.org/a.zip')}
  console.log('cmd:',$('#cmd').textContent.replace(/\s+/g,' '));
  ok($('#prog-r').textContent.includes('Required fields done'),'progress says required done');
  // tabs
  const tabs=$$('[data-tab]');
  tabs[1].click();ok(vis().length===1&&vis()[0]==='s-'+tabs[1].dataset.tab,'tab 2 shows only its panel '+vis().join(',')+' want s-'+tabs[1].dataset.tab);
  tabs[tabs.length-1].click();ok($('#s-next').textContent.includes('Add to queue'),'last step offers Add to queue');
  tabs[0].click();
  // search
  const f=$('#find');f.value='retry';fire(f,'input');
  ok(vis().length>=1&&$('.tabs').hidden,'search spans tabs: '+vis().join(','));
  f.value='zzzz';fire(f,'input');ok(!$('#find-empty').hidden,'empty-search message');
  f.value='';fire(f,'input');
  $('#open-pal').click();ok(!$('#pal').hidden&&$$('#pal-list li').length>20,'palette lists '+$$('#pal-list li').length+' actions on the builder');$('#pal-in').value='thread';fire($('#pal-in'),'input');ok($$('#pal-list li').length>=1,'palette filters');d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  // add to queue
  $('[data-act="add"]').click();
  ok($('#qcount').textContent==='1','queued one job');
  w.location.hash='#queue';await new Promise(r=>setTimeout(r,30));
  ok($$('.item').length===1,'queue shows the job');
  const pre=$('.term pre').textContent;console.log('script preview:\n'+pre);
  $('[data-q="download"]').click();
  ok(w.__dl&&/\.bat$/.test(w.__dl),'download triggered: '+w.__dl);
  const txt=await new Promise(r=>{const fr=new w.FileReader();fr.onload=()=>r(fr.result);fr.readAsText(w.__blobs[0])});
  ok(txt.includes('\r\n')&&txt.startsWith('@echo off'),'bat uses CRLF');
  d.querySelector('[data-fmt="ps1"]').click();$('[data-q="download"]').click();
  ok(/\.ps1$/.test(w.__dl),'ps1 download: '+w.__dl);
  // persistence
  const st=JSON.parse(w.localStorage.getItem('conduit.'+app+'.state'));
  ok(st&&st.q.length===1&&st.fmt==='ps1','state persisted (queue + format)');
  // profiles
  w.location.hash='#'+app;await new Promise(r=>setTimeout(r,30));
  $('[data-act="save"]').click();$('#pname').value='My job';$$('#modal-box .btn').pop().click();
  w.location.hash='#profiles';await new Promise(r=>setTimeout(r,30));
  ok($$('.pcard').length===1,'profile saved and listed');
  ok(JSON.parse(w.localStorage.getItem('conduit.'+app+'.profiles')).length===1,'profile persisted');
  console.log(errs.length?'ERRORS: '+errs.join(';'):'no runtime errors');
  process.exit(0);
},150);
