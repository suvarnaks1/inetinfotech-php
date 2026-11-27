/* =====================================================================
   MOTION LAYER  (loads last on every public page)
   1. scroll-reveal   2. scroll progress / header   3. hero dots + parallax
   4. magnetic buttons   5. page wipe   6. welcome pop-up (Register / Enquire)
   ===================================================================== */
(()=>{
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const root=document.documentElement;
root.classList.add('mo');

/* ------------------------------------------------------------------ 1. scroll reveal */
const REVEAL=[
 ['.sec>.w>h2,.rail-top h2,.dome-sec__head h2,.wall-sec .w>h2,.cd-main h2,.cd-rel h2','rv-h'],
 ['.big-say,.say-p,.sec>.w>.lead,.ps-head,.dome-sec__head .lead,.cd-p,.cd-place',''],
 ['.rail-top .arrows','rv-r'],
 ['.pz,.gc,.cc,.logos img','rv-pop'],
 ['.tiles>div','rv-pop'],
 ['.facts li,.steps li,.pt,.feat>div,.mv,.stats>div,.faq details,.mx,.info>div,.cd-facts li,.cd-list li,.cd-relg a,.cd-fee',''],
 ['.rack,.mapbox,.info,.band,.car,.big,.logos h2,.shout .go,.shout h2,.sub,.dome-sec__stage,.wall-sec__stage',''],
 ['.split>form,.split>.info,.join>*',''],
 ['footer.slim .row>*','']
];
const sel=REVEAL.map(r=>r[0]).join(',');
let revIO;
const tag=()=>{
 if(rm)return;
 REVEAL.forEach(([s,cls])=>{
  $$(s).forEach(el=>{
   if(el.closest('.pu')||el.classList.contains('rv'))return;
   el.classList.add('rv');cls&&el.classList.add(cls);
   const sibs=el.parentElement?[...el.parentElement.children].filter(c=>c.matches(s)):[];
   el.style.setProperty('--d',Math.min(sibs.indexOf(el)%6,5)*.08+'s');
   revIO.observe(el)})})};
if(!rm){
 revIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target;revIO.unobserve(el);el.classList.add('vis');
  el.addEventListener('animationend',ev=>{if(ev.target===el)el.classList.add('rv-done')},{once:true});
  setTimeout(()=>el.classList.add('rv-done'),2200)
 }),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
 tag();
 /* safety net: anything already on screen (short pages) is revealed */
 const sweep=()=>$$('.rv:not(.vis)').forEach(el=>{const r=el.getBoundingClientRect();
  if(r.top<innerHeight&&r.bottom>0&&r.width>0){revIO.unobserve(el);el.classList.add('vis');setTimeout(()=>el.classList.add('rv-done'),2200)}});
 setTimeout(sweep,1400);setTimeout(sweep,3500);
 /* content that is built by other scripts (course cards, course page) */
 let mt;new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(tag,60)}).observe(document.body,{childList:true,subtree:true});
 /* course filter: replay the pop-in for the cards that stay visible */
 $$('.sub button').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(()=>{
  $$('.gc:not(.h)').forEach((c,i)=>{c.classList.remove('rv-done','vis');c.classList.add('rv','rv-pop');void c.offsetWidth;
   c.style.setProperty('--d',Math.min(i,12)*.04+'s');c.classList.add('vis');
   setTimeout(()=>c.classList.add('rv-done'),1400)})})));
}

/* ------------------------------------------------------------------ 2. progress bar + header */
const bar=document.createElement('div');bar.className='mo-prog';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
const hd=$('header');
let tick=false;
const onScroll=()=>{tick=false;
 const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;
 bar.style.setProperty('--p',h>0?Math.min(1,y/h):0);
 hd&&hd.classList.toggle('mo-s',y>8);
 if(!rm){const py=Math.max(-40,-y*.06);$$('.pimgs,.collage').forEach(p=>p.style.setProperty('--py',py+'px'))}};
addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

/* ------------------------------------------------------------------ 3. floating dots in dark heroes */
if(!rm)$$('.stage,.phero').forEach(sec=>{
 const d=document.createElement('div');d.className='mo-dots';d.setAttribute('aria-hidden','true');
 const n=innerWidth<700?9:16;
 for(let i=0;i<n;i++){const s=document.createElement('i'),z=3+Math.random()*7;
  s.style.cssText=`left:${Math.random()*100}%;width:${z}px;height:${z}px;--t:${11+Math.random()*12}s;--dl:${-Math.random()*20}s;--dx:${(Math.random()-.5)*120}px`;d.appendChild(s)}
 sec.insertBefore(d,sec.firstChild)});

/* ------------------------------------------------------------------ 4. magnetic buttons */
if(!rm&&fine)document.addEventListener('pointermove',e=>{
 const b=e.target.closest&&e.target.closest('.btn');
 if(!b||b.closest('.pu-form'))return;
 const r=b.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
 b.style.translate=`${x*10}px ${y*8}px`});
if(!rm&&fine)document.addEventListener('pointerout',e=>{const b=e.target.closest&&e.target.closest('.btn');if(b)b.style.translate=''});

/* ------------------------------------------------------------------ 5. page wipe */
if(!rm){
 const cur=document.createElement('div');cur.className='mo-curtain';cur.setAttribute('aria-hidden','true');document.body.appendChild(cur);
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest&&e.target.closest('a[href]');
  if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
  let u;try{u=new URL(a.href,location.href)}catch(_){return}
  if(!/^(https?:|file:)$/.test(u.protocol)||u.host!==location.host)return;
  if(u.pathname===location.pathname&&u.search===location.search)return;
  e.preventDefault();
  try{sessionStorage.setItem('inet.nav','1')}catch(_){}
  cur.classList.add('go');
  setTimeout(()=>{location.href=a.href},520)});
 addEventListener('pageshow',e=>{if(e.persisted)cur.classList.remove('go')});
}

/* ------------------------------------------------------------------ 6. welcome pop-up */
const PHONE_WA='919846233339';
const FALLBACK=['Cisco Networking (CCNA to CCIE)','Red Hat Linux (RHCSA / RHCE)','Microsoft Certification','Hardware & Networking','Cloud & DevOps','Cyber Security','Full Stack Web Development','UI/UX Design','Website Development','Digital Marketing','Python Programming','Java Programming','Android & iOS App Development','Data Science & AI','Data Analytics','Software Testing','Internship Program','Project Management'];
const courseNames=()=>{
 try{const s=JSON.parse(localStorage.getItem('inet.courses')||'null');if(Array.isArray(s)&&s.length)return s.filter(c=>c.status!=='draft').map(c=>c.title)}catch(_){}
 try{if(typeof COURSES_DEFAULT!=='undefined')return COURSES_DEFAULT.filter(c=>c.status!=='draft').map(c=>c.title)}catch(_){}
 return FALLBACK};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const onContact=/contact\.html$/.test(location.pathname);

const pu=document.createElement('div');pu.className='pu';pu.id='puRoot';pu.setAttribute('aria-hidden','true');
pu.innerHTML=`
<div class="pu-bd" data-close></div>
<div class="pu-card" role="dialog" aria-modal="true" aria-labelledby="puT" tabindex="-1">
 <button class="pu-x" type="button" aria-label="Close" data-close><span></span><span></span></button>
 <aside class="pu-side">
  <span class="pu-pill" style="--i:0"><i></i>Admissions open</span>
  <h2 id="puT" style="--i:1"><span>Your seat</span><span class="o">is</span> <span class="r">waiting.</span></h2>
  <p style="--i:2">Register for the next batch or ask us anything. A counsellor will call you back within one working day.</p>
  <ul class="pu-perks" style="--i:3"><li>19 years in Cochin</li><li>Cisco &amp; Microsoft learning partner</li><li>100% placement support</li></ul>
  <div class="pu-sticker" style="--i:4" aria-hidden="true"><div><b>19</b>years</div></div>
 </aside>
 <div class="pu-main" data-mode="register">
  <div class="pu-tabs" role="tablist" aria-label="What would you like to do?"><i class="pu-ind"></i>
   <button type="button" role="tab" id="puTabR" aria-selected="true" data-m="register">Register</button>
   <button type="button" role="tab" id="puTabE" aria-selected="false" data-m="enquire" tabindex="-1">Enquire</button></div>
  <h3 class="pu-title" id="puHd">Reserve your seat</h3>
  <p class="pu-sub" id="puSub">Tell us who you are and what you want to learn.</p>
  <form class="pu-form in" novalidate>
   <label style="--i:0">Full name<input name="name" autocomplete="name" placeholder="Your name" required><em>Please enter your name</em></label>
   <div class="pu-row" style="--i:1">
    <label>Phone<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91" required><em>Enter a valid phone number</em></label>
    <label data-for="register">Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com"><em>Check the email address</em></label>
   </div>
   <label style="--i:2">Course of interest<select name="course"><option value="">Select a course</option>${courseNames().map(n=>`<option>${esc(n)}</option>`).join('')}</select></label>
   <fieldset class="pu-fs" data-for="register" style="--i:3"><legend>Preferred mode</legend><div class="pu-chips">
    <label class="chip"><input type="radio" name="mode" value="Classroom" checked><span>Classroom</span></label>
    <label class="chip"><input type="radio" name="mode" value="Online"><span>Online</span></label>
    <label class="chip"><input type="radio" name="mode" value="Not sure"><span>Not sure yet</span></label></div></fieldset>
   <label data-for="enquire" style="--i:3">Your question<textarea name="message" placeholder="Fees, batch timings, placements, anything..."></textarea></label>
   <button class="btn" type="submit" style="--i:4"><span class="pu-btn-t" id="puBtn">Reserve my seat</span><span class="pu-btn-ar" aria-hidden="true">&#8594;</span></button>
   <p class="pu-note" style="--i:5">Prefer to talk now? <a href="tel:+919846233339">+91 98462 33339</a></p>
  </form>
  <div class="pu-done" role="status" aria-live="polite">
   <div class="pu-conf" aria-hidden="true"></div>
   <svg viewBox="0 0 116 116" aria-hidden="true"><defs><linearGradient id="puG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0243d"/><stop offset="1" stop-color="#f26f21"/></linearGradient></defs>
    <circle class="disc" cx="58" cy="58" r="50"/><circle class="ring" cx="58" cy="58" r="48"/><path class="tick" d="M36 60l16 16 30-34"/></svg>
   <h3 id="puDoneT">You're in!</h3><p id="puDoneP"></p>
   <div class="acts"><a class="btn" id="puWa" target="_blank" rel="noopener" href="https://wa.me/${PHONE_WA}">Chat on WhatsApp</a><button class="btn ghost" type="button" data-close>Close</button></div>
  </div>
 </div>
</div>`;
document.body.appendChild(pu);

const fab=document.createElement('button');fab.type='button';fab.className='pu-fab';fab.setAttribute('aria-haspopup','dialog');
fab.innerHTML='<i></i>Enquire / Register';document.body.appendChild(fab);

const card=$('.pu-card',pu),main=$('.pu-main',pu),form=$('.pu-form',pu),tabs=$$('.pu-tabs button',pu);
const COPY={register:['Reserve your seat','Tell us who you are and what you want to learn.','Reserve my seat'],
            enquire:['Ask us anything','Fees, timings, syllabus. We reply the same working day.','Send my enquiry']};
let mode='register',lastFocus=null,isOpen=false;

const replay=()=>{form.classList.remove('in');void form.offsetWidth;form.classList.add('in')};
const setMode=(m,quiet)=>{
 mode=m;main.dataset.mode=m;
 tabs.forEach(t=>{const on=t.dataset.m===m;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1});
 $('#puHd').textContent=COPY[m][0];$('#puSub').textContent=COPY[m][1];$('#puBtn').textContent=COPY[m][2];
 $$('.bad',form).forEach(l=>l.classList.remove('bad'));
 if(!quiet)replay()};
tabs.forEach(t=>t.addEventListener('click',()=>setMode(t.dataset.m)));
$('.pu-tabs',pu).addEventListener('keydown',e=>{
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=mode==='register'?'enquire':'register';setMode(n);$('#'+(n==='register'?'puTabR':'puTabE')).focus()}});

const focusables=()=>$$('a[href],button:not([disabled]),input:not([disabled]):not([type=radio]),input[type=radio]:checked,select,textarea,[tabindex]:not([tabindex="-1"])',card).filter(e=>e.offsetParent!==null&&getComputedStyle(e).visibility!=='hidden');

const open=(m)=>{
 if(isOpen)return;isOpen=true;
 try{sessionStorage.setItem('inet.pu','1')}catch(_){}
 resetDone();setMode(m||mode,true);replay();
 lastFocus=document.activeElement;
 pu.classList.remove('out','settled');pu.classList.add('on');pu.setAttribute('aria-hidden','false');root.classList.add('pu-lock');
 fab.classList.remove('show');
 setTimeout(()=>pu.classList.add('settled'),1600);
 setTimeout(()=>{(rm?$('input[name=name]',pu):card).focus({preventScroll:true})},rm?0:650)};

const close=()=>{
 if(!isOpen)return;isOpen=false;
 const fin=()=>{pu.classList.remove('on','out');pu.setAttribute('aria-hidden','true');root.classList.remove('pu-lock');
  lastFocus&&lastFocus.focus&&lastFocus.focus({preventScroll:true});showFab()};
 if(rm){fin();return}
 pu.classList.add('out');setTimeout(fin,380)};

function showFab(){if(onContact)return;setTimeout(()=>{if(!isOpen)fab.classList.add('show')},rm?0:500)}

pu.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close()});
addEventListener('keydown',e=>{
 if(!isOpen)return;
 if(e.key==='Escape'){e.preventDefault();close();return}
 if(e.key==='Tab'){const f=focusables();if(!f.length)return;const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&(document.activeElement===a||document.activeElement===card)){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
fab.addEventListener('click',()=>open());
/* any element can open it:  <a href="contact.html" data-popup="register">  */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-popup]');
 if(t){e.preventDefault();e.stopImmediatePropagation();open(t.dataset.popup==='enquire'?'enquire':'register')}},true);

/* ---- validation + submit ---- */
const field=n=>$('[name='+n+']',form);
const bad=(n,on)=>{const l=field(n).closest('label');l.classList.toggle('bad',on);if(on){l.style.animation='none';void l.offsetWidth;l.style.animation=''}return on};
form.addEventListener('input',e=>{const l=e.target.closest('label');l&&l.classList.remove('bad')});
form.addEventListener('submit',e=>{
 e.preventDefault();
 const d=Object.fromEntries(new FormData(form));
 let err=0;
 err+=bad('name',d.name.trim().length<2);
 err+=bad('phone',d.phone.replace(/\D/g,'').length<7);
 if(mode==='register'&&d.email.trim())err+=bad('email',!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim()));
 else bad('email',false);
 if(err){const first=$('.bad input',form);first&&first.focus();return}
 const btn=$('.btn[type=submit]',form);btn.classList.add('load');
 const lead={id:Date.now().toString(36),type:mode,name:d.name.trim(),phone:d.phone.trim(),email:mode==='register'?d.email.trim():'',
  course:d.course||'',mode:mode==='register'?d.mode:'',message:mode==='enquire'?d.message.trim():'',page:location.pathname.split('/').pop()||'index.html',ts:new Date().toISOString()};
 /* DEMO storage: same approach as the admin panel (localStorage 'inet.*').
    BACKEND: replace with  fetch('/api/leads',{method:'POST',body:JSON.stringify(lead)})  */
 try{const a=JSON.parse(localStorage.getItem('inet.leads')||'[]');a.unshift(lead);localStorage.setItem('inet.leads',JSON.stringify(a.slice(0,500)));
  localStorage.setItem('inet.puDone',Date.now())}catch(_){}
 document.dispatchEvent(new CustomEvent('inet:lead',{detail:lead}));
 setTimeout(()=>{btn.classList.remove('load');success(lead)},rm?0:900)});

function success(l){
 const first=l.name.split(/\s+/)[0];
 $('#puDoneT').textContent=l.type==='register'?`You're in, ${first}!`:`Thanks, ${first}!`;
 $('#puDoneP').textContent=l.type==='register'
  ?'Your seat request is with our admissions team. Expect a call from us within one working day.'
  :'We have your question. Someone from our team will reply within one working day.';
 const txt=l.type==='register'?`Hi I-Net Infotech, I'm ${l.name}. I just registered${l.course?' for '+l.course:''} on your website.`
  :`Hi I-Net Infotech, I'm ${l.name}. I have an enquiry${l.course?' about '+l.course:''}.`;
 $('#puWa').href=`https://wa.me/${PHONE_WA}?text=${encodeURIComponent(txt)}`;
 main.classList.add('is-ok');confetti();form.reset();$$('.bad',form).forEach(x=>x.classList.remove('bad'))}
function resetDone(){main.classList.remove('is-ok');$('.pu-conf',pu).innerHTML=''}
function confetti(){
 if(rm)return;const box=$('.pu-conf',pu),cols=['#e0243d','#f26f21','#0c0a0d','#ffb27a','#8f1226'];
 for(let i=0;i<30;i++){const s=document.createElement('i'),a=Math.random()*Math.PI*2,r=90+Math.random()*150;
  s.style.cssText=`--c:${cols[i%cols.length]};--x:${Math.cos(a)*r}px;--y:${Math.sin(a)*r-60+Math.random()*120}px;--r:${(Math.random()-.5)*900}deg;--w:${6+Math.random()*6}px;--h:${9+Math.random()*9}px;--dl:${.75+Math.random()*.15}s`;
  box.appendChild(s)}}

/* ---- when to show it automatically ---- */
const params=new URLSearchParams(location.search);
const seen=()=>{try{return sessionStorage.getItem('inet.pu')}catch(_){return 0}};
const recentlyDone=()=>{try{return Date.now()-(+localStorage.getItem('inet.puDone')||0)<7*864e5}catch(_){return 0}};
if(params.get('popup')){setTimeout(()=>open(params.get('popup')==='enquire'?'enquire':'register'),500)}
else if(!onContact&&!seen()&&!recentlyDone()){
 const go=()=>{if(!seen()&&!isOpen)open('register')};
 setTimeout(()=>{document.visibilityState==='visible'?go():document.addEventListener('visibilitychange',go,{once:true})},3000);
 /* desktop: also catch people heading for the tab bar */
 if(fine)document.addEventListener('mouseout',e=>{if(e.clientY<=0&&!e.relatedTarget&&!seen()&&performance.now()>6000)go()});
}else showFab();
})();
