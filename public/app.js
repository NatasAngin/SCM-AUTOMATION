const $ = (s, root=document) => root.querySelector(s);
const state = { user:null, page:"dashboard", rows:[], dialogResource:null };
const resources = {
  sourcing:{title:"Sourcing Request",endpoint:"sourcing",description:"Kelola permintaan pengadaan dari unit kerja.",fields:[["request_no","Nomor Request","text",true],["title","Judul Pengadaan","text",true],["department","Departemen","text"],["estimated_value","Estimasi Nilai (Rp)","number"],["status","Status","select",true,["Draft","Review","RFQ","Evaluation","Awarded","Cancelled"]],["request_date","Tanggal Request","date"]],columns:["request_no","title","department","estimated_value","status","request_date"]},
  vendors:{title:"Vendor Management",endpoint:"vendors",description:"Kelola master data dan informasi penyedia.",fields:[["code","Kode Vendor","text",true],["name","Nama Vendor","text",true],["category","Kategori","text"],["email","Email","email"],["phone","Nomor Telepon","text"],["status","Status","select",true,["Active","Inactive","Pending"]]],columns:["code","name","category","email","phone","status"]},
  kak:{title:"KAK / Kerangka Acuan Kerja",endpoint:"kak",description:"Buat dan kelola KAK/TOR, termasuk spesifikasi teknis dan komersial.",fields:[["kak_no","Nomor KAK","text",true],["title","Judul Pekerjaan","text",true],["department","Departemen","text",true],["requester","Pemohon / Pembuat","text",true],["background","Latar Belakang","textarea"],["objective","Maksud dan Tujuan","textarea"],["scope","Ruang Lingkup","textarea"],["deliverables","Output / Deliverables","textarea"],["location","Lokasi","text"],["duration","Durasi","text"],["schedule","Jadwal","text"],["budget","Pagu Anggaran (Rp)","number"],["payment_terms","Ketentuan Pembayaran","textarea"],["requirements","Persyaratan Administrasi, Teknis dan Komersial","textarea"],["evaluation_method","Metode Evaluasi","textarea"],["special_terms","Detail Teknis (JSON)","textarea"],["status","Status","select",true,["Draft","Review","Approved","Cancelled"]]],columns:["kak_no","title","department","requester","budget","status","created_at"]},
  contracts:{title:"Contract Management",endpoint:"contracts",description:"Pantau kontrak yang telah ditetapkan dan masa berlakunya.",fields:[["contract_no","Nomor Kontrak","text",true],["vendor_id","ID Vendor","number"],["title","Judul Kontrak","text",true],["contract_value","Nilai Kontrak (Rp)","number"],["start_date","Tanggal Mulai","date"],["end_date","Tanggal Selesai","date"],["status","Status","select",true,["Draft","Pending Approval","Active","Expired","Closed"]]],columns:["contract_no","title","vendor_id","contract_value","start_date","end_date","status"]},
  contract_drafts:{title:"Draft Contract Generator",endpoint:"contract_drafts",description:"Bangun draft kontrak yang terhubung dengan KAK dan vendor.",fields:[["draft_no","Nomor Draft","text",true],["kak_id","ID KAK","number"],["vendor_id","ID Vendor","number"],["title","Judul Kontrak","text",true],["contract_value","Nilai Kontrak (Rp)","number"],["start_date","Tanggal Mulai","date",true],["end_date","Tanggal Selesai","date",true],["scope","Ruang Lingkup","textarea"],["payment_terms","Ketentuan Pembayaran","textarea"],["clauses","Klausul (SLA, Garansi, Denda, HSE, dll.)","textarea"],["status","Status","select",true,["Draft","Review","Approved","Rejected"]]],columns:["draft_no","title","kak_id","vendor_id","contract_value","start_date","end_date","status"]},
  obligations:{title:"Contract Obligations",endpoint:"obligations",description:"Monitor kewajiban penyedia dan perusahaan.",fields:[["contract_id","ID Kontrak","number"],["title","Kewajiban","text",true],["vendor_name","Vendor","text"],["due_date","Jatuh Tempo","date"],["status","Status","select",true,["Open","Due Soon","Completed","Overdue"]],["notes","Catatan","textarea"]],columns:["title","vendor_name","due_date","status","notes"]},
  change_orders:{title:"Change Orders",endpoint:"change_orders",description:"Catat perubahan ruang lingkup dan nilai kontrak.",fields:[["contract_id","ID Kontrak","number"],["change_no","Nomor Change Order","text",true],["title","Judul Perubahan","text",true],["reason","Alasan Perubahan","textarea"],["value_delta","Perubahan Nilai (Rp)","number"],["status","Status","select",true,["Draft","Pending Approval","Approved","Rejected"]]],columns:["change_no","title","contract_id","value_delta","status"]},
  approvals:{title:"Approval Workflow",endpoint:"approvals",description:"Pantau dokumen yang membutuhkan keputusan pejabat berwenang.",fields:[["ref_type","Jenis Dokumen","text",true],["ref_id","ID Dokumen","number",true],["ref_no","Nomor Dokumen","text",true],["title","Judul","text",true],["requester","Pemohon","text"],["status","Status","select",true,["Pending","Approved","Rejected"]]],columns:["ref_type","ref_no","title","requester","status","created_at"]},
  contract_monitoring:{title:"Contract Monitoring",endpoint:"contracts",description:"Monitoring masa berlaku kontrak dan status kewajiban.",fields:[],columns:["contract_no","title","vendor_id","start_date","end_date","status"]},
  reports:{title:"Reports & Analytics",endpoint:"contracts",description:"Ringkasan eksekutif sourcing, kontrak, dan nilai portofolio.",fields:[],columns:["contract_no","title","contract_value","status"]},
  autopilot:{title:"SCM Auto-Pilot",endpoint:"contracts",description:"Monitoring kontrak yang mendekati masa berakhir dan kewajiban jatuh tempo.",fields:[],columns:["contract_no","title","end_date","status"]},
  ai_settings:{title:"AI Settings",endpoint:"",description:"Status dan konfigurasi AI Copilot.",fields:[],columns:[]},
  settings:{title:"Settings",endpoint:"",description:"Informasi akun dan preferensi workspace.",fields:[],columns:[]},
  help:{title:"Help Center",endpoint:"",description:"Panduan alur kerja Smart Sourcing & Contract Management.",fields:[],columns:[]},
  vendor_performance:{title:"Vendor Performance",endpoint:"vendor_performance",description:"Evaluasi kualitas, ketepatan pengiriman, dan kepatuhan vendor.",fields:[["vendor_id","ID Vendor","number",true],["score","Total Score","number"],["quality_score","Quality Score","number"],["delivery_score","Delivery Score","number"],["compliance_score","Compliance Score","number"],["period_label","Periode","text"]],columns:["vendor_id","score","quality_score","delivery_score","compliance_score","period_label"]}
};
async function api(path, options={}) {
  const response = await fetch("/api/"+path,{credentials:"same-origin",...options,headers:{...(options.body instanceof FormData?{}:{"content-type":"application/json"}),...(options.headers||{})}});
  const data = response.status===204?{}:await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||"Permintaan gagal.");
  return data;
}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function money(value){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value||0))}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function boot(){
  try{const d=await api("auth/me");state.user=d.user;showApp()}
  catch{$("#login-screen").classList.remove("hidden");$("#app-shell").classList.add("hidden")}
}
function showApp(){
  $("#login-screen").classList.add("hidden");$("#app-shell").classList.remove("hidden");
  $("#user-name").textContent=state.user.full_name;$("#user-role").textContent=state.user.role;$("#user-avatar").textContent=(state.user.full_name||"A").slice(0,1).toUpperCase();
  renderPage("dashboard");
}
async function renderPage(page){
  state.page=page;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const config=resources[page];$("#page-title").textContent=page==="dashboard"?"Dashboard":config.title;
  $("#page-content").innerHTML='<div class="loading">Memuat data...</div>';
  if(page==="dashboard"){await renderDashboard();return}
  if(["contract_monitoring","reports","autopilot","ai_settings","settings","help"].includes(page)){await renderVirtualPage(page,config);return}
  await renderResource(config);
}
async function renderDashboard(){
  try{
    const [metrics, recent]=await Promise.all([api("dashboard"),api("sourcing?limit=5")]);
    const m=metrics.metrics;
    $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">PROCUREMENT OVERVIEW</p><h1>Dashboard</h1><p>Ringkasan aktivitas sourcing dan contract management.</p></div></div>
    <div class="metric-grid">
      ${metric("Sourcing Request",m.sourcing,"Permintaan pengadaan")}${metric("KAK / TOR",m.kak,"Dokumen acuan kerja")}${metric("Vendor",m.vendors,"Master penyedia")}${metric("Kontrak",m.contracts,"Kontrak terdaftar")}
      ${metric("Draft Contract",m.contract_drafts,"Draft dalam proses")}${metric("Pending Approval",m.pending_approvals,"Menunggu keputusan")}${metric("Open Obligations",m.open_obligations,"Kewajiban berjalan")}
    </div><div class="panel"><div class="panel-head"><div><h3>Sourcing Request Terbaru</h3><p>Data permintaan pengadaan terakhir</p></div><button class="action-button" data-go="sourcing">Lihat semua</button></div>${tableHtml(recent.data,resources.sourcing.columns)}</div>`;
    $("[data-go]")?.addEventListener("click",()=>renderPage("sourcing"));
  }catch(e){$("#page-content").innerHTML='<div class="panel empty">'+esc(e.message)+'</div>'}
}
function metric(label,value,hint){return `<div class="metric"><div class="label">${label}</div><div class="value">${Number(value||0).toLocaleString("id-ID")}</div><div class="hint">${hint}</div></div>`}
async function renderVirtualPage(page,config){
  try{
    if(page==="ai_settings"){
      $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">AUTOMATION & AI</p><h1>${config.title}</h1><p>${config.description}</p></div></div><div class="panel"><h3>Cloudflare Workers AI</h3><p>AI Copilot menggunakan binding Workers AI jika telah diaktifkan pada konfigurasi Worker. Model lokal Ollama dari instalasi XAMPP tidak otomatis tersedia di Cloudflare.</p><p class="hint">Status integrasi diperiksa saat permintaan AI dijalankan.</p></div>`;return;
    }
    if(page==="settings"){
      $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">SYSTEM</p><h1>${config.title}</h1><p>${config.description}</p></div></div><div class="panel"><h3>Profil Pengguna</h3><div class="metric-grid"><div class="metric"><div class="label">Nama</div><div class="value" style="font-size:18px">${esc(state.user.full_name)}</div></div><div class="metric"><div class="label">Username</div><div class="value" style="font-size:18px">${esc(state.user.username)}</div></div><div class="metric"><div class="label">Role</div><div class="value" style="font-size:18px">${esc(state.user.role)}</div></div></div><p class="hint">Pengaturan keamanan akun dikelola oleh administrator sistem.</p></div>`;return;
    }
    if(page==="help"){
      $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">SYSTEM</p><h1>${config.title}</h1><p>${config.description}</p></div></div><div class="panel"><h3>Alur Procurement</h3><ol class="workflow"><li>Sourcing Request</li><li>KAK / TOR</li><li>Evaluasi dan pemilihan vendor</li><li>Draft Kontrak</li><li>Approval dan Contract Management</li><li>Obligations dan Contract Monitoring</li></ol><p class="hint">AI memberikan rekomendasi; keputusan dan persetujuan tetap dilakukan pejabat berwenang.</p></div>`;return;
    }
    const [contracts,obligations]=await Promise.all([api("contracts?limit=500"),api("obligations?limit=500")]);
    const rows=contracts.data||[], obs=obligations.data||[];
    const today=new Date();today.setHours(0,0,0,0);
    const daysLeft=d=>{if(!d)return null;const t=new Date(d+"T00:00:00");return Math.ceil((t-today)/86400000)};
    if(page==="contract_monitoring"||page==="autopilot"){
      const filtered=rows.filter(r=>r.status==="Active" && daysLeft(r.end_date)!==null && daysLeft(r.end_date)<=90).sort((a,b)=>daysLeft(a.end_date)-daysLeft(b.end_date));
      const expiring=filtered.map(r=>({...r,remaining_days:daysLeft(r.end_date)}));
      const overdue=obs.filter(o=>o.status==="Overdue"||(o.due_date&&daysLeft(o.due_date)<0&&o.status!=="Completed"));
      const cols=["contract_no","title","end_date","remaining_days","status"];
      $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">CONTRACT GOVERNANCE</p><h1>${config.title}</h1><p>${config.description}</p></div></div><div class="metric-grid"><div class="metric"><div class="label">Kontrak Aktif</div><div class="value">${rows.filter(r=>r.status==="Active").length}</div></div><div class="metric"><div class="label">Expiry ≤ 90 Hari</div><div class="value">${filtered.length}</div></div><div class="metric"><div class="label">Obligation Overdue</div><div class="value">${overdue.length}</div></div></div><div class="panel"><div class="panel-head"><div><h3>Kontrak Mendekati Expiry</h3><p>Daftar dihitung berdasarkan tanggal akhir kontrak.</p></div></div>${tableHtml(expiring,cols)}</div><div class="panel"><h3>Obligations Overdue</h3>${tableHtml(overdue,["title","vendor_name","due_date","status"])}</div>`;return;
    }
    const active=rows.filter(r=>r.status==="Active");
    const total=active.reduce((n,r)=>n+Number(r.contract_value||0),0);
    $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">EXECUTIVE PROCUREMENT REPORT</p><h1>${config.title}</h1><p>${config.description}</p></div><button class="primary" onclick="window.print()">Cetak Laporan</button></div><div class="metric-grid"><div class="metric"><div class="label">Total Kontrak</div><div class="value">${rows.length}</div></div><div class="metric"><div class="label">Kontrak Aktif</div><div class="value">${active.length}</div></div><div class="metric"><div class="label">Nilai Kontrak Aktif</div><div class="value" style="font-size:20px">${esc(money(total))}</div></div><div class="metric"><div class="label">Obligations</div><div class="value">${obs.length}</div></div></div><div class="panel"><h3>Register Kontrak</h3>${tableHtml(rows,["contract_no","title","contract_value","start_date","end_date","status"])}</div>`;
  }catch(e){$("#page-content").innerHTML='<div class="panel empty">'+esc(e.message)+'</div>'}
}
async function renderResource(config){
  try{const result=await api(config.endpoint+"?limit=250");state.rows=result.data||[];
    $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">SCM WORKSPACE</p><h1>${config.title}</h1><p>${config.description}</p></div><button class="primary" id="add-record">＋ Tambah Data</button></div><div class="panel"><div class="panel-head"><div><h3>Register ${config.title}</h3><p>${state.rows.length} data tercatat</p></div></div><div class="table-wrap" id="resource-table">${tableHtml(state.rows,config.columns)}</div></div>`;
    $("#add-record").addEventListener("click",()=>openDialog(config));
  }catch(e){$("#page-content").innerHTML='<div class="panel empty">'+esc(e.message)+'</div>'}
}
function tableHtml(rows,columns){
  if(!rows?.length)return '<div class="empty">Belum ada data. Gunakan tombol Tambah Data untuk membuat entri pertama.</div>';
  return `<table><thead><tr>${columns.map(c=>'<th>'+esc(c.replaceAll("_"," ").toUpperCase())+'</th>').join("")}</tr></thead><tbody>${rows.map(row=>'<tr>'+columns.map(c=>'<td>'+cellValue(c,row[c])+'</td>').join("")+'</tr>').join("")}</tbody></table>`;
}
function cellValue(key,value){
  if(value===null||value===undefined||value==="")return "—";
  if(["budget","estimated_value","contract_value","value_delta"].includes(key))return esc(money(value));
  if(key==="status")return '<span class="status '+esc(value)+'">'+esc(value)+'</span>';
  if(key==="created_at")return esc(new Date(value+"Z").toLocaleDateString("id-ID"));
  return esc(value);
}
function openDialog(config){
  state.dialogResource=config;$("#dialog-title").textContent="Tambah "+config.title;$("#form-fields").innerHTML="";
  for(const [name,label,type,required,options] of config.fields){
    const wrap=document.createElement("label");wrap.className="field"+(type==="textarea"?" full":"");wrap.textContent=label+(required?" *":"");
    let input;
    if(type==="select"){input=document.createElement("select");input.innerHTML='<option value="">Pilih status</option>'+options.map(o=>'<option>'+esc(o)+'</option>').join("")}
    else if(type==="textarea"){input=document.createElement("textarea");if(name==="special_terms")input.placeholder='Contoh: {"type":"Material / Barang","details":{"technical_specification":"..."}}'}
    else{input=document.createElement("input");input.type=type}
    input.name=name;input.required=!!required;wrap.append(input);$("#form-fields").append(wrap);
  }
  $("#record-dialog").showModal();
}
async function saveRecord(event){
  event.preventDefault();const config=state.dialogResource;const data=Object.fromEntries(new FormData(event.currentTarget).entries());
  for(const [key,value] of Object.entries(data)){if(["budget","estimated_value","contract_value","vendor_id","kak_id","contract_id","ref_id","value_delta","score","quality_score","delivery_score","compliance_score"].includes(key))data[key]=value===""?null:Number(value)}
  try{await api(config.endpoint,{method:"POST",body:JSON.stringify(data)});$("#record-dialog").close();toast("Data berhasil disimpan.");await renderResource(config)}
  catch(e){toast(e.message)}
}
$("#login-form").addEventListener("submit",async e=>{e.preventDefault();$("#login-error").textContent="";const form=Object.fromEntries(new FormData(e.currentTarget).entries());try{const r=await api("auth/login",{method:"POST",body:JSON.stringify(form)});state.user=r.user;showApp()}catch(err){$("#login-error").textContent=err.message}});
$("#logout").addEventListener("click",async()=>{await api("auth/logout",{method:"POST",body:"{}"});state.user=null;$("#app-shell").classList.add("hidden");$("#login-screen").classList.remove("hidden")});
$("#navigation").addEventListener("click",e=>{const button=e.target.closest("[data-page]");if(button)renderPage(button.dataset.page)});
$("#record-form").addEventListener("submit",saveRecord);
$("#dialog-close").addEventListener("click",()=>$("#record-dialog").close());
$("#dialog-cancel").addEventListener("click",()=>$("#record-dialog").close());
boot();
