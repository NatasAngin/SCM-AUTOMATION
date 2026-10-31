const $ = (s, root=document) => root.querySelector(s);
const state = { user:null, page:"dashboard", rows:[], dialogResource:null, notifications:[], notificationOpen:false, notificationTimer:null,kakWorkflows:{},kakEditId:null };
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
async function loadNotifications(){
  try{
    const result=await api("notifications");
    state.notifications=result.data||[];
    const badge=$("#notification-count");
    const unread=Number(result.unread||0);
    badge.textContent=unread>99?"99+":String(unread);
    badge.hidden=unread===0;
    renderNotificationPanel();
  }catch(error){console.warn("Notifikasi tidak dapat dimuat:",error.message)}
}
function renderNotificationPanel(){
  const panel=$("#notification-panel");
  if(!panel)return;
  panel.classList.toggle("open",state.notificationOpen);
  const unread=state.notifications.filter(item=>!item.is_read).length;
  panel.innerHTML='<div class="notification-head"><strong>Notifikasi</strong><button type="button" data-notification-read-all '+(unread?'':'disabled')+'>Tandai semua dibaca</button></div>'+
    (state.notifications.length?'<div class="notification-list">'+state.notifications.map(item=>'<button type="button" class="notification-item '+(item.is_read?'read':'unread')+'" data-notification-id="'+Number(item.id)+'"><span class="notification-dot"></span><span><strong>'+esc(item.title)+'</strong><small>'+esc(item.message)+'</small><time>'+esc(new Date(item.created_at+"Z").toLocaleString("id-ID"))+'</time></span></button>').join("")+'</div>':'<p class="notification-empty">Belum ada notifikasi.</p>');
}
async function markNotificationRead(id){
  try{await api("notifications/"+id+"/read",{method:"POST",body:"{}"});await loadNotifications()}
  catch(error){toast(error.message)}
}
function showApp(){
  $("#login-screen").classList.add("hidden");$("#app-shell").classList.remove("hidden");
  const userNav=$('[data-page="users"]');if(userNav)userNav.style.display=state.user.role==="Admin"?"flex":"none";
  $("#user-name").textContent=state.user.full_name;$("#user-role").textContent=state.user.role;$("#user-avatar").textContent=(state.user.full_name||"A").slice(0,1).toUpperCase();
  renderPage("dashboard");
  loadNotifications();
  if(state.notificationTimer)clearInterval(state.notificationTimer);
  state.notificationTimer=setInterval(loadNotifications,30000);
}
async function renderPage(page){
  state.page=page;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const config=resources[page];$("#page-title").textContent=page==="dashboard"?"Dashboard":page==="users"?"User Management":(config?.title||"");
  $("#page-content").innerHTML='<div class="loading">Memuat data...</div>';
  if(page==="dashboard"){await renderDashboard();return}
  if(["contract_monitoring","reports","autopilot","ai_settings","settings","users","help"].includes(page)){await renderVirtualPage(page,config);return}
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
      const docs=await api("ai/documents");
      const documents=docs.data||[];
      const options=documents.map(d=>'<option value="'+esc(d.resource+":"+d.id)+'">'+esc((d.document_no||("ID "+d.id))+" — "+(d.title||"Tanpa judul")+" ["+d.document_type+" • "+(d.status||"Tanpa status")+"]")+'</option>').join("");
      $( "#page-content" ).innerHTML=`<div class="page-heading"><div><p class="eyebrow">AI PROCUREMENT GOVERNANCE</p><h1>AI Copilot & Document Review</h1><p>AI mendeteksi dokumen KAK, draft kontrak, dan kontrak tersimpan tanpa membatasi status proses.</p></div></div>
      <div class="panel"><div class="panel-head"><div><h3>Review Dokumen dengan AI</h3><p>Pilih dokumen dari daftar otomatis. Status Draft, Diajukan, Dalam Review, Revisi, Disetujui, maupun status lainnya tetap dapat diperiksa.</p></div><span class="status">Human-in-the-loop</span></div>
      <label class="field">Cari / Pilih Dokumen<select id="ai-review-document"><option value="">— Pilih dokumen —</option>${options}</select></label>
      <label class="field">Fokus / Instruksi Review<textarea id="ai-review-instruction" rows="3" placeholder="Contoh: periksa kelengkapan, spesifikasi, metode evaluasi, pembayaran, risiko dan tahapan yang belum dilakukan."></textarea></label>
      <button class="primary" id="run-ai-review" ${documents.length?"":"disabled"}>✧ Jalankan Review AI</button><p class="hint">Dokumen terdeteksi: ${documents.length}. AI hanya membaca dan memberi rekomendasi; tidak mengubah dokumen atau mengambil keputusan pengadaan.</p></div>
      <div class="panel"><div class="panel-head"><div><h3>Hasil Review</h3><p>Temuan, tingkat risiko, checklist proses, dan rekomendasi tindakan.</p></div></div><div id="ai-review-result" class="ai-review-result muted">Pilih dokumen lalu jalankan review.</div></div>
      <div class="panel"><h3>Ruang Lingkup AI</h3><ol class="workflow"><li>Review kelengkapan dan konsistensi KAK/TOR.</li><li>Review draft dan kontrak: ruang lingkup, nilai, masa berlaku, pembayaran, jaminan, sanksi, dan risiko.</li><li>Mendeteksi data atau bukti yang belum tersedia.</li><li>Menyusun checklist tahapan sourcing, evaluasi, approval, kontrak, dan kewajiban.</li><li>Memberikan rekomendasi tindak lanjut tanpa mengambil keputusan pejabat.</li></ol></div>`;
      $( "#run-ai-review" ).addEventListener("click",async()=>{const btn=$( "#run-ai-review" ),out=$( "#ai-review-result" ),selected=$( "#ai-review-document" ).value;if(!selected){toast("Pilih dokumen terlebih dahulu.");return}const [resource,id]=selected.split(":");btn.disabled=true;btn.textContent="Sedang menganalisis...";out.textContent="AI sedang membaca dokumen dan menyusun checklist review...";try{const result=await api("ai/review",{method:"POST",body:JSON.stringify({resource,id:Number(id),instruction:$( "#ai-review-instruction" ).value})});out.classList.remove("muted");out.textContent=typeof result.result==="string"?result.result:JSON.stringify(result.result,null,2)}catch(e){out.textContent=e.message;out.classList.add("muted")}finally{btn.disabled=false;btn.textContent="✧ Jalankan Review AI"}});
      return;
    }
    if(page==="users"){
      if(state.user.role!=="Admin"){ $("#page-content").innerHTML='<div class="panel empty">Akses User Management hanya untuk Administrator.</div>';return; }
      const result=await api("users");
      const users=result.data||[];
      const roles=["Admin","Section Head","System & Helpdesk Specialist","Network & Equipment Specialist","Viewer"];
      $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">SYSTEM ADMINISTRATION</p><h1>Manajemen Pengguna</h1><p>Buat akun, tetapkan role, dan reset password pengguna.</p></div><button class="primary" id="create-user">＋ Tambah User</button></div>
      <div class="panel"><div class="panel-head"><div><h3>Daftar Pengguna</h3><p>${users.length} akun terdaftar</p></div></div><div class="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${users.map(u=>`<tr><td>${esc(u.full_name)}</td><td>${esc(u.username)}</td><td>${esc(u.role)}</td><td><span class="status ${u.is_active?"Active":"Inactive"}">${u.is_active?"Aktif":"Nonaktif"}</span></td><td><button class="action-button" data-reset-user="${Number(u.id)}" data-user-name="${esc(u.full_name)}">Reset Password</button></td></tr>`).join("")}</tbody></table></div></div>
      <div class="panel user-security-note"><p><strong>Keamanan:</strong> Password minimal 12 karakter. Password tidak ditampilkan kembali setelah disimpan. Reset password tidak otomatis mengakhiri sesi login yang sedang aktif.</p></div>`;
      $("#create-user").addEventListener("click",()=>openUserDialog(roles));
      $("#page-content").querySelectorAll("[data-reset-user]").forEach(btn=>btn.addEventListener("click",()=>resetUserPassword(btn.dataset.resetUser,btn.dataset.userName)));
      return;
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
    if(config.endpoint==="kak"){
    const editingId=state.kakEditId;
      const pairs=await Promise.all(state.rows.map(async row=>{try{return [row.id,await api("kak/"+row.id+"/workflow")]}catch(e){return [row.id,{workflow:{workflow_status:row.status==="Approved"?"Final":"Draft"}}]}}));
      state.kakWorkflows=Object.fromEntries(pairs);
    }
    $("#page-content").innerHTML=`<div class="page-heading"><div><p class="eyebrow">SCM WORKSPACE</p><h1>${config.title}</h1><p>${config.description}</p></div><button class="primary" id="add-record">＋ Tambah Data</button></div><div class="panel"><div class="panel-head"><div><h3>Register ${config.title}</h3><p>${state.rows.length} data tercatat</p></div></div><div class="table-wrap" id="resource-table">${tableHtml(state.rows,config.columns)}</div></div>`;
    $("#add-record").addEventListener("click",()=>{state.kakEditId=null;openDialog(config)});
  }catch(e){$("#page-content").innerHTML='<div class="panel empty">'+esc(e.message)+'</div>'}
}
function tableHtml(rows,columns){
  if(!rows?.length)return '<div class="empty">Belum ada data. Gunakan tombol Tambah Data untuk membuat entri pertama.</div>';
  return `<table><thead><tr>${columns.map(c=>'<th>'+esc(c.replaceAll("_"," ").toUpperCase())+'</th>').join("")}${state.page==="kak"?"<th>WORKFLOW</th><th>AKSI</th>":""}</tr></thead><tbody>${rows.map(row=>{
    if(state.page!=="kak")return '<tr>'+columns.map(c=>'<td>'+cellValue(c,row[c])+'</td>').join("")+'</tr>';
    const wf=state.kakWorkflows[row.id]?.workflow||{workflow_status:"Draft"},status=wf.workflow_status||"Draft",role=state.user?.role;
    let actions='<button type="button" class="action-button" data-kak-preview="'+Number(row.id)+'">Preview / Cetak PDF</button>';
    if((status==="Draft"&&(role==="Admin"||row.requester===state.user?.full_name))||(status==="Revision"&&role==="Admin"))actions+=' <button type="button" class="action-button" data-kak-edit="'+Number(row.id)+'">Edit</button>';
    if(["Draft","Revision"].includes(status))actions+=' <button type="button" class="action-button" data-kak-submit="'+Number(row.id)+'">Ajukan</button>';
    if(status==="Review"&&role==="Section Head")actions+=' <button type="button" class="action-button" data-kak-review="Approved" data-id="'+Number(row.id)+'">Setujui Review</button> <button type="button" class="action-button" data-kak-review="Revision" data-id="'+Number(row.id)+'">Kembalikan Revisi</button>';
    return '<tr>'+columns.map(c=>'<td>'+(c==="status"?'<span class="status">'+esc(status)+'</span>':cellValue(c,row[c]))+'</td>').join("")+'<td><span class="status">'+esc(wf.current_step||status)+'</span></td><td>'+actions+'</td></tr>';
  }).join("")}</tbody></table>`;
}
async function kakWorkflowAction(id,action,extra={}){
  const note=window.prompt(action==="review"?"Catatan pemeriksaan (wajib jika revisi):":"Catatan (opsional):", "");
  if(note===null)return;
  if(action==="review"&&extra.decision==="Revision"&&!note.trim()){toast("Catatan revisi wajib diisi.");return}
  try{const result=await api("kak/"+id+"/workflow",{method:"POST",body:JSON.stringify({action,note,...extra})});toast(result.message||"Workflow diperbarui.");await renderResource(resources.kak);await loadNotifications();await renderDashboardIfVisible()}
  catch(e){toast(e.message)}
}
async function renderDashboardIfVisible(){if(state.page==="dashboard")await renderDashboard()}
async function editKak(id){
  const row=state.rows.find(x=>Number(x.id)===Number(id));if(!row)return;
  const status=state.kakWorkflows[id]?.workflow?.workflow_status||"Draft";
  if(status==="Revision"&&state.user?.role!=="Admin"){toast("Revisi hanya dapat diedit Admin.");return}
  if(status==="Draft"&&state.user?.role!=="Admin"&&row.requester!==state.user?.full_name){toast("Draft hanya dapat diedit pembuat dokumen atau Admin.");return}
  const cfg=resources.kak;state.kakEditId=id;await openDialog(cfg);
  const meta=(()=>{try{return JSON.parse(row.special_terms||"{}")}catch{return {}}})();
  const details=meta.details||{};
  const values={...row,division:meta.division||"",procurement_type:meta.type||"",tender_method:meta.tender_method||"",contract_winner:meta.contract_winner||"",created_by:row.requester||"",...details};
  for(const [key,value] of Object.entries(values)){const el=$('#form-fields [name="'+key+'"]');if(el)el.value=value??""}
  $("#dialog-title").textContent="Edit KAK — "+row.kak_no;
}

function openKakPreview(id){
  const row=state.rows.find(item=>Number(item.id)===Number(id));
  if(!row){toast("Data KAK tidak ditemukan.");return}
  let meta={};try{meta=JSON.parse(row.special_terms||"{}")}catch(error){toast("Metadata KAK tidak valid.");return}
  const details=meta.details||{};
  const labels={contract_type:"Jenis Kontrak",contract_duration:"Durasi Kontrak",delivery_duration:"Durasi Pengiriman",work_duration:"Durasi Pekerjaan",work_location:"Lokasi Kerja",execution_method:"Cara Pelaksanaan",technical_specification:"Spesifikasi Teknis / Part Number / Serial Number / Drawing",brand:"Merek",material_description:"Deskripsi Material",estimated_quantity:"Estimasi Kuantitas",contract_scheme:"Skema Kontrak",payment_scheme:"Skema Pembayaran",after_sales_warranty:"Garansi Purnajual",training:"Training",delivery_place:"Tempat Penyerahan",commissioning:"Commissioning / Uji Coba",provider_responsibility:"Tanggung Jawab Penyedia",company_responsibility:"Tanggung Jawab Perusahaan",sanctions:"Sanksi",performance_index:"Indeks Performa",others:"Lain-lain",work_output:"Output Pekerjaan",tools_requirement:"Kebutuhan Alat",qualification_certification:"Kualifikasi SDM",work_warranty:"Garansi Pekerjaan",risk_classification:"Klasifikasi Risiko",reporting_supervision:"Pelaporan dan Pengawasan",work_scope:"Lingkup Pekerjaan",methodology:"Metodologi"};
  const section=(title,value)=>value?'<section><h2>'+esc(title)+'</h2><p>'+esc(value)+'</p></section>':'';
  const detailHtml=Object.entries(details).filter(([key,value])=>labels[key]&&String(value||"").trim()).map(([key,value])=>'<section><h3>'+esc(labels[key])+'</h3><p>'+esc(value)+'</p></section>').join("");
  const html='<!doctype html><html lang="id"><head><meta charset="utf-8"><title>KAK '+esc(row.kak_no)+'</title><style>*{box-sizing:border-box}body{margin:0;background:#e9edf2;color:#202b3b;font:11pt Arial}.toolbar{position:sticky;top:0;background:#152943;color:white;padding:12px 24px;display:flex;justify-content:space-between}.toolbar button{padding:9px 16px;cursor:pointer}.page{width:210mm;min-height:297mm;margin:16px auto;background:white;padding:22mm 24mm;position:relative}.cover{text-align:center;padding-top:22mm;page-break-after:always;overflow:hidden}.content{min-height:297mm;height:auto;page-break-after:auto}.cover h1{font-size:19pt;margin-bottom:12mm}.job{font-size:16pt;font-weight:bold;text-transform:uppercase}.cover-logo{display:block;width:98mm;height:auto;max-height:72mm;object-fit:contain;margin:28mm auto 28mm;position:relative;z-index:2}.cover-watermark{position:absolute;width:220mm;height:auto;left:-4mm;top:77mm;opacity:.16;filter:grayscale(1);transform:rotate(-43deg);z-index:0;pointer-events:none}.company{font-size:15pt;font-weight:bold;position:relative;z-index:2}.sign{width:100%;border-collapse:collapse;margin-top:20mm}.sign th,.sign td{border:1px solid #333;padding:8px;text-align:center}.sign .space td{height:30mm}.content h1{text-align:center;font-size:16pt;margin-bottom:15mm}section{margin-bottom:7mm;break-inside:avoid}h2{font-size:12pt;margin:0 0 3mm}h3{font-size:11pt;margin:0 0 2mm}p{margin:0;white-space:pre-wrap;text-align:justify;line-height:1.45}.cover p{text-align:center}.page-no{position:absolute;bottom:12mm;left:0;right:0;text-align:center}.content .page-no{position:static;margin-top:16mm;text-align:center}.meta-grid{width:100%;border-collapse:collapse;margin:0 0 10mm}.meta-grid th,.meta-grid td{border:1px solid #777;padding:7px 9px;text-align:left;vertical-align:top}.meta-grid th{width:28%;background:#f1f3f5}@page{size:A4;margin:0}@media print{body{background:white}.toolbar{display:none}.page{margin:0}.content{break-before:page}.content .page-no{display:none}}@media screen{.page{max-width:100%}}</style></head><body><div class="toolbar"><b>Preview KAK — '+esc(row.kak_no)+'</b><button onclick="window.print()">Cetak / Simpan PDF</button></div><article class="page cover"><h1>KERANGKA ACUAN KERJA</h1><div class="job">'+esc(row.title)+'</div><p>No. '+esc(row.kak_no)+'</p><img class="cover-watermark" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAACuCAMAAAClZfCTAAABIFBMVEX/////ZgAAZjPnnCb/YgD/kFX/7+b/diD+k1b/YAD/9fD/bgD/bRv/9u38gT0AZDD/eTb3ezEAYCgAXyb/6Nn/XADnmh3/jUjw9vPss2UAZS0AWx3++vbmmRf/dAb/iEzmlwDb6eLz+PbM2tF6p479zrToozH78+XppDra5+C+0seEr5hMhmMkdUkXcUKau6llnH45gFlbkXGrxrf9yan938z9mmf8p3r8upjqrVfvxIftvHL35s/z06j02rX56tUsf1SSuaSxz79soYVNh2Te4+EAVQiEp5Lsw7D/pXH8tIv9roL9zLD+vp/8llz918Tqro/q2tHqj17q1sjtnXL+cyniyqTpv4Hn1LjtuqHox7XxzZnkrFfstmvpqUv/fSKEol/qAAAT80lEQVR4nN2d+0PiOhbHeVSYisjwlIGiPJWHoKCAgMCg7J0Zn7t3r9e965X5//+LTSkobU7SpE2R2e8v40Bp0g8nJzknD1wuWN09o7a2CZd+sPLJXK5SqRQKheqb0H8qlVwumXey4C1ZMmgn6GR53ErmqleTWvG0ddxs1hseTyoViUSimiKplMfTqNebx63T4uSkmnME1ZbkNmgzECVzhepJsfXVE02n0whGJBLS5DFIe3WODV3YaBZPqoWk0KpsHKJ8PledXE+bdU8KkcGR0IVgRUONZqt4Jc6iNgkRgnNWnDai6ejcZvjgGDil0/XTk6oQc9oQRMlktdZqNkIRbrshg4pEPPXWmX1r2gBEycJJselJ87cqc0qhSNozPSnYq9/HIkLdFaKTEmg7OCZ08+bEji19IKLkVQ05HgfpvGOKek6vLNfzgxDlqrW6OrBxHs8CUiTdqOWs1fUjEFUmrTrqm9dE541StF60BGndiJDzaaTXZz16SJH0aYW/ymtFlDtB5vMxeBaKNIrcY6X1ISqcNKNp0XxCb/FHZBm6RaLzv+FwRfXcJ5y923oQ5Su1pkckHpUKimK1ILY5bbVOr6+LNU3F4vVpqzWdR72pCNZlhiJNvoHSOhAVJs1oVEjfPieDgouUGoZNzqrVQoWcCUnmKoXq2eS6OQ9pVsqPpIo8huQ0ImH2g+KuiKfRnJ7WTqqVPFdbyScLKDCup9ANFoo2q+wfdxZR8qSVstu7a0Fp9GtrclaoWI9L85XqZPrmDCOpE+ZPOogoWZ2GbHbviE6qfnw9ubI46jMqj+Kd1LxKoXSL1RIdQ4QamJ3+XXU66cjX07NCTmyCLFm49sxbXGTKeGNnEOXOvqatNzDV7TRaxbOCUynpq9NURB0jsY0jnUBUqdWt2o/aZXkarUnBmTT0UvnCKSonVGdiJBxR8mxq0YC07M63MwsxggUVrtEQs8EyQhKMKKd6IEt8oqnGcdGhOQxYhWPE6B/m1wlFVCh6LBiQaj2pZk1Ur0WSz2d8sPwkFW2aMxKHKH81DfG7IOSaG83rK2cnC12u2G14Z+dp99wwjVo4TjdNPysKUf7kOM3bwkKhaDrVOhM87QXpwi1LkluS4uG2/o1k67dvZh8WgyhXa3C3MGQ+01p1Lb6nIy+fUnJ/N7w3+e3M5NMiECVrdU5AyPukpyeVNfnmv+LvTyftxAzvFlMmVmwfUeWas5MPRVLN4tX6uq5YYPUZ5Qfj+9+m9M/bRVQpNnhckDo0rBfX4H1WdCHrnk/yGd7PN+lNzR6iQpEnj4jcc2o6sTnxx6+w/hHj98YLkk3qV2YHUY7LgtCQsjlZl/tZ1b7+EeUudsVZjfZ564hyNfZUELKfqO2JY6syIvqBX3JKMyOriJIcoWoo+kH2o+mnAdENfklhQvm8RUQn9TQjINS/12uOpTVY1NG76/gjcA1tEtIKovzZV9YmForUrznSxI7oUfd4UlgBrilQOjULiAotRkAovvh64nBwyiDlYdWM5L+ga5IUh82NqHLKGIuFoqiB2Xo2Udp+en9I+Q/4mhrZFfAimtSZAKEA/uvZxxvQQrFwXHtMKd6FmhkSpbvlQ3TG5qVD0UZxMwxoIeUmLMXjcfdDiXRFldyn8SCqnKZYAEVC9cnGGNBS2+3z+1KMYEIuNdIkvsWOKHmSWq59pixnRTFGaz0ZDrFKTomVZkZUaKajKXWVgaqGmu4Bho5qH7+e7Lxo5ZtEw2dEVLn2tL6dqasMckl1L4a6nuD0a0q3mEodJG5AH29NefKkGhuifBWMH5LV2rS+XEwQ8UzXmAQSrWSE2L/YzRflK/N5M2RB01/RBb0pl3YMkark5Lhx/au2sIUKziJCkH5NH72iK6cROSQl6PPFkHxB8oDGVDFMxsysqslvAhD52ucXt90fSN3bi7u2w3sflfb5bWfr4PPTk9//9Hn34KF78wg9mql8Yb9BO1iCH+nUnhUp7dLtXgAN4OPyQuhPaX/rpmSccBEjX+lmN6AWtrrZUi1zv3Pf5rUnn9+4bVP+hF+VrNtAtN3uHuxI6mSmQags6enghjKot6Ttu4fPbhkrTStSlnd2b/koIUTGuwCICtGoVUTtm59xQn01THF590KgLbW7+7Ty5pjie/cc7pINUc0iou3SHun71NV55+FRiCkpj7sM5akl+rvMXwsbombIYwXR3W6cob6qZJmcZWBX6YCFzwJSoMvovJkQVUOUFWskRErJz1zheZ33oKw5hx53ecpDX4v7lgkSE6JiJESebiQgim3h/tmsyl0bAyql6+YsD5X4xPKtsCBKohC8RbwDiEi5lWXjyyyQ7q26pJI7bn5/TFJ8y9yQWBAVo55IkQeREjuwAEgtW+pYGt25LJiQJjlsakgMiHL1kCdKXs0PILpwWyOkVjlgwSO1d62Y0OJx48DcKi+iWtTjSZOjTByRLUmBC15Cjzu2qiB36C7QHFEyFfKEPOQ7CEbkdhOnYQi6t9rIlpJ3qa3bHNG1upKf7K3FI3LLWzyMLuwSQgV+po0jTRFVkQnRXJEDiNzxT+xZgBvLbm9Fkv9fNhB9RYRCtGX8DiByy3usKdp/iildCpMZmSGaRNWZiWNKjZ1A5JZ/ZyP0XVThUpg4NjZBVFGbmSdKW6bmCCJGRt9ZbqVmeBgKPCA1bjqifGM+yRWlZd7ZEUmSvCKTekv/NCf0rwD1HvPipEBgfz/gnv9JLZD4pdARfYvO57eOafVkRITq+9S5OX+M+ZBipfPbjp9e6bhxlTym7V3K51F5/s7FXUwb8yi+9vntVoCaeJAJXwoV0VlUmwKkripmQiS7P9+2fbq+XPE9dp8kcn8k+c0yOr9TMnWIz6PPMHZQfHf09FUbLIaGqKI1s1Cdc1ExAKgLhxXKY4ccq8i7dELfiVGHFD+4J3iW2I2faEpSGPwQBVGymZobUZQcwjIhkty0DJ/vIUCCFKeGIr4nQsGSvHtHGXv6bnZIBQILqumIWtpUe8hDnwU0QSTFH2D7fVObmCsM0D75QHhQ2X1hMjiPdUmGJEMFkhEVl4sR6EZkgkj2Y7sBcJ0T4lApTP5MifSUWwxJ6VIY5isdAHSJiJKLRa1mRkRHJIeZsujtn7BfiRMT2soBXKzMFgP7COkTCVgNS0aUWhgRJYKdi4ZI/sEYkCod8GuVwqQY/B58RMnNOkmgdOEC3XiFzRCZGhENETMhlRH4zDKhmSqfoVIl9x1reS4XzAjoIswQmXkiGiLplr3CKGSHTR+GfA/7kn/zFAhGwNITZrcmiEJmexopiOQ/+FZUgSNB2IwUeFwNLqsn6w+IM16gCSJqAKuJhEg64KuwS/kE3EnahYZzJcji4gxRnV7QJIQUMF5FRxQ6Nt9gSUBE9rRE+aCoVIbG5SDMDm95Ll8YuA+2T4iOKM2wh4eACNyRZKIShBqYP4/tANf5LUwvPQLWiG3IoyKKnjIUAyOSwLG8maBeBtvzjW3n1Z7M0pqADl55jDUNUYi82HpFICKgY2CRD7rVOXYZ4KzlLSvluWLY4+PjVQqikEkzW3THIKI4/lxMugce/sHY7/sgZ20SCJJ0gd9LMtCmIDIbEvW1qkOIpH2Lc/NQ+B4w9mnn5o/FLAX6gvWVp8Ro9DSR67mn/QsiYohdYQHfKub4IQdi0YhAvybpCyQjIq9unOsy80X7A0Bk0RPN64Pzlg2D9CDuiiSuyUmdgN5R1gchZES0XdWonmUKIpl/iPKmH9i3ahyDtgN4gZatFso7yR0dcLaFfLj6mQQZkZUx0VJ3uIkYbBLIFGGneHAI92yGBK1FRJdZLxmR5Lex6jyIG74h+XiL2xkl9WaqbcCX6ohbQxScJSiIDIbKqT0cuX6ggkcf0PEL7MJdm74VWEP0kvHSENnwDNA6BoP7/IkXaGshKT6k14/qLCE6ynppiNy2aozHTYaJiX2swICtpe2499P3oZYQDTJ0RLZqHMNuJ+l3pWCIJPoSKjM9YgXqI1kriEYqIQoie5utgBrp5xxxRAe2CsRHRnoEVhAhX+0gInymXvqpu0A0IjzokfZ07/MjGqmeyEFE2PSPtK+7QDSiIDZVoDdbfkRKL+EoIgW7oSFXuvmIFkbkTRDD2F8M0bZwRJon8nqzf2r/XwMiZxuacERad+b1Zp4XL4hGFMR9kV93waYjUr5oRpR5Xb4ivNPHOxh9CLbpiMaaESXKR8tXAES2RnI+LNdhSCmKHjqKRjRYtLPx2yuiA5A2kL/RXSA6ABGMKFjWXPXw/SUgGWIxt68JX/NhCOTxSQt7YaxgRJqzfnPVqvA0IbwejlVAruPO7AKu9RVGCUY00Jz1qnvEE/LSro18kQLMgeiNRHBKTTCioGZE/1l9rY3PWcg2fAMedxtXFwOJWdmOvxaLaD6y1jUzVAJWYbfpRkGK8Iya0SgFp/cFI5q3s4x+FAKs9bHR0rbxxRrG+RSxk0SCEakpa29maHgV9w1u5iWHmICVQ9jkN7AuUrLRpwlFdDmPXo1fGOQboNNrmAQshMUcDbAUlG1mC5ZQREPkrbOXxld9wKrpuMUJZGCFkbSHLXuAFuBZNyOhiJArWqZAVoVP6xjTzcyCjAj3/cDiGasFugQjUofWmBG5XHfQWi9LfQy4mho3SGi9LP6bAawSiUjJAJ5IvQceNbklbMkLg2LAsBEaFoIL+SwvtRCJaJz1ZkfQG9D6O3zllLmgFaygdUBbZCyuUxOLCA0cy2Bm5hHynyw7N/WCljBK+5BxQMs4ibsSzSQS0TCT6cPvQItz3fH/8lX1L+AehJBYzNL0hUQieslAzloVvPMpwMXov+A9CDO75+DFEueXokkkon6mTPAv+NzX/E7ULXcGlcDd0qQxKJQPUAu0kqkSieg5OyC9BToHnp095/CedGI+8Q7eK2VlrCEWkTE8exfojRAjxpN2buCzUcjJOYI3srIkXiyiMektKEMxV/wTQ+4odkDaLE0eOLRhRG7Z+EuBphKK6JAyGQPvgFMTYqaN7f6JtBOY1mxI24elnRu+EZlQdz2jIFKArQLa/bBfgNSrRDz8kb4gEMgsLQv0G3+XkyqhiL7QqgxtA1rc0f2JePhn6YF4QpPkpocUlKMM5IMLdkhCx0WvpHfmIuzcVCXHwxf42beKev4sCZDbfCT4O+U0jXigw3oKMr7P1kYAQuzztaJoe60leWf3x3lse1uZa3s7dv6Dfh6s+VQTPBp7+7z0dNC9i/m2TaSIXDxzSbci4F4GSnE5EN7qdDoPW+GAbHaeMHSqgLFA+jFq8yOu3fv+sInwD1pGFIQyIav6N/08oUW1zc8uUq/7zJLbeCQMNfQlmkkgItffZiswvos4+21eiQDbfnKyy7ZVuo3E7BHxrWWVBdUxQDkhTycwPWC7eBvpfUKgvyL4oAreKnJMMlH6Uevl25gkejGv8rn9kyglrsUwAgrEKmAdkfJMfOtdJd5zro2Sn/iiLPGM7ExYv5Dj2He1CYcDMUo+4M3Tt4nHWlmUHURjhpaG7rllvcqS3OWfOonZKBCshK31RUxBtHJjtbHJlvKG6iHtIhubvVVqTGakHtJt5XuVJJZTvkA92mvdhnrYWg76t+nQSNP2Df/h+3LA8tH7qMCuldP+YdlDdPk3a51jHb6eRt6x8wMOaoHkvMpaEbleyflrox5346xfLAo4Lbax8cvbBLHyGGYu0ElEQe+f7PVvdwJMv38T5/j9m9W6XPYPs5nsl3fraz8wFegsItcQX2FElhLr7pgcESzJ0k8rv9ukjJ57CW15au+9RgwFOo/I9QyvfSCq1P0pxeFRgITeOLjlX66ljIevmWxmsafJm8i+rLgxpdQNy4QC14RIOcSWO5pou32z9aQer7zMzkjztJF75+nTfYx7pKhc9nuHb3gW+5pmuq8NFbg3L1AG80F2EUE/IafX2Jt95u6dt9uli+7D7s/9AJI/vNfpUn8RmiDlcjjwZg18NEN6NbT/oFZg2B/glx7RT+PbbvMlcf/JZGYcDmnlCdWs9TxhrPCPgJSj0WDmBfAsIHkHl/gMwrJATuluAuS7zWv7ZyaR6K/1dz2PRv1eAjKf1daWeeXzko7qz4w3Ux6uB1Jwbj0JOp6FJWXK/fGm/CSrempItsfptvmFuq5n1LhY8CxNKdF7wRvch2iEGj8alvQZYzZ+Bcej/gz17Bx4lqaUyfT6o/HRh5vTKDHfEHI4GIn/zo5GL4PZIT+dd0zZbOaVJf/nrMY97eyQrHcwEmVLytEl8ste9IAJy3hUO0r0ho6ZN4+U1+WG9ET51a4DUBTUsAa9MpfjAYVq0x9vhjdyqY0t8/bFZb1/v4wu+b+74PhyNOx/KWdsms6CT7bc3xBvvdD4S+a9emq/XO4NVFBB+tAQjeiCKpqX59deuaw6WNts5nwSZSc8o10NDzO6aiYSqjkczr4M+i/D4Wg0unwX+t9oOHzpD157s8P5dQLsZlluJnsozieKVbDvzQA1Tqh9LyKwymDxouFVIXy8sw1rX3pdvmbFPjEfHmQ/5ZfLDx8EmehykAAsaR18MonZYDP6d1MhSxLjcnnwZFBIZqEP/TAdvczWCAkNWGf90aa3LkzBUY+czhFIJ5PxllHr+uX4aBoPe0xZC6t05iNUFKJ+9HPaknL00jt0wnkj9IczFOcEN7hvZ9d49FwWEU0s2Ki2kymjUfvmRF4ipBwNB7Oy3UanRiaHs78H/y+2gwnF7i+vi/CUC9V8FI4+Vu71h5fjX6hXtygV1POXmZrloIdki/DEezjroQBvODr6/zQckpTg0TznMfjSm5UPcTyH5fKs9/r8MhxdjsdHv2qr+h9UAF+iMeG68QAAAABJRU5ErkJggg==" alt=""><img class="cover-logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAACuCAMAAAClZfCTAAABIFBMVEX/////ZgAAZjPnnCb/YgD/kFX/7+b/diD+k1b/YAD/9fD/bgD/bRv/9u38gT0AZDD/eTb3ezEAYCgAXyb/6Nn/XADnmh3/jUjw9vPss2UAZS0AWx3++vbmmRf/dAb/iEzmlwDb6eLz+PbM2tF6p479zrToozH78+XppDra5+C+0seEr5hMhmMkdUkXcUKau6llnH45gFlbkXGrxrf9yan938z9mmf8p3r8upjqrVfvxIftvHL35s/z06j02rX56tUsf1SSuaSxz79soYVNh2Te4+EAVQiEp5Lsw7D/pXH8tIv9roL9zLD+vp/8llz918Tqro/q2tHqj17q1sjtnXL+cyniyqTpv4Hn1LjtuqHox7XxzZnkrFfstmvpqUv/fSKEol/qAAAT80lEQVR4nN2d+0PiOhbHeVSYisjwlIGiPJWHoKCAgMCg7J0Zn7t3r9e965X5//+LTSkobU7SpE2R2e8v40Bp0g8nJzknD1wuWN09o7a2CZd+sPLJXK5SqRQKheqb0H8qlVwumXey4C1ZMmgn6GR53ErmqleTWvG0ddxs1hseTyoViUSimiKplMfTqNebx63T4uSkmnME1ZbkNmgzECVzhepJsfXVE02n0whGJBLS5DFIe3WODV3YaBZPqoWk0KpsHKJ8PledXE+bdU8KkcGR0IVgRUONZqt4Jc6iNgkRgnNWnDai6ejcZvjgGDil0/XTk6oQc9oQRMlktdZqNkIRbrshg4pEPPXWmX1r2gBEycJJselJ87cqc0qhSNozPSnYq9/HIkLdFaKTEmg7OCZ08+bEji19IKLkVQ05HgfpvGOKek6vLNfzgxDlqrW6OrBxHs8CUiTdqOWs1fUjEFUmrTrqm9dE541StF60BGndiJDzaaTXZz16SJH0aYW/ymtFlDtB5vMxeBaKNIrcY6X1ISqcNKNp0XxCb/FHZBm6RaLzv+FwRfXcJ5y923oQ5Su1pkckHpUKimK1ILY5bbVOr6+LNU3F4vVpqzWdR72pCNZlhiJNvoHSOhAVJs1oVEjfPieDgouUGoZNzqrVQoWcCUnmKoXq2eS6OQ9pVsqPpIo8huQ0ImH2g+KuiKfRnJ7WTqqVPFdbyScLKDCup9ANFoo2q+wfdxZR8qSVstu7a0Fp9GtrclaoWI9L85XqZPrmDCOpE+ZPOogoWZ2GbHbviE6qfnw9ubI46jMqj+Kd1LxKoXSL1RIdQ4QamJ3+XXU66cjX07NCTmyCLFm49sxbXGTKeGNnEOXOvqatNzDV7TRaxbOCUynpq9NURB0jsY0jnUBUqdWt2o/aZXkarUnBmTT0UvnCKSonVGdiJBxR8mxq0YC07M63MwsxggUVrtEQs8EyQhKMKKd6IEt8oqnGcdGhOQxYhWPE6B/m1wlFVCh6LBiQaj2pZk1Ur0WSz2d8sPwkFW2aMxKHKH81DfG7IOSaG83rK2cnC12u2G14Z+dp99wwjVo4TjdNPysKUf7kOM3bwkKhaDrVOhM87QXpwi1LkluS4uG2/o1k67dvZh8WgyhXa3C3MGQ+01p1Lb6nIy+fUnJ/N7w3+e3M5NMiECVrdU5AyPukpyeVNfnmv+LvTyftxAzvFlMmVmwfUeWas5MPRVLN4tX6uq5YYPUZ5Qfj+9+m9M/bRVQpNnhckDo0rBfX4H1WdCHrnk/yGd7PN+lNzR6iQpEnj4jcc2o6sTnxx6+w/hHj98YLkk3qV2YHUY7LgtCQsjlZl/tZ1b7+EeUudsVZjfZ564hyNfZUELKfqO2JY6syIvqBX3JKMyOriJIcoWoo+kH2o+mnAdENfklhQvm8RUQn9TQjINS/12uOpTVY1NG76/gjcA1tEtIKovzZV9YmForUrznSxI7oUfd4UlgBrilQOjULiAotRkAovvh64nBwyiDlYdWM5L+ga5IUh82NqHLKGIuFoqiB2Xo2Udp+en9I+Q/4mhrZFfAimtSZAKEA/uvZxxvQQrFwXHtMKd6FmhkSpbvlQ3TG5qVD0UZxMwxoIeUmLMXjcfdDiXRFldyn8SCqnKZYAEVC9cnGGNBS2+3z+1KMYEIuNdIkvsWOKHmSWq59pixnRTFGaz0ZDrFKTomVZkZUaKajKXWVgaqGmu4Bho5qH7+e7Lxo5ZtEw2dEVLn2tL6dqasMckl1L4a6nuD0a0q3mEodJG5AH29NefKkGhuifBWMH5LV2rS+XEwQ8UzXmAQSrWSE2L/YzRflK/N5M2RB01/RBb0pl3YMkark5Lhx/au2sIUKziJCkH5NH72iK6cROSQl6PPFkHxB8oDGVDFMxsysqslvAhD52ucXt90fSN3bi7u2w3sflfb5bWfr4PPTk9//9Hn34KF78wg9mql8Yb9BO1iCH+nUnhUp7dLtXgAN4OPyQuhPaX/rpmSccBEjX+lmN6AWtrrZUi1zv3Pf5rUnn9+4bVP+hF+VrNtAtN3uHuxI6mSmQags6enghjKot6Ttu4fPbhkrTStSlnd2b/koIUTGuwCICtGoVUTtm59xQn01THF590KgLbW7+7Ty5pjie/cc7pINUc0iou3SHun71NV55+FRiCkpj7sM5akl+rvMXwsbombIYwXR3W6cob6qZJmcZWBX6YCFzwJSoMvovJkQVUOUFWskRErJz1zheZ33oKw5hx53ecpDX4v7lgkSE6JiJESebiQgim3h/tmsyl0bAyql6+YsD5X4xPKtsCBKohC8RbwDiEi5lWXjyyyQ7q26pJI7bn5/TFJ8y9yQWBAVo55IkQeREjuwAEgtW+pYGt25LJiQJjlsakgMiHL1kCdKXs0PILpwWyOkVjlgwSO1d62Y0OJx48DcKi+iWtTjSZOjTByRLUmBC15Cjzu2qiB36C7QHFEyFfKEPOQ7CEbkdhOnYQi6t9rIlpJ3qa3bHNG1upKf7K3FI3LLWzyMLuwSQgV+po0jTRFVkQnRXJEDiNzxT+xZgBvLbm9Fkv9fNhB9RYRCtGX8DiByy3usKdp/iildCpMZmSGaRNWZiWNKjZ1A5JZ/ZyP0XVThUpg4NjZBVFGbmSdKW6bmCCJGRt9ZbqVmeBgKPCA1bjqifGM+yRWlZd7ZEUmSvCKTekv/NCf0rwD1HvPipEBgfz/gnv9JLZD4pdARfYvO57eOafVkRITq+9S5OX+M+ZBipfPbjp9e6bhxlTym7V3K51F5/s7FXUwb8yi+9vntVoCaeJAJXwoV0VlUmwKkripmQiS7P9+2fbq+XPE9dp8kcn8k+c0yOr9TMnWIz6PPMHZQfHf09FUbLIaGqKI1s1Cdc1ExAKgLhxXKY4ccq8i7dELfiVGHFD+4J3iW2I2faEpSGPwQBVGymZobUZQcwjIhkty0DJ/vIUCCFKeGIr4nQsGSvHtHGXv6bnZIBQILqumIWtpUe8hDnwU0QSTFH2D7fVObmCsM0D75QHhQ2X1hMjiPdUmGJEMFkhEVl4sR6EZkgkj2Y7sBcJ0T4lApTP5MifSUWwxJ6VIY5isdAHSJiJKLRa1mRkRHJIeZsujtn7BfiRMT2soBXKzMFgP7COkTCVgNS0aUWhgRJYKdi4ZI/sEYkCod8GuVwqQY/B58RMnNOkmgdOEC3XiFzRCZGhENETMhlRH4zDKhmSqfoVIl9x1reS4XzAjoIswQmXkiGiLplr3CKGSHTR+GfA/7kn/zFAhGwNITZrcmiEJmexopiOQ/+FZUgSNB2IwUeFwNLqsn6w+IM16gCSJqAKuJhEg64KuwS/kE3EnahYZzJcji4gxRnV7QJIQUMF5FRxQ6Nt9gSUBE9rRE+aCoVIbG5SDMDm95Ll8YuA+2T4iOKM2wh4eACNyRZKIShBqYP4/tANf5LUwvPQLWiG3IoyKKnjIUAyOSwLG8maBeBtvzjW3n1Z7M0pqADl55jDUNUYi82HpFICKgY2CRD7rVOXYZ4KzlLSvluWLY4+PjVQqikEkzW3THIKI4/lxMugce/sHY7/sgZ20SCJJ0gd9LMtCmIDIbEvW1qkOIpH2Lc/NQ+B4w9mnn5o/FLAX6gvWVp8Ro9DSR67mn/QsiYohdYQHfKub4IQdi0YhAvybpCyQjIq9unOsy80X7A0Bk0RPN64Pzlg2D9CDuiiSuyUmdgN5R1gchZES0XdWonmUKIpl/iPKmH9i3ahyDtgN4gZatFso7yR0dcLaFfLj6mQQZkZUx0VJ3uIkYbBLIFGGneHAI92yGBK1FRJdZLxmR5Lex6jyIG74h+XiL2xkl9WaqbcCX6ohbQxScJSiIDIbKqT0cuX6ggkcf0PEL7MJdm74VWEP0kvHSENnwDNA6BoP7/IkXaGshKT6k14/qLCE6ynppiNy2aozHTYaJiX2swICtpe2499P3oZYQDTJ0RLZqHMNuJ+l3pWCIJPoSKjM9YgXqI1kriEYqIQoie5utgBrp5xxxRAe2CsRHRnoEVhAhX+0gInymXvqpu0A0IjzokfZ07/MjGqmeyEFE2PSPtK+7QDSiIDZVoDdbfkRKL+EoIgW7oSFXuvmIFkbkTRDD2F8M0bZwRJon8nqzf2r/XwMiZxuacERad+b1Zp4XL4hGFMR9kV93waYjUr5oRpR5Xb4ivNPHOxh9CLbpiMaaESXKR8tXAES2RnI+LNdhSCmKHjqKRjRYtLPx2yuiA5A2kL/RXSA6ABGMKFjWXPXw/SUgGWIxt68JX/NhCOTxSQt7YaxgRJqzfnPVqvA0IbwejlVAruPO7AKu9RVGCUY00Jz1qnvEE/LSro18kQLMgeiNRHBKTTCioGZE/1l9rY3PWcg2fAMedxtXFwOJWdmOvxaLaD6y1jUzVAJWYbfpRkGK8Iya0SgFp/cFI5q3s4x+FAKs9bHR0rbxxRrG+RSxk0SCEakpa29maHgV9w1u5iWHmICVQ9jkN7AuUrLRpwlFdDmPXo1fGOQboNNrmAQshMUcDbAUlG1mC5ZQREPkrbOXxld9wKrpuMUJZGCFkbSHLXuAFuBZNyOhiJArWqZAVoVP6xjTzcyCjAj3/cDiGasFugQjUofWmBG5XHfQWi9LfQy4mho3SGi9LP6bAawSiUjJAJ5IvQceNbklbMkLg2LAsBEaFoIL+SwvtRCJaJz1ZkfQG9D6O3zllLmgFaygdUBbZCyuUxOLCA0cy2Bm5hHynyw7N/WCljBK+5BxQMs4ibsSzSQS0TCT6cPvQItz3fH/8lX1L+AehJBYzNL0hUQieslAzloVvPMpwMXov+A9CDO75+DFEueXokkkon6mTPAv+NzX/E7ULXcGlcDd0qQxKJQPUAu0kqkSieg5OyC9BToHnp095/CedGI+8Q7eK2VlrCEWkTE8exfojRAjxpN2buCzUcjJOYI3srIkXiyiMektKEMxV/wTQ+4odkDaLE0eOLRhRG7Z+EuBphKK6JAyGQPvgFMTYqaN7f6JtBOY1mxI24elnRu+EZlQdz2jIFKArQLa/bBfgNSrRDz8kb4gEMgsLQv0G3+XkyqhiL7QqgxtA1rc0f2JePhn6YF4QpPkpocUlKMM5IMLdkhCx0WvpHfmIuzcVCXHwxf42beKev4sCZDbfCT4O+U0jXigw3oKMr7P1kYAQuzztaJoe60leWf3x3lse1uZa3s7dv6Dfh6s+VQTPBp7+7z0dNC9i/m2TaSIXDxzSbci4F4GSnE5EN7qdDoPW+GAbHaeMHSqgLFA+jFq8yOu3fv+sInwD1pGFIQyIav6N/08oUW1zc8uUq/7zJLbeCQMNfQlmkkgItffZiswvos4+21eiQDbfnKyy7ZVuo3E7BHxrWWVBdUxQDkhTycwPWC7eBvpfUKgvyL4oAreKnJMMlH6Uevl25gkejGv8rn9kyglrsUwAgrEKmAdkfJMfOtdJd5zro2Sn/iiLPGM7ExYv5Dj2He1CYcDMUo+4M3Tt4nHWlmUHURjhpaG7rllvcqS3OWfOonZKBCshK31RUxBtHJjtbHJlvKG6iHtIhubvVVqTGakHtJt5XuVJJZTvkA92mvdhnrYWg76t+nQSNP2Df/h+3LA8tH7qMCuldP+YdlDdPk3a51jHb6eRt6x8wMOaoHkvMpaEbleyflrox5346xfLAo4Lbax8cvbBLHyGGYu0ElEQe+f7PVvdwJMv38T5/j9m9W6XPYPs5nsl3fraz8wFegsItcQX2FElhLr7pgcESzJ0k8rv9ukjJ57CW15au+9RgwFOo/I9QyvfSCq1P0pxeFRgITeOLjlX66ljIevmWxmsafJm8i+rLgxpdQNy4QC14RIOcSWO5pou32z9aQer7zMzkjztJF75+nTfYx7pKhc9nuHb3gW+5pmuq8NFbg3L1AG80F2EUE/IafX2Jt95u6dt9uli+7D7s/9AJI/vNfpUn8RmiDlcjjwZg18NEN6NbT/oFZg2B/glx7RT+PbbvMlcf/JZGYcDmnlCdWs9TxhrPCPgJSj0WDmBfAsIHkHl/gMwrJATuluAuS7zWv7ZyaR6K/1dz2PRv1eAjKf1daWeeXzko7qz4w3Ux6uB1Jwbj0JOp6FJWXK/fGm/CSrempItsfptvmFuq5n1LhY8CxNKdF7wRvch2iEGj8alvQZYzZ+Bcej/gz17Bx4lqaUyfT6o/HRh5vTKDHfEHI4GIn/zo5GL4PZIT+dd0zZbOaVJf/nrMY97eyQrHcwEmVLytEl8ste9IAJy3hUO0r0ho6ZN4+U1+WG9ET51a4DUBTUsAa9MpfjAYVq0x9vhjdyqY0t8/bFZb1/v4wu+b+74PhyNOx/KWdsms6CT7bc3xBvvdD4S+a9emq/XO4NVFBB+tAQjeiCKpqX59deuaw6WNts5nwSZSc8o10NDzO6aiYSqjkczr4M+i/D4Wg0unwX+t9oOHzpD157s8P5dQLsZlluJnsozieKVbDvzQA1Tqh9LyKwymDxouFVIXy8sw1rX3pdvmbFPjEfHmQ/5ZfLDx8EmehykAAsaR18MonZYDP6d1MhSxLjcnnwZFBIZqEP/TAdvczWCAkNWGf90aa3LkzBUY+czhFIJ5PxllHr+uX4aBoPe0xZC6t05iNUFKJ+9HPaknL00jt0wnkj9IczFOcEN7hvZ9d49FwWEU0s2Ki2kymjUfvmRF4ipBwNB7Oy3UanRiaHs78H/y+2gwnF7i+vi/CUC9V8FI4+Vu71h5fjX6hXtygV1POXmZrloIdki/DEezjroQBvODr6/zQckpTg0TznMfjSm5UPcTyH5fKs9/r8MhxdjsdHv2qr+h9UAF+iMeG68QAAAABJRU5ErkJggg==" alt="Logo PT Borneo Alumina Indonesia"><div class="company">PT BORNEO ALUMINA INDONESIA</div><p>'+esc([meta.division,row.department].filter(Boolean).join(" & "))+'</p><table class="sign"><tr><th>Dibuat</th><th>Diperiksa</th><th>Disetujui</th></tr><tr class="space"><td></td><td></td><td></td></tr><tr><td>'+esc(details.created_by||row.requester||"")+'<br>Jabatan</td><td>'+esc(details.checked_by||"")+'<br>Jabatan</td><td>'+esc(details.approved_by||"")+'<br>Jabatan</td></tr></table><div class="page-no">1</div></article><article class="page content"><h1>KONTEN KERANGKA ACUAN KERJA</h1>'+section("1. Pendahuluan",row.scope)+section("2. Latar Belakang",row.background)+section("3. Maksud dan Tujuan",row.objective)+'<section><h2>4. Informasi Pelaksanaan</h2><table class="meta-grid"><tr><th>Lokasi Pekerjaan</th><td>'+esc(row.location||details.work_location||"—")+'</td></tr><tr><th>Durasi</th><td>'+esc(row.duration||details.contract_duration||details.work_duration||"—")+'</td></tr><tr><th>Jadwal Pelaksanaan</th><td>'+esc(row.schedule||"—")+'</td></tr><tr><th>Pagu Anggaran</th><td>'+esc(row.budget?money(row.budget):"—")+'</td></tr></table></section>'+section("5. Metode Tender",meta.tender_method)+section("6. Metode Kontrak",meta.contract_winner)+section("7. Metode Evaluasi",row.evaluation_method)+'<section><h2>8. Persyaratan Administrasi, Teknis, dan Komersial</h2>'+section("Administrasi",details.admin)+section("Teknis",details.technical)+section("Komersial",details.commercial)+'</section><section><h2>9. Ruang Lingkup Pekerjaan — '+esc(meta.type||"")+'</h2>'+detailHtml+'</section><div class="page-no">2</div></article></body></html>';
  const win=window.open("","_blank");if(!win){toast("Izinkan pop-up untuk membuka preview KAK.");return}win.document.open();win.document.write(html);win.document.close();
}

function cellValue(key,value){
  if(value===null||value===undefined||value==="")return "—";
  if(["budget","estimated_value","contract_value","value_delta"].includes(key))return esc(money(value));
  if(key==="status")return '<span class="status '+esc(value)+'">'+esc(value)+'</span>';
  if(key==="created_at")return esc(new Date(value+"Z").toLocaleDateString("id-ID"));
  return esc(value);
}
function openUserDialog(roles){
  const fields=$("#form-fields");
  $("#dialog-title").textContent="Tambah Pengguna";
  fields.innerHTML=`<label class="field">Nama Lengkap *<input name="full_name" required maxlength="100"></label>
  <label class="field">Username *<input name="username" required minlength="3" maxlength="50" autocomplete="off"></label>
  <label class="field">Role *<select name="role" required>${roles.map(r=>'<option value="'+esc(r)+'">'+esc(r)+'</option>').join("")}</select></label>
  <label class="field">Password Awal *<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label>
  <p class="hint full">Password minimal 12 karakter. Sampaikan password awal kepada pengguna melalui kanal komunikasi yang aman.</p>`;
  state.dialogResource={userManagement:true};
  $("#record-dialog").showModal();
}
async function resetUserPassword(id,name){
  const password=window.prompt("Masukkan password baru untuk "+name+" (minimal 12 karakter).");
  if(password===null)return;
  if(password.length<12||password.length>128){toast("Password harus 12–128 karakter.");return}
  if(!window.confirm("Reset password akun "+name+"?"))return;
  try{await api("users/"+id+"/reset-password",{method:"POST",body:JSON.stringify({password})});toast("Password berhasil direset.");}
  catch(error){toast(error.message)}
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
  if(config.userManagement){try{await api("users",{method:"POST",body:JSON.stringify(data)});$("#record-dialog").close();toast("User berhasil dibuat.");await renderPage("users")}catch(error){toast(error.message)}return}
  if(config.endpoint==="kak"){
    const extraKeys=["division","procurement_type","tender_method","contract_winner","admin","technical","commercial","created_by","checked_by","approved_by","contract_type","contract_duration","delivery_duration","work_duration","work_location","execution_method","technical_specification","brand","material_description","estimated_quantity","contract_scheme","payment_scheme","after_sales_warranty","training","delivery_place","commissioning","provider_responsibility","company_responsibility","sanctions","performance_index","others","work_output","tools_requirement","qualification_certification","work_warranty","risk_classification","reporting_supervision","work_scope","methodology"];
    const details={};for(const key of extraKeys){details[key]=data[key]??"";delete data[key]}
    data.requester=details.created_by;data.payment_terms=details.payment_scheme||"";data.requirements=[details.admin,details.technical,details.commercial].filter(Boolean).join("\n\n");
    data.special_terms=JSON.stringify({type:details.procurement_type,division:details.division,tender_method:details.tender_method,contract_winner:details.contract_winner,checked_by:details.checked_by,approved_by:details.approved_by,details});
  }
  for(const [key,value] of Object.entries(data)){if(["budget","estimated_value","contract_value","vendor_id","kak_id","contract_id","ref_id","value_delta","score","quality_score","delivery_score","compliance_score"].includes(key))data[key]=value===""?null:Number(value)}
  try{if(config.endpoint==="kak"&&state.kakEditId){await api("kak/"+state.kakEditId+"/workflow",{method:"POST",body:JSON.stringify({action:"edit",data,note:"Penyempurnaan isi KAK oleh Admin"})});state.kakEditId=null}else{await api(config.endpoint,{method:"POST",body:JSON.stringify(data)})}$("#record-dialog").close();toast("Data berhasil disimpan.");await renderResource(config);await loadNotifications()}
  catch(e){toast(e.message)}
}
$("#login-form").addEventListener("submit",async e=>{e.preventDefault();$("#login-error").textContent="";const form=Object.fromEntries(new FormData(e.currentTarget).entries());try{const r=await api("auth/login",{method:"POST",body:JSON.stringify(form)});state.user=r.user;showApp()}catch(err){$("#login-error").textContent=err.message}});
$("#logout").addEventListener("click",async()=>{await api("auth/logout",{method:"POST",body:"{}"});state.user=null;$("#app-shell").classList.add("hidden");$("#login-screen").classList.remove("hidden")});
$("#navigation").addEventListener("click",e=>{const button=e.target.closest("[data-page]");if(button)renderPage(button.dataset.page)});
$("#notification-button").addEventListener("click",()=>{state.notificationOpen=!state.notificationOpen;renderNotificationPanel();if(state.notificationOpen)loadNotifications()});
$("#notification-panel").addEventListener("click",async e=>{
  const readAll=e.target.closest("[data-notification-read-all]");
  if(readAll){try{await api("notifications/read-all",{method:"POST",body:"{}"});await loadNotifications()}catch(error){toast(error.message)}return}
  const item=e.target.closest("[data-notification-id]");
  if(item){await markNotificationRead(item.dataset.notificationId)}
});
document.addEventListener("click",e=>{
  if(state.notificationOpen&&!e.target.closest(".notification-wrap")){state.notificationOpen=false;renderNotificationPanel()}
});
$("#record-form").addEventListener("submit",saveRecord);
$("#page-content").addEventListener("click",async e=>{
  const preview=e.target.closest("[data-kak-preview]");if(preview){openKakPreview(preview.dataset.kakPreview);return}
  const edit=e.target.closest("[data-kak-edit]");if(edit){await editKak(edit.dataset.kakEdit);return}
  const submit=e.target.closest("[data-kak-submit]");if(submit){if(window.confirm("Ajukan KAK ini ke Divisi SCM untuk direview Section Head?"))await kakWorkflowAction(submit.dataset.kakSubmit,"submit");return}
  const review=e.target.closest("[data-kak-review]");if(review){await kakWorkflowAction(review.dataset.id,"review",{decision:review.dataset.kakReview});return}
});
$("#dialog-close").addEventListener("click",()=>$("#record-dialog").close());
$("#dialog-cancel").addEventListener("click",()=>$("#record-dialog").close());
setInterval(()=>{if(state.user&&state.page==="kak")renderResource(resources.kak);else if(state.user&&state.page==="dashboard")renderDashboard()},15000);
boot();
