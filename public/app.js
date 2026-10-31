const $ = (s, root=document) => root.querySelector(s);
const state = { user:null, page:"dashboard", rows:[], dialogResource:null };
const resources = {
  sourcing:{title:"Sourcing Request",endpoint:"sourcing",description:"Kelola permintaan pengadaan dari unit kerja.",fields:[["request_no","Nomor Request","text",true],["title","Judul Pengadaan","text",true],["department","Departemen","text"],["estimated_value","Estimasi Nilai (Rp)","number"],["status","Status","select",true,["Draft","Review","RFQ","Evaluation","Awarded","Cancelled"]],["request_date","Tanggal Request","date"]],columns:["request_no","title","department","estimated_value","status","request_date"]},
  vendors:{title:"Vendor Management",endpoint:"vendors",description:"Kelola master data dan informasi penyedia.",fields:[["code","Kode Vendor","text",true],["name","Nama Vendor","text",true],["category","Kategori","text"],["email","Email","email"],["phone","Nomor Telepon","text"],["status","Status","select",true,["Active","Inactive","Pending"]]],columns:["code","name","category","email","phone","status"]},
  kak:{title:"KAK / Kerangka Acuan Kerja",endpoint:"kak",description:"Generator KAK sesuai struktur dokumen acuan, dengan persyaratan dan ruang lingkup dinamis.",fields:[["kak_no","Nomor KAK","text",true],["title","Judul Pekerjaan","text",true],["division","Divisi","text",true],["department","Departemen","text",true],["procurement_type","Jenis Pengadaan","select",true,["Material / Barang","Jasa / Services","Konsultan"]],["created_by","Dibuat Oleh / Pemohon","text",true],["scope","1. Pendahuluan","textarea",true],["background","2. Latar Belakang","textarea",true],["objective","3. Maksud dan Tujuan","textarea",true],["location","Lokasi Pekerjaan","text"],["duration","Durasi Pekerjaan / Kontrak","text"],["schedule","Jadwal Pelaksanaan","text"],["budget","Pagu Anggaran (Rp)","number"],["tender_method","4. Metode Tender","select",true,["Penunjukan Langsung","Pemilihan Langsung","Tender Terbuka"]],["contract_winner","5. Metode Kontrak / Jumlah Pemenang","select",true,["1 Pemenang","2 Pemenang","3 Pemenang"]],["evaluation_method","6. Metode Evaluasi","select",true,["Pass – Fail","Scoring","Kombinasi"]],["admin","7a. Persyaratan Administrasi","textarea"],["technical","7b. Persyaratan Teknis","textarea"],["commercial","7c. Persyaratan Komersial","textarea"],["contract_type","Jenis Kontrak","text"],["contract_duration","Durasi Kontrak","text"],["delivery_duration","Durasi Pengiriman","text"],["work_duration","Durasi Pekerjaan","text"],["work_location","Lokasi Kerja","text"],["execution_method","Cara Pelaksanaan Pekerjaan","textarea"],["technical_specification","Spesifikasi Teknis / Part Number / Serial Number / Drawing","textarea"],["brand","Merek (jika diperlukan)","text"],["material_description","Deskripsi Material","textarea"],["estimated_quantity","Estimasi Kuantitas","textarea"],["contract_scheme","Skema Kontrak (Fix Price / Call Out / Price Adjustment)","textarea"],["payment_scheme","Skema Pembayaran","textarea"],["after_sales_warranty","Jaminan Purnajual / Garansi Pemakaian","textarea"],["training","Training","textarea"],["delivery_place","Tempat Penyerahan","text"],["commissioning","Commissioning / Uji Coba","textarea"],["provider_responsibility","Tanggung Jawab Penyedia","textarea"],["company_responsibility","Tanggung Jawab Perusahaan","textarea"],["sanctions","Sanksi","textarea"],["performance_index","Indeks Performa","textarea"],["others","Ketentuan Lain-lain","textarea"],["work_output","Hasil / Target / Output Pekerjaan","textarea"],["tools_requirement","Jenis / Jumlah Alat dan Drawing","textarea"],["qualification_certification","Kualifikasi dan Sertifikasi SDM","textarea"],["work_warranty","Garansi Pekerjaan","textarea"],["risk_classification","Klasifikasi Risiko","textarea"],["reporting_supervision","Mekanisme Pelaporan dan Pengawasan","textarea"],["work_scope","Lingkup Pekerjaan","textarea"],["methodology","Metodologi dan Cara Pelaksanaan","textarea"],["checked_by","Diperiksa Oleh","text",true],["approved_by","Disetujui Oleh","text",true],["status","Status","select",true,["Draft","Review","Approved","Cancelled"]]],columns:["kak_no","title","department","requester","budget","status","created_at"]},
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
  return `<table><thead><tr>${columns.map(c=>'<th>'+esc(c.replaceAll("_"," ").toUpperCase())+'</th>').join("")}${state.page==="kak"?"<th>AKSI</th>":""}</tr></thead><tbody>${rows.map(row=>'<tr>'+columns.map(c=>'<td>'+cellValue(c,row[c])+'</td>').join("")+(state.page==="kak"?'<td><button type="button" class="action-button" data-kak-preview="'+Number(row.id)+'">Preview / Cetak PDF</button></td>':"")+'</tr>').join("")}</tbody></table>`;
}

function openKakPreview(id){
  const row=state.rows.find(item=>Number(item.id)===Number(id));
  if(!row){toast("Data KAK tidak ditemukan.");return}
  let meta={};try{meta=JSON.parse(row.special_terms||"{}")}catch(error){toast("Metadata KAK tidak valid.");return}
  const details=meta.details||{};
  const labels={contract_type:"Jenis Kontrak",contract_duration:"Durasi Kontrak",delivery_duration:"Durasi Pengiriman",work_duration:"Durasi Pekerjaan",work_location:"Lokasi Kerja",execution_method:"Cara Pelaksanaan",technical_specification:"Spesifikasi Teknis / Part Number / Serial Number / Drawing",brand:"Merek",material_description:"Deskripsi Material",estimated_quantity:"Estimasi Kuantitas",contract_scheme:"Skema Kontrak",payment_scheme:"Skema Pembayaran",after_sales_warranty:"Garansi Purnajual",training:"Training",delivery_place:"Tempat Penyerahan",commissioning:"Commissioning / Uji Coba",provider_responsibility:"Tanggung Jawab Penyedia",company_responsibility:"Tanggung Jawab Perusahaan",sanctions:"Sanksi",performance_index:"Indeks Performa",others:"Lain-lain",work_output:"Output Pekerjaan",tools_requirement:"Kebutuhan Alat",qualification_certification:"Kualifikasi SDM",work_warranty:"Garansi Pekerjaan",risk_classification:"Klasifikasi Risiko",reporting_supervision:"Pelaporan dan Pengawasan",work_scope:"Lingkup Pekerjaan",methodology:"Metodologi"};
  const section=(title,value)=>value?'<section><h2>'+esc(title)+'</h2><p>'+esc(value)+'</p></section>':'';
  const detailHtml=Object.entries(details).filter(([key,value])=>labels[key]&&String(value||"").trim()).map(([key,value])=>'<section><h3>'+esc(labels[key])+'</h3><p>'+esc(value)+'</p></section>').join("");
  const html='<!doctype html><html lang="id"><head><meta charset="utf-8"><title>KAK '+esc(row.kak_no)+'</title><style>*{box-sizing:border-box}body{margin:0;background:#e9edf2;color:#202b3b;font:11pt Arial}.toolbar{position:sticky;top:0;background:#152943;color:white;padding:12px 24px;display:flex;justify-content:space-between}.toolbar button{padding:9px 16px;cursor:pointer}.page{width:210mm;min-height:297mm;margin:16px auto;background:white;padding:22mm 24mm;position:relative}.cover{text-align:center;padding-top:22mm;page-break-after:always}.content{min-height:297mm;height:auto;page-break-after:auto}.cover h1{font-size:19pt;margin-bottom:12mm}.job{font-size:16pt;font-weight:bold;text-transform:uppercase}.logo-space{height:95mm}.company{font-size:15pt;font-weight:bold}.sign{width:100%;border-collapse:collapse;margin-top:20mm}.sign th,.sign td{border:1px solid #333;padding:8px;text-align:center}.sign .space td{height:30mm}.content h1{text-align:center;font-size:16pt;margin-bottom:15mm}section{margin-bottom:7mm;break-inside:avoid}h2{font-size:12pt;margin:0 0 3mm}h3{font-size:11pt;margin:0 0 2mm}p{margin:0;white-space:pre-wrap;text-align:justify;line-height:1.45}.page-no{position:absolute;bottom:12mm;left:0;right:0;text-align:center}.content .page-no{position:static;margin-top:16mm;text-align:center}.meta-grid{width:100%;border-collapse:collapse;margin:0 0 10mm}.meta-grid th,.meta-grid td{border:1px solid #777;padding:7px 9px;text-align:left;vertical-align:top}.meta-grid th{width:28%;background:#f1f3f5}@page{size:A4;margin:0}@media print{body{background:white}.toolbar{display:none}.page{margin:0}.content{break-before:page}.content .page-no{display:none}}@media screen{.page{max-width:100%}}</style></head><body><div class="toolbar"><b>Preview KAK — '+esc(row.kak_no)+'</b><button onclick="window.print()">Cetak / Simpan PDF</button></div><article class="page cover"><h1>KERANGKA ACUAN KERJA</h1><div class="job">'+esc(row.title)+'</div><p>No. '+esc(row.kak_no)+'</p><div class="logo-space"></div><div class="company">PT BORNEO ALUMINA INDONESIA</div><p>'+esc([meta.division,row.department].filter(Boolean).join(" & "))+'</p><table class="sign"><tr><th>Dibuat</th><th>Diperiksa</th><th>Disetujui</th></tr><tr class="space"><td></td><td></td><td></td></tr><tr><td>'+esc(details.created_by||row.requester||"")+'<br>Jabatan</td><td>'+esc(details.checked_by||"")+'<br>Jabatan</td><td>'+esc(details.approved_by||"")+'<br>Jabatan</td></tr></table><div class="page-no">1</div></article><article class="page content"><h1>KONTEN KERANGKA ACUAN KERJA</h1>'+section("1. Pendahuluan",row.scope)+section("2. Latar Belakang",row.background)+section("3. Maksud dan Tujuan",row.objective)+'<section><h2>4. Informasi Pelaksanaan</h2><table class="meta-grid"><tr><th>Lokasi Pekerjaan</th><td>'+esc(row.location||details.work_location||"—")+'</td></tr><tr><th>Durasi</th><td>'+esc(row.duration||details.contract_duration||details.work_duration||"—")+'</td></tr><tr><th>Jadwal Pelaksanaan</th><td>'+esc(row.schedule||"—")+'</td></tr><tr><th>Pagu Anggaran</th><td>'+esc(row.budget?money(row.budget):"—")+'</td></tr></table></section>'+section("5. Metode Tender",meta.tender_method)+section("6. Metode Kontrak",meta.contract_winner)+section("7. Metode Evaluasi",row.evaluation_method)+'<section><h2>8. Persyaratan Administrasi, Teknis, dan Komersial</h2>'+section("Administrasi",details.admin)+section("Teknis",details.technical)+section("Komersial",details.commercial)+'</section><section><h2>9. Ruang Lingkup Pekerjaan — '+esc(meta.type||"")+'</h2>'+detailHtml+'</section><div class="page-no">2</div></article></body></html>';
  const win=window.open("","_blank");if(!win){toast("Izinkan pop-up untuk membuka preview KAK.");return}win.document.open();win.document.write(html);win.document.close();
}

function cellValue(key,value){
  if(value===null||value===undefined||value==="")return "—";
  if(["budget","estimated_value","contract_value","value_delta"].includes(key))return esc(money(value));
  if(key==="status")return '<span class="status '+esc(value)+'">'+esc(value)+'</span>';
  if(key==="created_at")return esc(new Date(value+"Z").toLocaleDateString("id-ID"));
  return esc(value);
}
async function openDialog(config){
  state.dialogResource=config;$("#dialog-title").textContent="Tambah "+config.title;$("#form-fields").innerHTML="";
  for(const [name,label,type,required,options] of config.fields){
    const wrap=document.createElement("label");wrap.className="field"+(type==="textarea"?" full":"");wrap.textContent=label+(required?" *":"");
    let input;
    if(config.endpoint==="contract_drafts" && ["kak_id","vendor_id"].includes(name)){
      input=document.createElement("select");input.innerHTML='<option value="">-- Pilih '+(name==="kak_id"?"KAK":"Vendor")+' --</option>';
      try{
        const list=await api(name==="kak_id"?"kak?limit=500":"vendors?limit=500");
        for(const row of list.data||[]){const option=document.createElement("option");option.value=row.id;option.textContent=name==="kak_id"?(row.kak_no+" — "+row.title):row.name;input.append(option)}
      }catch(error){const option=document.createElement("option");option.value="";option.textContent="Data referensi gagal dimuat";input.append(option)}
      input.dataset.reference=name;
    }else if(type==="select"){input=document.createElement("select");input.innerHTML='<option value="">Pilih opsi</option>'+options.map(o=>'<option>'+esc(o)+'</option>').join("")}
    else if(type==="textarea"){input=document.createElement("textarea");if(name==="special_terms")input.placeholder='Detail teknis tambahan'}
    else{input=document.createElement("input");input.type=type}
    input.name=name;input.required=!!required;wrap.append(input);$("#form-fields").append(wrap);
  }
  if(config.endpoint==="contract_drafts"){
    const kakSelect=$('#form-fields [name="kak_id"]');
    kakSelect?.addEventListener("change",async()=>{
      const id=kakSelect.value;if(!id)return;
      try{
        const result=await api("kak?limit=500"),kak=(result.data||[]).find(x=>String(x.id)===String(id));if(!kak)return;
        const set=(name,value)=>{const el=$('#form-fields [name="'+name+'"]');if(el&&!el.value)el.value=value??""};
        set("title",kak.title);
        let detailText="";
        try{
          const meta=JSON.parse(kak.special_terms||"{}"),details=meta.details||{};
          detailText=Object.entries(details)
            .filter(([key,value])=>!["division","created_by","checked_by","approved_by","tender_method","contract_winner","admin","technical","commercial"].includes(key)&&String(value||"").trim())
            .map(([key,value])=>key.replaceAll("_"," ").toUpperCase()+"\n"+value).join("\n\n");
        }catch(error){console.warn("Metadata KAK tidak dapat dibaca",error)}
        const scopeText=[kak.scope,detailText].filter(Boolean).join("\n\n");
        set("scope",scopeText);set("payment_terms",kak.payment_terms);
        const value=$('#form-fields [name="contract_value"]');if(value&&!value.value)value.value=kak.budget||0;
      }catch(error){toast("Data KAK tidak dapat dimuat: "+error.message)}
    });
  }
  $("#record-dialog").showModal();
}
async function saveRecord(event){
  event.preventDefault();const config=state.dialogResource;const data=Object.fromEntries(new FormData(event.currentTarget).entries());
  if(config.endpoint==="kak"){
    const extraKeys=["division","procurement_type","tender_method","contract_winner","admin","technical","commercial","created_by","checked_by","approved_by","contract_type","contract_duration","delivery_duration","work_duration","work_location","execution_method","technical_specification","brand","material_description","estimated_quantity","contract_scheme","payment_scheme","after_sales_warranty","training","delivery_place","commissioning","provider_responsibility","company_responsibility","sanctions","performance_index","others","work_output","tools_requirement","qualification_certification","work_warranty","risk_classification","reporting_supervision","work_scope","methodology"];
    const details={};for(const key of extraKeys){details[key]=data[key]??"";delete data[key]}
    data.requester=details.created_by;data.payment_terms=details.payment_scheme||"";data.requirements=[details.admin,details.technical,details.commercial].filter(Boolean).join("\n\n");
    data.special_terms=JSON.stringify({type:details.procurement_type,division:details.division,tender_method:details.tender_method,contract_winner:details.contract_winner,checked_by:details.checked_by,approved_by:details.approved_by,details});
  }
  for(const [key,value] of Object.entries(data)){if(["budget","estimated_value","contract_value","vendor_id","kak_id","contract_id","ref_id","value_delta","score","quality_score","delivery_score","compliance_score"].includes(key))data[key]=value===""?null:Number(value)}
  try{await api(config.endpoint,{method:"POST",body:JSON.stringify(data)});$("#record-dialog").close();toast("Data berhasil disimpan.");await renderResource(config)}
  catch(e){toast(e.message)}
}
$("#login-form").addEventListener("submit",async e=>{e.preventDefault();$("#login-error").textContent="";const form=Object.fromEntries(new FormData(e.currentTarget).entries());try{const r=await api("auth/login",{method:"POST",body:JSON.stringify(form)});state.user=r.user;showApp()}catch(err){$("#login-error").textContent=err.message}});
$("#logout").addEventListener("click",async()=>{await api("auth/logout",{method:"POST",body:"{}"});state.user=null;$("#app-shell").classList.add("hidden");$("#login-screen").classList.remove("hidden")});
$("#navigation").addEventListener("click",e=>{const button=e.target.closest("[data-page]");if(button)renderPage(button.dataset.page)});
$("#record-form").addEventListener("submit",saveRecord);
$("#page-content").addEventListener("click",e=>{const button=e.target.closest("[data-kak-preview]");if(button)openKakPreview(button.dataset.kakPreview)});
$("#dialog-close").addEventListener("click",()=>$("#record-dialog").close());
$("#dialog-cancel").addEventListener("click",()=>$("#record-dialog").close());
boot();
