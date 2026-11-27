/* Shared helpers. BACKEND: every Store.get/set call is the single place to swap for fetch() to your API. */
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const asset=p=>!p?'':/^(data:|https?:)/.test(p)?p:/^uploads\//.test(p)?'../'+p:'../assets/'+p;
/* pictures are uploaded to the server (api/upload.php) and the saved value is the path, e.g. uploads/20260101-abc.jpg. Returns '' if the upload failed. */
const upload=async f=>{try{const fd=new FormData();fd.append('file',f);const r=await fetch('../api/upload.php',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':window.INET_CSRF||''},body:fd});
  if(r.status===401){toast('Session expired. Please log in again.');setTimeout(()=>location.href='login.html',1200);return ''}
  const j=await r.json();if(!j.ok)throw new Error(j.error||'Upload failed');return j.path}catch(e){toast('Upload failed: '+e.message);return ''}};
const readFile=upload,shrink=upload;
/* Data comes from the database (window.INET_DATA printed by api/boot.php). Every Store.set saves to api/save.php. */
const Store={
  _q:Promise.resolve(),
  get(k,d){const v=(window.INET_DATA||{})[k];return v==null?d:JSON.parse(JSON.stringify(v))},
  set(k,v){const val=JSON.parse(JSON.stringify(v));(window.INET_DATA=window.INET_DATA||{})[k]=val;
    this._q=this._q.then(()=>fetch('../api/save.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':window.INET_CSRF||''},body:JSON.stringify({key:k,value:val})})
      .then(async r=>{let j={};try{j=await r.json()}catch(e){}
        if(r.status===401){toast('Session expired. Please log in again.');setTimeout(()=>location.href='login.html',1200)}
        else if(!j.ok)toast('NOT SAVED: '+(j.error||'server error'))}))
      .catch(()=>toast('NOT SAVED: cannot reach the server'));
    return true}
};
/* ---- shared content helpers: nested paths, defaults merge, repeaters, page banner ---- */
const gp=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const sp=(o,p,v)=>{const k=p.split('.'),l=k.pop();k.reduce((a,x)=>a[x]=a[x]||{},o)[l]=v};
const merge=(d,s)=>{if(s==null)return d;if(Array.isArray(d)||typeof d!=='object'||d===null)return s;const o={...d};for(const k in s)o[k]=k in d?merge(d[k],s[k]):s[k];return o};
/* load(key): saved content laid over the defaults in js/content.js. BACKEND: GET /api/<key> */
const load=k=>merge(JSON.parse(JSON.stringify(DEF[k])),Store.get(k,null));
/* bind every [data-b="a.b"] input to the object O */
function bindB(O,fn){$$('[data-b]').forEach(i=>{i.value=gp(O,i.dataset.b)??'';i.oninput=()=>{sp(O,i.dataset.b,i.value);fn&&fn()}})}
/* repeater: fields = [{k,l,w,a:textarea,o:[options]}] */
function rep(id,A,fields,blank){const el=$('#'+id),f1=(f,it)=>f.o?(f.k==='img'&&it.img?`<img class="rth" src="${esc(asset(it.img))}" alt="">`:'')+`<select data-k="${f.k}">${[...new Set([it[f.k],...f.o].filter(x=>x!=null))].map(x=>`<option value="${esc(x)}"${x===it[f.k]?' selected':''}>${esc(x||'None')}</option>`).join('')}</select>`:f.a?`<textarea data-k="${f.k}" rows="2">${esc(it[f.k])}</textarea>`:`<input data-k="${f.k}" value="${esc(it[f.k])}">`,
 dr=()=>{el.innerHTML=A.map((it,i)=>`<div class="rp" data-i="${i}"><div class="rpf">${fields.map(f=>`<label class="${f.w||''}">${f.l}${f1(f,it)}</label>`).join('')}</div><div class="rpb"><button class="ib" data-m="-1" type="button" aria-label="Move up"><i class="fa-solid fa-arrow-up"></i></button><button class="ib" data-m="1" type="button" aria-label="Move down"><i class="fa-solid fa-arrow-down"></i></button><button class="ib d" data-m="x" type="button" aria-label="Remove"><i class="fa-solid fa-trash"></i></button></div></div>`).join('')||'<p class="mut">Nothing here yet.</p>'};
 el.oninput=e=>{const r=e.target.closest('.rp');if(r){A[r.dataset.i][e.target.dataset.k]=e.target.value;if(e.target.dataset.k==='img')dr()}};
 el.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const i=+b.closest('.rp').dataset.i,m=b.dataset.m;if(m==='x')A.splice(i,1);else{const j=i+ +m;if(j<0||j>=A.length)return;[A[i],A[j]]=[A[j],A[i]]}dr()};
 const ab=$('[data-add="'+id+'"]');if(ab)ab.onclick=()=>{A.push({...blank});dr()};dr()}
/* the heading + intro + button block every inner page starts with ("Our" + "courses", tagline, button) */
const BANNER=(t='Page heading')=>`<div class="panel"><h3>${t}</h3><div class="pb"><div class="g2"><label>Heading, first word<input data-b="hero.a"></label><label>Heading, highlighted word<input data-b="hero.b"></label></div><label>Tagline<input data-b="hero.p"></label><div class="g2"><label>Button text<input data-b="hero.btn"></label><label>Button link<input data-b="hero.href"></label></div></div></div>`;
function toast(m){let t=$('.tg');if(!t){t=document.createElement('div');t.className='tg';t.setAttribute('role','status');document.body.append(t)}
  t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2400)}
const NAV=[['index.html','Dashboard','fa-gauge'],['home-content.html','Home page','fa-house'],['about.html','About','fa-circle-info'],['courses.html','Courses','fa-graduation-cap'],['services.html','Services','fa-screwdriver-wrench'],['placements.html','Placements','fa-user-tie'],['gallery.html','Gallery','fa-images'],['certifications.html','Certifications','fa-award'],['contact.html','Contact & footer','fa-phone']];
function openDr(id){$('#'+id).classList.add('open');$('#bd').classList.add('on')}
function closeDr(){$$('.dr.open').forEach(d=>d.classList.remove('open'));$('#side').classList.remove('open');$('#bd').classList.remove('on')}
document.addEventListener('DOMContentLoaded',()=>{
  const pg=document.body.dataset.page;
  $('#side').innerHTML=`<a class="logo" href="index.html"><img src="../assets/logo.png" alt="I-Net Infotech admin"></a><div class="gt">Website content</div>`+
    NAV.map(n=>`<a class="nv${n[0]===pg?' on':''}" href="${n[0]}"><i class="fa-solid ${n[2]}"></i>${n[1]}</a>`).join('');
  $('#top').innerHTML=`<button class="menu" aria-label="Open menu" aria-expanded="false" aria-controls="side"><i class="fa-solid fa-bars"></i></button><h1>${esc(document.body.dataset.title)}</h1><a class="site" href="../index.html" target="_blank" rel="noopener" aria-label="View site"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>View site</span></a><a class="site" href="#" id="lo" aria-label="Log out"><i class="fa-solid fa-right-from-bracket"></i><span>Log out</span></a><span class="av" title="Signed in as Admin">AD</span>`;
  $('#lo').onclick=async e=>{e.preventDefault();try{await fetch('../api/logout.php',{method:'POST',credentials:'same-origin'})}catch(x){}location.href='login.html'};
  if(window.INET_ERR)setTimeout(()=>toast(window.INET_ERR),400);
  $('.menu').onclick=()=>{const o=$('#side').classList.toggle('open');$('#bd').classList.toggle('on',o);$('.menu').setAttribute('aria-expanded',o)};
  const bd=document.createElement('div');bd.className='bd';bd.id='bd';bd.onclick=closeDr;document.body.append(bd);
  addEventListener('keydown',e=>{if(e.key==='Escape')closeDr()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDr()});
});
