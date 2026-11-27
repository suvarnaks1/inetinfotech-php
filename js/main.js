const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
/* data layer: api/boot.php prints window.INET_DATA from the database. If it is missing (no PHP / no data) every page falls back to its built-in defaults. */
const DB=k=>{const v=(window.INET_DATA||{})[k];return v===undefined?null:v};
const imgSrc=p=>!p?'':/^(data:|https?:|\/|uploads\/)/.test(p)?p:'assets/'+p;
const tg=$('.tg'),ul=$('.nav ul');tg.onclick=()=>tg.setAttribute('aria-expanded',ul.classList.toggle('open'));
/* hero particle wave */
const cv = $('#wave');
if (cv) {
  const x = cv.getContext('2d'),
        pb = $('.pause');
  let W, H, t = 0, run = !rm, raf;

  const rs = () => {
    const r = cv.getBoundingClientRect(),
          d = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * d;
    cv.height = r.height * d;
    x.setTransform(d, 0, 0, d, 0, 0);
    W = r.width;
    H = r.height;
    draw();
  };

  function draw() {
    x.clearRect(0, 0, W, H);
    // x.globalCompositeOperation = 'lighter'; // optional: additive glow (dark backgrounds only)

    const sx = W < 700 ? 16 : 20,
          cols = Math.ceil(W / sx) + 2,
          rows = 18;

    for (let r = 0; r < rows; r++) {
      const k = r / rows,
            y0 = H * .42 + k * H * .5,
            sz = 1.5 + k * 3.2,   // larger dots
            al = .45 + k * .55;   // far rows stay visible

      for (let c = 0; c < cols; c++) {
        const f = c / cols,
              px = c * sx - (r % 2) * sx / 2,
              py = y0
                 + Math.sin(c * .2 + r * .5 + t) * (8 + k * 34)
                 + Math.sin(c * .06 - t * .7) * (10 + k * 22),
              R = (238 + 17 * f) | 0,
              G = (64 + 120 * f) | 0,
              B = (78 - 35 * f) | 0;

        // soft glow halo (front rows only)
        if (k > .35) {
          x.fillStyle = `rgba(${R},${G},${B},${al * .18})`;
          x.beginPath();
          x.arc(px, py, sz * 2.6, 0, 6.283);
          x.fill();
        }

        // core dot
        x.fillStyle = `rgba(${R},${G},${B},${al})`;
        x.beginPath();
        x.arc(px, py, sz, 0, 6.283);
        x.fill();
      }
    }
  }

  function loop() {
    t += .012;
    draw();
    raf = requestAnimationFrame(loop);
  }

  addEventListener('resize', rs);
  rs();
  if (run) loop();

  pb.classList.toggle('p', !run);
  pb.onclick = () => {
    run = !run;
    pb.classList.toggle('p', !run);
    pb.setAttribute('aria-label', run ? 'Pause animation' : 'Play animation');
    run ? loop() : cancelAnimationFrame(raf);
  };
}
/* count-up */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);
const el=e.target,n=+el.dataset.n,s=el.dataset.s||'';if(rm){el.textContent=n+s;return}
const t0=performance.now();(function f(t){const p=Math.min((t-t0)/1400,1);el.textContent=Math.round(n*(1-Math.pow(1-p,3)))+s;if(p<1)requestAnimationFrame(f)})(t0)}),{threshold:.6});
$$('[data-n]').forEach(e=>io.observe(e));

/* ===== courses data (edit here to add, remove or change courses) =====
   c    = filter group: net | ops | web | code | data | car
   icon = Font Awesome class
   tag  = small label above the title                                   */
const COURSES=(DB('courses')||COURSES_DEFAULT).filter(c=>c.status!=='draft');
/* render course cards */
const cg=$('#courseGrid');if(cg)cg.innerHTML=COURSES.map(o=>`<article class="gc" data-c="${o.c}">${o.img?`<div class="ph${o.fit==='contain'?' lg':''}"><img src="${imgSrc(o.img)}" alt="${o.alt||o.title}" style="object-position:${o.pos}" loading="lazy"></div>`:`<div class="ph ico" aria-hidden="true"><i class="${o.icon}"></i></div>`}<i class="dash"></i><small><i class="${o.icon}"></i> ${o.tag}</small><h3>${o.title}</h3><p>${o.desc}</p><span class="meta">${o.meta}</span><a class="al" href="course.html?id=${encodeURIComponent(courseId(o))}" aria-label="View details: ${o.title}">View details</a></article>`).join('');

/* course filter */
$$('.sub button').forEach(b=>b.onclick=()=>{$$('.sub button').forEach(o=>o.classList.toggle('on',o===b));
$$('[data-c]').forEach(c=>c.classList.toggle('h',b.dataset.f!=='all'&&c.dataset.c!==b.dataset.f))});
/* stories carousel */
const tr=$('.track');if(tr){const sl=$$('.slide',tr),pv=$('.cb .p'),nx=$('.cb .n');let i=0;
const per=()=>innerWidth<1000?1:2,max=()=>sl.length-per();
const go=n=>{i=Math.max(0,Math.min(n,max()));tr.style.transform=`translateX(-${i*100/per()}%)`;pv.disabled=i===0;nx.disabled=i>=max()};
pv.onclick=()=>go(i-1);nx.onclick=()=>go(i+1);addEventListener('resize',()=>go(i));go(0)}
/* contact */
const fm=$('form');if(fm)fm.onsubmit=e=>{e.preventDefault();$('.ok').style.display='block';fm.reset()};
/* ===== products & services page (edit SERVICES to change content) ===== */
const SERVICES=[
{id:'network',icon:'fa-solid fa-network-wired',name:'Network Solutions',short:'Cabling, LAN/WAN, Wi-Fi and security',title:'Networks that stay up when your team needs them',desc:'We design, install and maintain office and campus networks, from structured cabling to firewalls and Wi-Fi.',pts:['Structured cabling and racks','LAN, WAN and VPN setup','Wi-Fi planning and rollout','Firewalls and access control','Server and storage setup','Annual maintenance plans'],fit:'Best for offices, schools, shops and growing teams moving to a new space.',course:'Cisco and Red Hat training'},
{id:'software',icon:'fa-solid fa-code',name:'Software Development',short:'Custom business software',title:'Software built around the way you work',desc:'We turn a manual process into a working system: billing, inventory, student records, reports and more.',pts:['Requirement workshops','Web-based business applications','Database design and reporting','Integration with existing tools','Testing before every release','Support after launch'],fit:'Best for businesses outgrowing spreadsheets or off-the-shelf tools.',course:'Java, Python and Full Stack courses'},
{id:'training',icon:'fa-solid fa-graduation-cap',name:'Refined IT Training',short:'Industry-focused courses and corporate batches',title:'Training that ends with a portfolio and a certificate',desc:'Trainer-led classes with labs and projects for students, job seekers and company teams.',pts:['Networking, cloud and security','Programming and full stack','Data, AI and testing','Certification exam preparation','Internships on live projects','Placement support'],fit:'Best for students, career switchers and companies upskilling a team.',course:'See all courses',href:'courses.html'},
{id:'website',icon:'fa-solid fa-globe',name:'Website Development',short:'Responsive business websites',title:'A website that loads fast and works on every screen',desc:'We design and build business sites and online stores, then host and maintain them for you.',pts:['Design that fits your brand','Mobile-first, responsive layouts','Online stores and enquiry forms','Search-friendly structure','Hosting and domain setup','Content updates after launch'],fit:'Best for new businesses and companies replacing an outdated site.',course:'Website Development course'},
{id:'app',icon:'fa-solid fa-mobile-screen-button',name:'App Development',short:'Android and iOS apps',title:'Mobile apps from first sketch to the app store',desc:'We plan, design and build Android and iOS apps, and handle store publishing.',pts:['Product planning and wireframes','Android and iOS builds','Backend and API development','Push notifications and payments','Store listing and publishing','Updates and bug fixes'],fit:'Best for businesses that want to reach customers on their phones.',course:'Android & iOS course'},
{id:'marketing',icon:'fa-solid fa-bullhorn',name:'Digital Marketing',short:'SEO, social media and ads',title:'Marketing that brings the right customers to you',desc:'We plan and run campaigns across search, social media and email, and report what worked.',pts:['SEO and Google Business setup','Social media management','Paid ads on Google and Meta','Email and WhatsApp campaigns','Content and creatives','Monthly performance reports'],fit:'Best for local and online businesses that want steady enquiries.',course:'Digital Marketing course'}];
const MIX=[
{t:'Launch a new business',d:'A site, a presence online and the network to run it.',s:['website','marketing','network']},
{t:'Digitise operations',d:'Replace manual work with software your team can use on desktop and phone.',s:['software','app','training']},
{t:'Upskill your team',d:'Train staff on the systems we build and install for you.',s:['network','software','training']}];
(()=>{const tabs=$('#psTabs'),view=$('#psView');if(!tabs)return;
const byId=Object.fromEntries(SERVICES.map(s=>[s.id,s]));
tabs.innerHTML=SERVICES.map(s=>`<button class="unit" role="tab" id="t-${s.id}" aria-controls="p-${s.id}" aria-selected="false" tabindex="-1" data-id="${s.id}"><span class="ic2"><i class="${s.icon}"></i></span><span><b>${s.name}</b><small>${s.short}</small></span><span class="led"></span></button>`).join('');
view.innerHTML=SERVICES.map(s=>`<article class="pn" role="tabpanel" id="p-${s.id}" aria-labelledby="t-${s.id}" tabindex="0"><i class="${s.icon} mark" aria-hidden="true"></i><i class="dash"></i><h3>${s.title}</h3><p class="lead">${s.desc}</p><ul>${s.pts.map(p=>`<li>${p}</li>`).join('')}</ul><p class="fit"><b>${s.fit.split(' for ')[0]} for</b> ${s.fit.split(' for ').slice(1).join(' for ')}</p><div class="acts"><a class="btn" href="contact.html">Get a quote</a><a class="al" href="${s.href||'courses.html'}">${s.course}</a></div></article>`).join('');
const sel=(id,focus)=>{if(!byId[id])id=SERVICES[0].id;$$('.unit',tabs).forEach(b=>{const on=b.dataset.id===id;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on&&focus)b.focus();if(on&&tabs.scrollWidth>tabs.clientWidth)tabs.scrollTo({left:b.offsetLeft-16,behavior:rm?'auto':'smooth'})});
$$('.pn',view).forEach(p=>p.classList.toggle('on',p.id==='p-'+id))};
tabs.addEventListener('click',e=>{const b=e.target.closest('.unit');if(b){sel(b.dataset.id);history.replaceState(null,'','#'+b.dataset.id)}});
tabs.addEventListener('keydown',e=>{const k={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(!k)return;e.preventDefault();const i=SERVICES.findIndex(s=>s.id===document.activeElement.dataset.id);sel(SERVICES[(i+k+SERVICES.length)%SERVICES.length].id,true)});
const fromHash=()=>{const id=location.hash.slice(1);sel(id);if(byId[id])$('#services').scrollIntoView({behavior:rm?'auto':'smooth'})};
addEventListener('hashchange',fromHash);sel(location.hash.slice(1));if(byId[location.hash.slice(1)])setTimeout(()=>$('#services').scrollIntoView(),50);
($('#psMix')||{}).innerHTML=MIX.map(m=>`<div class="mx"><div><h3>${m.t}</h3><p>${m.d}</p></div><div class="chain">${m.s.map((id,i)=>`${i?'<i></i>':''}<a href="#${id}">${byId[id].name}</a>`).join('')}</div></div>`).join('')})();

/* ===== certifications, chroma grid cards (edit CERTS here, or use admin/certifications.html) =====
   img    = file in /assets (or a data: URL saved by the admin). Leave empty to show the icon.
   tags   = level chips under the description      accent = colour revealed under the spotlight */
const CERTS=[
{id:'k1',title:'Red Hat Certification',subtitle:'Training Partner',icon:'fa-brands fa-redhat',img:'',accent:'#ee0000',desc:'Red Hat is a pioneer of open-source collaboration and co-engineering, committed to enabling the enterprise to solve real business problems with cloud technology.',tags:['RHCSA','RHCE'],status:'published'},
{id:'k2',title:'Microsoft Certification',subtitle:'Registered Partner',icon:'fa-brands fa-windows',img:'microsoft-partner.jpg',accent:'#00a4ef',desc:'Microsoft offers a wide range of online certification programs (MCSA, MCSE, MCPD, MCTS) designed to take your IT skills and your career to the next level.',tags:['MCSA','MCSE','MCPD','MCTS'],status:'published'},
{id:'k3',title:'CISCO Certification',subtitle:'Learning Partner',icon:'fa-solid fa-network-wired',img:'cisco-learning-partner.jpg',accent:'#049fd9',desc:'We offer five levels of network certification training, up to Architect (CCAr), the highest level of accreditation within the Cisco certification program.',tags:['CCENT','CCNA','CCNP','CCIE','CCAr'],status:'published'},
{id:'k4',title:'IAF Recognition',subtitle:'Multilateral Recognition',icon:'fa-solid fa-globe',img:'iaf-logo.jpg',accent:'#1f5fbf',desc:"The IAF Multilateral Recognition Arrangement recognises the equivalence of other members' accreditations to their own. IAF members are organisations that represent a similar group of accreditation bodies.",tags:[],status:'published'},
{id:'k5',title:'STED Council',subtitle:'ISO 9001:2008 Certified',icon:'fa-solid fa-landmark',img:'sted-council-logo.jpg',accent:'#c8102e',desc:'An autonomous body and national development authority, registered NGO under the Government of India, working on skill and educational development.',tags:[],status:'published'},
{id:'k6',title:'ISO 9001:2008',subtitle:'Certified',icon:'fa-solid fa-certificate',img:'iso-logo.jpg',accent:'#f26f21',desc:'Our quality management processes are ISO 9001:2008 certified, so training and services follow consistent, audited standards.',tags:[],status:'published'}];
const certItems=()=>(DB('certs')||CERTS).filter(c=>c.status!=='draft').map(c=>({image:imgSrc(c.img),icon:c.icon,title:c.title,subtitle:c.subtitle,desc:c.desc,tags:c.tags||[],accent:c.accent||'#e0243d',url:c.url||'',alt:c.alt||c.title,fit:c.fit||'contain'}));
(()=>{if(!window.ChromaGrid)return;
 const full=$('#certGrid');if(full)ChromaGrid.mount(full,certItems(),{columns:3,minCardWidth:270,gap:22,radius:320,aspectRatio:'16 / 10',showDesc:true,dim:.03,theme:'light'});
 const mini=$('#partnerGrid');if(mini)ChromaGrid.mount(mini,certItems(),{columns:3,minCardWidth:150,gap:14,radius:300,aspectRatio:'16 / 9',showDesc:false,dim:.03,theme:'light'})})();

/* ===== home page: "Why choose us" carousel (edit WHY here, or Home page in the admin) ===== */
const WHY=[
{icon:'fa-solid fa-handshake',t:'Learning partner of Cisco & Microsoft',d:'Registered learning partners of CISCO and Microsoft, and a Red Hat training partner.'},
{icon:'fa-solid fa-chalkboard-user',t:'Industry-experienced trainers',d:'Learn from professionals who deliver real software and network projects.'},
{icon:'fa-solid fa-laptop-code',t:'Hands-on labs',d:'Practical sessions on real hardware, networks and live software projects.'},
{icon:'fa-solid fa-user-tie',t:'Placement support',d:'Resume building, mock interviews and company drives until you are hired.'},
{icon:'fa-solid fa-layer-group',t:'Training + services under one roof',d:'The same team that trains you also builds software and networks for clients.'},
{icon:'fa-solid fa-location-dot',t:'Based in Cochin',d:'Conveniently located at Paramara Road, Ernakulam North, with flexible batches.'}];
(()=>{const el=$('#whyCarousel');if(!el||!window.Carousel)return;
 const h=DB('home'),list=h&&h.why&&h.why.length?h.why:WHY;
 Carousel.mount(el,list.map(w=>({icon:w.icon,title:w.t,description:w.d})),{effect:'scale',baseWidth:'100%',maxCardWidth:580,aspectRatio:2.1,minHeight:236,gap:20,radius:18,frame:false,indicator:'bars',arrows:true,autoplay:true,autoplayDelay:4500,pauseOnHover:true,loop:true,label:'Why choose us'})})();

/* ===== courses page: featured programmes carousel (courses with feat:1, or "Featured" in the admin) ===== */
(()=>{const el=$('#featCarousel');if(!el||!window.Carousel)return;
 const list=COURSES.filter(c=>c.feat);
 Carousel.mount(el,list.map(c=>({image:c.fit==='contain'?'':imgSrc(c.img),pos:c.pos,alt:c.alt,icon:c.icon,title:c.title,description:c.desc,url:'course.html?id='+encodeURIComponent(courseId(c))})),
 {effect:'tilt',baseWidth:'100%',maxCardWidth:700,aspectRatio:1.8,minHeight:300,gap:0,radius:18,frame:false,indicator:'dots',arrows:true,autoplay:true,autoplayDelay:5000,pauseOnHover:true,loop:true,label:'Featured programmes'})})();

/* ===== placements page: student stories carousel (admin Testimonials marked "Placements page") ===== */
const STORIES=[
{quote:'The projects gave me real confidence in interviews.',name:'Student name',course:'Full Stack Web Development'},
{quote:'Mock interviews every week made the real one feel familiar.',name:'Student name',course:'Data Analytics'},
{quote:'The Cisco lab practice made my CCNA exam far easier.',name:'Student name',course:'Cisco Networking'},
{quote:'I joined with no coding background and left with a job offer.',name:'Student name',course:'Python Programming'}];
(()=>{const el=$('#storyCarousel');if(!el||!window.Carousel)return;
 const t=DB('testi'),list=(t&&t.length?t.filter(x=>x.status!=='draft'&&x.onPlacements!==false):STORIES);
 if(!list.length){el.closest('section').hidden=true;return}
 Carousel.mount(el,list.map(x=>({quote:x.quote,by:x.name,role:[x.course,x.placedAt].filter(Boolean).join(' · ')})),
 {effect:'slide',baseWidth:'100%',maxCardWidth:760,aspectRatio:3,minHeight:214,gap:24,radius:16,frame:false,indicator:'counter',arrows:true,autoplay:true,autoplayDelay:6000,pauseOnHover:true,loop:true,label:'Student success stories'})})();

/* contact form: course list comes from the admin-managed courses; ?course=<id> preselects one */
(()=>{const sel=$('#courseSel');if(!sel)return;
 sel.innerHTML=COURSES.map(c=>`<option value="${courseId(c)}">${c.title}</option>`).join('');
 const want=new URLSearchParams(location.search).get('course');if(want&&[...sel.options].some(o=>o.value===want))sel.value=want})();
