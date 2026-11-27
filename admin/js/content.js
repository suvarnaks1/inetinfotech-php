/* Default content of every editable page, copied from the live site. The admin saves edits to localStorage ('inet.<key>').
   BACKEND: replace each DEF key with GET /api/<key> and each Save with PUT /api/<key>. Arrays keep their order = display order. */
const DEF={
home:{
 hero:{l1:'Learn.',l2:'Build.',l3:'Launch.',p:'IT training and software, made in Cochin.',btn:'See courses',href:'courses.html',years:'19',yearsLabel:'years',
  img1:'it-programming.jpg',img2:'digital-marketing.jpg',img3:'internship.jpg'},
 ticker:[{w:'Learn'},{w:'Build'},{w:'Get hired'}],
 track:{a:'Pick your',b:'track',items:[
  {label:'Code',img:'it-programming.jpg',pos:'center 20%',alt:'Code poster',href:'courses.html'},
  {label:'Marketing',img:'digital-marketing.jpg',pos:'center top',alt:'Marketing poster',href:'courses.html'},
  {label:'Network',img:'hardware-networking.jpg',pos:'center',alt:'Network poster',href:'courses.html'},
  {label:'Intern',img:'internship.jpg',pos:'60% center',alt:'Intern poster',href:'courses.html'},
  {label:'Manage',img:'project-management.webp',pos:'center',alt:'Manage poster',href:'courses.html'}]},
 logos:{title:'Our certifications'},
 cta:{a:'Your seat',b:'is waiting.',btn:'Enrol now',href:'contact.html'}
},
about:{
 hero:{a:'About',b:'us',p:'We teach what the industry hires for',btn:'Talk to us',href:'contact.html'},
 say:{a:'Classrooms that feel like',b:'labs.',c:'Trainers who work in the industry.',p:'I-Net Infotech is a Cochin IT services firm. We build software, set up networks and train people, and we have done it for 19 years. We are Cisco and Microsoft learning partners and ISO 9001:2015 certified.'},
 tiles:[{icon:'fa-solid fa-rocket',t:'Mission',d:'To give every learner job-ready IT skills through hands-on training, real tools and trainers who work in the industry.'},
  {icon:'fa-solid fa-eye',t:'Vision',d:'To be the most trusted name in Cochin for IT training and services, where learning leads straight to a career.'},
  {icon:'fa-solid fa-bullseye',t:'Goal',d:'To prepare every student for certification and employment, with placement support from the first class to the first job.'}],
 what:{title:'What we do',p:'Three services under one roof, so what we teach is what we practise.',items:[
  {icon:'fa-solid fa-graduation-cap',t:'IT training',d:'Classroom courses in networking, Linux, programming, web, data, cloud and digital marketing.'},
  {icon:'fa-solid fa-code',t:'Software development',d:'Websites, apps and business software built for clients in Cochin and beyond.'},
  {icon:'fa-solid fa-network-wired',t:'Networking services',d:'Cabling, LAN and Wi-Fi setup, firewalls, servers and annual maintenance.'}]},
 why:{title:'Why I-Net',p:'The facts behind the name.',items:[
  {icon:'fa-solid fa-clock-rotate-left',t:'19 years',d:'Training students and serving clients in Cochin.'},
  {icon:'fa-solid fa-certificate',t:'Cisco and Microsoft partner',d:'Learning partner status means current syllabus and recognised exams.'},
  {icon:'fa-solid fa-award',t:'ISO 9001:2015',d:'Our processes are certified for consistent quality.'},
  {icon:'fa-solid fa-handshake',t:'Placement support',d:'Resume help, interview practice and referrals to hiring companies.'}]}
},
coursesPage:{
 hero:{a:'Our',b:'courses',p:'Pick a track. Build real work.',btn:'Talk to a counsellor',href:'contact.html'},
 how:{title:'How it works',p:'From first call to first job, in three clear stages.',steps:[
  {t:'Counselling',d:'Tell us your background and goal. We suggest the right course and batch timing.'},
  {t:'Hands-on training',d:'Lab and project based classes with trainers who work in the industry.'},
  {t:'Certify and get placed',d:'Exam preparation for Cisco, Microsoft and Red Hat, then resume and interview support.'}]}
},
services:{
 hero:{a:'Our',b:'services',p:'Network, software and growth, from one Cochin team.',btn:'Request a quote',href:'contact.html'},
 how:{title:'How we work',p:'A simple process so you always know what happens next.',steps:[
  {t:'Consult',d:'We visit or call, understand your needs and note what you already have.'},
  {t:'Plan',d:'You get a clear scope, timeline and quote before any work starts.'},
  {t:'Deliver',d:'Our engineers build, install and test, then walk your team through it.'},
  {t:'Support',d:'Maintenance plans and a direct phone line for when something needs fixing.'}]},
 list:[
  {id:'network',icon:'fa-solid fa-network-wired',name:'Network Solutions',short:'Cabling, LAN/WAN, Wi-Fi and security',title:'Networks that stay up when your team needs them',desc:'We design, install and maintain office and campus networks, from structured cabling to firewalls and Wi-Fi.',pts:['Structured cabling and racks','LAN, WAN and VPN setup','Wi-Fi planning and rollout','Firewalls and access control','Server and storage setup','Annual maintenance plans'],fit:'Best for offices, schools, shops and growing teams moving to a new space.',course:'Cisco and Red Hat training',href:''},
  {id:'software',icon:'fa-solid fa-code',name:'Software Development',short:'Custom business software',title:'Software built around the way you work',desc:'We turn a manual process into a working system: billing, inventory, student records, reports and more.',pts:['Requirement workshops','Web-based business applications','Database design and reporting','Integration with existing tools','Testing before every release','Support after launch'],fit:'Best for businesses outgrowing spreadsheets or off-the-shelf tools.',course:'Java, Python and Full Stack courses',href:''},
  {id:'training',icon:'fa-solid fa-graduation-cap',name:'Refined IT Training',short:'Industry-focused courses and corporate batches',title:'Training that ends with a portfolio and a certificate',desc:'Trainer-led classes with labs and projects for students, job seekers and company teams.',pts:['Networking, cloud and security','Programming and full stack','Data, AI and testing','Certification exam preparation','Internships on live projects','Placement support'],fit:'Best for students, career switchers and companies upskilling a team.',course:'See all courses',href:'courses.html'},
  {id:'website',icon:'fa-solid fa-globe',name:'Website Development',short:'Responsive business websites',title:'A website that loads fast and works on every screen',desc:'We design and build business sites and online stores, then host and maintain them for you.',pts:['Design that fits your brand','Mobile-first, responsive layouts','Online stores and enquiry forms','Search-friendly structure','Hosting and domain setup','Content updates after launch'],fit:'Best for new businesses and companies replacing an outdated site.',course:'Website Development course',href:''},
  {id:'app',icon:'fa-solid fa-mobile-screen-button',name:'App Development',short:'Android and iOS apps',title:'Mobile apps from first sketch to the app store',desc:'We plan, design and build Android and iOS apps, and handle store publishing.',pts:['Product planning and wireframes','Android and iOS builds','Backend and API development','Push notifications and payments','Store listing and publishing','Updates and bug fixes'],fit:'Best for businesses that want to reach customers on their phones.',course:'Android & iOS course',href:''},
  {id:'marketing',icon:'fa-solid fa-bullhorn',name:'Digital Marketing',short:'SEO, social media and ads',title:'Marketing that brings the right customers to you',desc:'We plan and run campaigns across search, social media and email, and report what worked.',pts:['SEO and Google Business setup','Social media management','Paid ads on Google and Meta','Email and WhatsApp campaigns','Content and creatives','Monthly performance reports'],fit:'Best for local and online businesses that want steady enquiries.',course:'Digital Marketing course',href:''}]
},
pcontent:{
 hero:{a:'Placed',b:'students',p:'Your first job starts here.',btn:'Start your journey',href:'contact.html'},
 dome:{a:'Our Placed',b:'Students',lead:'Drag to spin the dome, tap a photo to enlarge.',hint:'Drag to explore'}
},
gallery:{
 hero:{a:'Life at',b:'I-Net',p:'Classes, workshops, celebrations.',btn:'Visit the campus',href:'contact.html'},
 wall:{a:'Learning in',b:'Motion'},
 items:[
  {img:'it-programming.jpg',alt:'Programming labs',pos:'center 12%',fit:''},{img:'digital-marketing.jpg',alt:'Digital marketing',pos:'center 0%',fit:''},
  {img:'hardware-networking.jpg',alt:'Hardware & networking',pos:'',fit:''},{img:'internship.jpg',alt:'Internship programme',pos:'center 40%',fit:''},
  {img:'project-management.webp',alt:'Project management',pos:'',fit:''},{img:'iso-logo.jpg',alt:'ISO 9001:2015 certified',pos:'',fit:'contain'},
  {img:'cisco-learning-partner.jpg',alt:'Cisco Learning Partner',pos:'',fit:'contain'},{img:'microsoft-partner.jpg',alt:'Microsoft Registered Partner',pos:'',fit:'contain'},
  {img:'iaf-logo.jpg',alt:'IAF recognition',pos:'',fit:'contain'},{img:'sted-council-logo.jpg',alt:'STED Council',pos:'',fit:'contain'},
  {img:'hardware-networking.jpg',alt:'Hardware & networking',pos:'',fit:''},{img:'internship.jpg',alt:'Internship programme',pos:'center 40%',fit:''},
  {img:'project-management.webp',alt:'Project management',pos:'',fit:''},{img:'it-programming.jpg',alt:'Programming labs',pos:'center 12%',fit:''},
  {img:'digital-marketing.jpg',alt:'Digital marketing',pos:'center 0%',fit:''}]
},
contact:{
 hero:{a:'Say',b:'hello',p:'Tell us what you want to learn.',btn:'Call us',href:'tel:+919846233339'},
 form:{success:'Thank you! We will contact you shortly.',button:'Send enquiry'},
 info:[{l:'Address',v:', VBM Bava Chamber, Paramara Road, Ernakulam North, Cochin 682018, India'},{l:'Phone',v:'+91 98462 33339 | +91 96332 33339'},{l:'WhatsApp',v:'Message us on WhatsApp'},{l:'Website',v:'www.inetinfotech.in'},{l:'Hours',v:'Monday to Saturday, 9:00 am to 6:00 pm'}],
 mapQuery:'VBM Bava Chamber Paramara Road Ernakulam North Cochin 682018',
 next:{title:'What happens next',p:'After you send the form or call us.',steps:[
  {t:'We reply',d:'A counsellor calls or messages you, usually within one working day.'},
  {t:'Campus visit',d:'Visit us at VBM Bava Chamber, see the labs and meet the trainers.'},
  {t:'Join a batch',d:'Pick a course and batch timing that suits you and start learning.'}]}
},
site:{
 navBtn:'Enrol now',phone1:'+91 98462 33339',phone2:'+91 96332 33339',whatsapp:'919846233339',
 address:'VBM Bava Chamber, Paramara Road, Ernakulam North, Cochin 682018',copyright:'© 2026 I-Net Infotech',
 menu:[{l:'Home',href:'index.html'},{l:'About',href:'about.html'},{l:'Courses',href:'courses.html'},{l:'Services',href:'products.html'},{l:'Placements',href:'placements.html'},{l:'Gallery',href:'gallery.html'},{l:'Contact',href:'contact.html'}],
 footerLinks:[{l:'Courses',href:'courses.html'},{l:'Placements',href:'placements.html'},{l:'Gallery',href:'gallery.html'},{l:'About',href:'about.html'},{l:'Contact',href:'contact.html'}]
}
};
