/* Fills the pages from the admin data (window.INET_DATA, printed by api/boot.php):
   Gallery wall, Placements dome, home "faces" strip, home certification logos, and the heading text on those pages.
   A block that was never saved in the admin keeps the page's original HTML, so the site looks the same until you edit it. */
(()=>{
const D=window.INET_DATA||{},$=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const src=p=>!p?'':/^(data:|https?:|\/|uploads\/)/.test(p)?p:'assets/'+p;
const txt=(el,v)=>{if(el&&v!=null&&v!=='')el.textContent=v};

/* page banner: <h1>First<em>Second</em></h1> <p> <a class="btn"> */
const hero=h=>{const s=$('.phero');if(!h||!s)return;const h1=$('h1',s);
  if(h1&&(h.a||h.b))h1.innerHTML=esc(h.a||'')+'<em>'+esc(h.b||'')+'</em>';
  txt($('p',s),h.p);const b=$('.btn',s);if(b){txt(b,h.btn);if(h.href)b.setAttribute('href',h.href)}};

/* ---- courses page heading ---- */
if($('#courseGrid')&&D.coursesPage)hero(D.coursesPage.hero);

/* ---- gallery page ---- */
const wall=$('[data-drift-wall]');
if(wall&&D.gallery){const g=D.gallery;hero(g.hero);
  if(g.wall&&(g.wall.a||g.wall.b)){const h=$('.wall-sec h2');if(h)h.innerHTML=esc(g.wall.a||'')+' <span style="color:var(--org)">'+esc(g.wall.b||'')+'</span>'}
  if(Array.isArray(g.items))wall.innerHTML=g.items.filter(i=>i&&i.img).map(i=>'<img src="'+esc(src(i.img))+'" alt="'+esc(i.alt)+'"'+(i.pos?' data-pos="'+esc(i.pos)+'"':'')+(i.fit?' data-fit="'+esc(i.fit)+'"':'')+'>').join('')}

/* ---- placed students: dome on Placements, faces strip on Home ---- */
const dome=$('[data-dome-gallery]');
if(D.pcontent&&dome){hero(D.pcontent.hero);const d=D.pcontent.dome;
  if(d){const h=$('.dome-sec h2');if(h&&(d.a||d.b))h.innerHTML=esc(d.a||'')+' <span style="color:var(--org)">'+esc(d.b||'')+'</span>';txt($('.dome-sec .lead'),d.lead)}}
if(Array.isArray(D.students)){
  const shown=D.students.filter(s=>s&&s.img&&s.show!==false);
  if(dome){
    if(shown.length)dome.innerHTML=shown.map((s,i)=>{const cap=[s.role,s.company].filter(Boolean).join(' at ');
      return '<img src="'+esc(src(s.img))+'" alt="'+esc(s.name||'Placed student '+(i+1))+'"'+(cap?' data-caption="'+esc(cap)+'"':'')+'>'}).join('');
    else{const sec=dome.closest('.dome-sec');if(sec)sec.hidden=true}}
  /* the home strip has two rows (the second runs the other way): first half of the photos in row 1, the rest in row 2; each row is doubled so the marquee loops */
  const rows=[...document.querySelectorAll('.faces .row')];
  if(rows.length){const h=Math.ceil(shown.length/2),parts=[shown.slice(0,h),shown.slice(h)];
    rows.forEach((r,i)=>{const base=parts[i]&&parts[i].length?parts[i]:shown;let l=base.slice();while(l.length&&l.length<12)l=l.concat(base);l=l.concat(l);
      r.innerHTML=l.map(s=>'<img src="'+esc(src(s.img))+'" alt="" loading="lazy">').join('')})}}

/* ---- certification logos on Home ---- */
const lg=$('.logos .w');
if(lg&&Array.isArray(D.certs)){const h=$('h2',lg);lg.innerHTML='';if(h)lg.appendChild(h);
  D.certs.filter(c=>c&&c.img&&c.status!=='draft').forEach(c=>{const im=document.createElement('img');im.src=src(c.img);im.alt=c.title||'';
    if(/^https?:\/\//i.test(c.url||'')){const a=document.createElement('a');a.href=c.url;a.target='_blank';a.rel='noopener';a.style.display='contents';a.appendChild(im);lg.appendChild(a)}
    else lg.appendChild(im)})}
})();
