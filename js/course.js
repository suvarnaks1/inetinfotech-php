/* Course detail page: course.html?id=<id>. Data comes from the admin-managed COURSES (see js/courses-data.js). */
(()=>{
const root=$('#cd');if(!root)return;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lines=v=>Array.isArray(v)?v.filter(Boolean):String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
const CATS={net:'Networking',ops:'Cloud & Security',web:'Web & Digital',code:'Programming',data:'Data & AI',car:'Careers'};
const id=new URLSearchParams(location.search).get('id');
const c=COURSES.find(x=>courseId(x)===id);
const PHONE='+919846233339',PHONE_TXT='+91 98462 33339';
if(!c){
 document.title='Course not found | I-Net Infotech';
 root.innerHTML=`<section class="phero"><div class="w cd-nf"><div><h1>Course<em>not found</em></h1><p>That course is no longer listed. See everything we teach.</p><a class="btn" href="courses.html">View all courses</a></div></div></section>`;
 return}
document.title=c.title+' | I-Net Infotech';
const md=document.querySelector('meta[name=description]');if(md)md.content=(c.desc||'').slice(0,155);
const enq='contact.html?course='+encodeURIComponent(courseId(c));
const fee=(c.fee||'').trim();
const facts=[['fa-clock','Duration',c.duration],['fa-signal','Level',c.level],['fa-chalkboard-user','Mode',c.mode],['fa-calendar-days','Batch',c.batch],['fa-certificate','Certification',c.certification]].filter(f=>f[2]);
const topics=lines(c.topics),outs=lines(c.outcomes);
const list=(a,ic)=>`<ul class="cd-list">${a.map(t=>`<li><i class="fa-solid ${ic}" aria-hidden="true"></i><span>${esc(t)}</span></li>`).join('')}</ul>`;
const media=c.img?`<img class="${c.fit==='contain'?'logo':'solo'}" src="${imgSrc(c.img)}" alt="" style="object-position:${esc(c.pos||'center')}">`:`<div class="cd-ico"><i class="${esc(c.icon)}"></i></div>`;
const related=COURSES.filter(x=>x!==c&&x.c===c.c).slice(0,3);
root.innerHTML=`
<section class="phero cd-hero"><div class="w"><div>
 <a class="cd-back" href="courses.html"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All courses</a>
 <span class="cd-tag"><i class="${esc(c.icon)}" aria-hidden="true"></i> ${esc(c.tag||CATS[c.c]||'')}</span>
 <h1 class="cd-h1">${esc(c.title)}</h1>
 <p>${esc(c.desc)}</p>
 <div class="cd-cta"><a class="btn" href="${enq}">Enquire now</a><a class="btn ghost" href="tel:${PHONE}"><i class="fa-solid fa-phone" aria-hidden="true"></i> Call us</a></div>
</div><div class="pimgs" aria-hidden="true">${media}</div></div></section>
<section class="sec cd-sec"><div class="w cd">
 ${facts.length?`<ul class="cd-facts">${facts.map(f=>`<li><i class="fa-solid ${f[0]}" aria-hidden="true"></i><span>${f[1]}</span><b>${esc(f[2])}</b></li>`).join('')}</ul>`:''}
 <aside class="cd-fee" aria-label="Course fee">
  <small>Course fee</small>
  ${fee?`<div class="cd-price">${esc(fee)}</div>`:`<div class="cd-price ask">Call for fees</div>`}
  ${c.feeNote?`<p>${esc(c.feeNote)}</p>`:`<p>${fee?'':'Fees depend on batch and level. Talk to a counsellor for the current fee.'}</p>`}
  <a class="btn" href="${enq}">Enquire now</a>
  <a class="cd-line" href="tel:${PHONE}"><i class="fa-solid fa-phone" aria-hidden="true"></i> ${PHONE_TXT}</a>
  <a class="cd-line" href="https://wa.me/919846233339?text=${encodeURIComponent('Hi, I would like to know more about '+c.title)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp us</a>
 </aside>
 <div class="cd-main">
  ${topics.length?`<h2>What you will learn</h2>${list(topics,'fa-check')}`:''}
  ${c.eligibility?`<h2>Who can join</h2><p class="cd-p">${esc(c.eligibility)}</p>`:''}
  ${outs.length?`<h2>Career outcomes</h2>${list(outs,'fa-arrow-trend-up')}`:''}
  <div class="cd-place"><i class="fa-solid fa-handshake" aria-hidden="true"></i><div><b>Placement support included</b><span>Resume help, interview practice and referrals to hiring companies.</span></div></div>
 </div>
</div></section>
${related.length?`<section class="sec cd-sec cd-rel"><div class="w"><h2>More in ${esc(CATS[c.c]||'this topic')}</h2><div class="cd-relg">${related.map(r=>`<a href="course.html?id=${encodeURIComponent(courseId(r))}"><i class="${esc(r.icon)}" aria-hidden="true"></i><b>${esc(r.title)}</b><span>${esc(r.duration||r.meta||'')}</span></a>`).join('')}</div></div></section>`:''}
<div class="cd-bar" role="region" aria-label="Enquire"><div><small>Fee</small><b>${fee?esc(fee):'Call for fees'}</b></div><a class="btn ghost" href="tel:${PHONE}" aria-label="Call us"><i class="fa-solid fa-phone"></i></a><a class="btn" href="${enq}">Enquire now</a></div>`;
document.body.classList.add('has-cta');
})();
