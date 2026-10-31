<?php
function hh($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
$msg=''; $error='';
$vendors=$pdo->query("SELECT id,name FROM vendors WHERE status='Active' ORDER BY name")->fetchAll();
$kaks=$pdo->query("SELECT * FROM kak_documents ORDER BY id DESC")->fetchAll();

if($_SERVER['REQUEST_METHOD']==='POST'){
  try{
    $clauses=[];
    $blocks=[
      'sla'=>'SLA / Service Level',
      'warranty'=>'Garansi / Warranty',
      'penalty'=>'Denda / Penalty',
      'hse'=>'K3 / HSE',
      'confidentiality'=>'Kerahasiaan',
      'force_majeure'=>'Force Majeure',
      'termination'=>'Termination',
      'tax'=>'Pajak',
      'dispute'=>'Penyelesaian Perselisihan'
    ];
    foreach($blocks as $key=>$label){
      if(trim($_POST[$key]??'')!=='') $clauses[]=$label.":\n".trim($_POST[$key]);
    }
    if(trim($_POST['clauses']??'')!=='') $clauses[]="Ketentuan Tambahan:\n".trim($_POST['clauses']);

    $s=$pdo->prepare("INSERT INTO contract_drafts(draft_no,kak_id,vendor_id,title,contract_value,start_date,end_date,scope,payment_terms,clauses,created_by,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
    $s->execute([
      trim($_POST['draft_no']),$_POST['kak_id']?:null,$_POST['vendor_id']?:null,trim($_POST['title']),
      floatval($_POST['contract_value']),$_POST['start_date'],$_POST['end_date'],trim($_POST['scope']),
      trim($_POST['payment_terms']),implode("\n\n",$clauses),($_SESSION['user']['id']??null),$_POST['status']??'Draft'
    ]);
    $msg='Draft kontrak berhasil dibuat.';
  }catch(Throwable $e){$error='Draft kontrak gagal disimpan. Pastikan database dan tabel contract_drafts tersedia.';}
}

$rows=$pdo->query("SELECT d.*,v.name vendor_name,k.kak_no FROM contract_drafts d LEFT JOIN vendors v ON v.id=d.vendor_id LEFT JOIN kak_documents k ON k.id=d.kak_id ORDER BY d.id DESC")->fetchAll();
$next='DRF-CTR-'.date('Y').'-'.str_pad((int)$pdo->query("SELECT COUNT(*) FROM contract_drafts")->fetchColumn()+1,4,'0',STR_PAD_LEFT);

$kakMap=[];
foreach($kaks as $k){
  $kakMap[$k['id']]=[
    'title'=>$k['title'],'budget'=>$k['budget'],'scope'=>$k['scope'],'payment'=>$k['payment_terms'],
    'location'=>$k['location'],'duration'=>$k['duration'],'requirements'=>$k['requirements']
  ];
}
?>
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <div class="eyebrow">CONTRACT LIFECYCLE</div>
    <h2 class="fw-bold mb-1">Draft Contract Generator</h2>
    <div class="small-muted">Bangun draft kontrak dari KAK dan Vendor Master tanpa input ulang data utama.</div>
  </div>
  <button class="btn btn-primary btn-lg shadow-sm" data-bs-toggle="modal" data-bs-target="#addDraft">+ Buat Draft Kontrak</button>
</div>

<?php if($msg):?><div class="alert alert-success border-0 shadow-sm"><?=$msg?></div><?php endif;?>
<?php if($error):?><div class="alert alert-danger border-0 shadow-sm"><?=$error?></div><?php endif;?>

<div class="card border-0 shadow-sm">
 <div class="card-body p-0">
  <div class="p-3 border-bottom d-flex justify-content-between align-items-center"><div><strong>Contract Draft Register</strong><div class="small-muted">Draft, review dan dokumen yang siap diproses ke tahap approval</div></div><span class="badge bg-light text-dark"><?=count($rows)?> dokumen</span></div>
  <div class="table-responsive">
   <table class="table table-hover align-middle mb-0"><thead><tr><th>No. Draft</th><th>KAK</th><th>Vendor</th><th>Judul</th><th>Nilai</th><th>Status</th><th class="text-end">Aksi</th></tr></thead><tbody>
   <?php if(!$rows):?><tr><td colspan="7" class="text-center text-muted py-5">Belum ada draft kontrak.</td></tr><?php endif;?>
   <?php foreach($rows as $r):?><tr>
    <td><strong><?=hh($r['draft_no'])?></strong></td><td><?=hh($r['kak_no']?:'-')?></td><td><?=hh($r['vendor_name']?:'-')?></td><td><?=hh($r['title'])?></td>
    <td>Rp <?=number_format($r['contract_value'],0,',','.')?></td>
    <td><span class="status-pill status-<?=strtolower(hh($r['status']))?>"><?=hh($r['status'])?></span></td>
    <td class="text-end"><a class="btn btn-sm btn-outline-primary" target="_blank" href="index.php?page=contract_draft&print=<?=$r['id']?>">Preview / PDF</a></td>
   </tr><?php endforeach;?>
   </tbody></table>
  </div>
 </div>
</div>

<?php if(isset($_GET['print'])):
$s=$pdo->prepare("SELECT d.*,v.name vendor_name,v.email vendor_email,v.phone vendor_phone,k.kak_no,k.title kak_title FROM contract_drafts d LEFT JOIN vendors v ON v.id=d.vendor_id LEFT JOIN kak_documents k ON k.id=d.kak_id WHERE d.id=?");
$s->execute([(int)$_GET['print']]);$r=$s->fetch();
if($r):?>
<div class="document-toolbar no-print"><div><strong>Contract Document Preview</strong><span class="small-muted ms-2"><?=hh($r['draft_no'])?></span></div><button onclick="window.print()" class="btn btn-dark">🖨 Cetak / Save as PDF</button></div>
<div class="doc-paper contract-paper">
 <div class="doc-letterhead">
   <div class="doc-logo">SCM</div>
   <div><strong>NAMA PERUSAHAAN</strong><small>Procurement & Supply Chain Management</small></div>
   <div class="doc-meta"><strong>DRAFT CONTRACT</strong><small><?=hh($r['draft_no'])?></small></div>
 </div>
 <div class="doc-title">PERJANJIAN / KONTRAK PENGADAAN<br><span><?=hh($r['title'])?></span></div>
 <div class="doc-intro">Draft dokumen pengadaan untuk proses review administratif, komersial dan legal sebelum ditetapkan sebagai kontrak final.</div>

 <table class="doc-info">
   <tr><td>Nomor Draft</td><td><?=hh($r['draft_no'])?></td></tr>
   <tr><td>Referensi KAK</td><td><?=hh($r['kak_no']?:'-')?><?= $r['kak_title']?' — '.hh($r['kak_title']):'' ?></td></tr>
   <tr><td>Vendor / Penyedia</td><td><strong><?=hh($r['vendor_name']?:'[NAMA PENYEDIA]')?></strong></td></tr>
   <tr><td>Nilai Kontrak</td><td><strong>Rp <?=number_format($r['contract_value'],0,',','.')?></strong></td></tr>
   <tr><td>Jangka Waktu</td><td><?=hh($r['start_date'])?> s.d. <?=hh($r['end_date'])?></td></tr>
 </table>

 <?php
 $contractSections=[
  'PASAL 1 — PARA PIHAK'=>"<strong>PIHAK PERTAMA:</strong> NAMA PERUSAHAAN.<br><strong>PIHAK KEDUA:</strong> ".hh($r['vendor_name']?:'[NAMA PENYEDIA]').".",
  'PASAL 2 — DASAR DAN REFERENSI'=>"KAK: ".hh($r['kak_no']?:'[NOMOR KAK]').($r['kak_title']?' — '.hh($r['kak_title']):'').".",
  'PASAL 3 — MAKSUD, TUJUAN DAN RUANG LINGKUP'=>nl2br(hh($r['scope'])),
  'PASAL 4 — NILAI KONTRAK'=>"Nilai kontrak sebesar <strong>Rp ".number_format($r['contract_value'],0,',','.')."</strong>, dengan ketentuan pajak dan komersial mengikuti hasil negosiasi dan persetujuan yang berlaku.",
  'PASAL 5 — JANGKA WAKTU'=>"Pelaksanaan pekerjaan dimulai pada <strong>".hh($r['start_date'])."</strong> sampai dengan <strong>".hh($r['end_date'])."</strong>.",
  'PASAL 6 — KETENTUAN PEMBAYARAN'=>nl2br(hh($r['payment_terms'])),
  'PASAL 7 — KETENTUAN KHUSUS'=>nl2br(hh($r['clauses'])),
  'PASAL 8 — PENYELESAIAN PERSELISIHAN'=>"Para pihak mengutamakan penyelesaian secara musyawarah. Ketentuan lebih lanjut mengikuti kontrak final dan ketentuan hukum yang berlaku.",
  'PASAL 9 — PENUTUP'=>"Draft ini merupakan dokumen kerja untuk proses review dan <strong>bukan kontrak final</strong> sampai disetujui serta ditandatangani pejabat yang berwenang."
 ];
 foreach($contractSections as $heading=>$body):?>
   <div class="doc-section"><h4><?=h($heading)?></h4><div><?=$body?></div></div>
 <?php endforeach;?>

 <div class="signature-grid">
   <div class="text-center"><div>PIHAK PERTAMA</div><div class="sign-space"></div><strong>NAMA PEJABAT</strong><br>Jabatan</div>
   <div class="text-center"><div>PIHAK KEDUA</div><div class="sign-space"></div><strong><?=hh($r['vendor_name']?:'NAMA PENYEDIA')?></strong><br>Authorized Representative</div>
 </div>
 <div class="doc-footer">DRAFT • Generated by SCM Procurement Management System • <?=date('d F Y')?></div>
</div>
<?php endif; endif;?>

<div class="modal fade" id="addDraft" tabindex="-1">
 <div class="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-md-down">
  <div class="modal-content professional-modal">
   <form method="post" id="contractForm">
    <div class="modal-header">
      <div><div class="eyebrow">DOCUMENT GENERATOR</div><h4 class="modal-title fw-bold">Buat Draft Kontrak</h4><div class="small-muted">Pilih KAK dan Vendor untuk mengaktifkan auto-fill data.</div></div>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body p-4">
      <div class="generator-banner"><div class="generator-icon">⚡</div><div><strong>Auto-Fill aktif</strong><div class="small-muted">Judul, scope, payment dan referensi akan diambil dari KAK yang dipilih.</div></div></div>

      <div class="form-section-head"><div class="step-no">01</div><div class="step-copy"><div class="step-title">Identitas & Referensi</div><div class="step-desc">Hubungkan draft dengan KAK dan vendor</div></div></div>
      <div class="row g-3">
        <div class="col-md-4"><label>No. Draft</label><input name="draft_no" class="form-control form-control-lg" value="<?=hh($next)?>" required></div>
        <div class="col-md-4"><label>Referensi KAK</label><select name="kak_id" id="kak_id" class="form-select form-select-lg"><option value="">-- Pilih KAK --</option><?php foreach($kaks as $k):?><option value="<?=$k['id']?>"><?=hh($k['kak_no'].' — '.$k['title'])?></option><?php endforeach;?></select></div>
        <div class="col-md-4"><label>Vendor / Penyedia</label><select name="vendor_id" class="form-select form-select-lg"><option value="">-- Pilih Vendor --</option><?php foreach($vendors as $v):?><option value="<?=$v['id']?>"><?=hh($v['name'])?></option><?php endforeach;?></select></div>
        <div class="col-12"><label>Judul Kontrak</label><input name="title" id="contract_title" class="form-control form-control-lg" required placeholder="Judul kontrak akan otomatis mengikuti KAK"></div>
      </div>

      <div class="form-section-head"><div class="step-no">02</div><div class="step-copy"><div class="step-title">Nilai & Jangka Waktu</div><div class="step-desc">Data komersial utama</div></div></div>
      <div class="row g-3">
        <div class="col-md-4"><label>Nilai Kontrak (Rp)</label><input name="contract_value" id="contract_value" type="number" min="0" class="form-control form-control-lg" value="0" required></div>
        <div class="col-md-4"><label>Tanggal Mulai</label><input name="start_date" type="date" class="form-control form-control-lg" required></div>
        <div class="col-md-4"><label>Tanggal Selesai</label><input name="end_date" type="date" class="form-control form-control-lg" required></div>
      </div>

      <div class="form-section-head"><div class="step-no">03</div><div class="step-copy"><div class="step-title">Scope & Commercial</div><div class="step-desc">Detail yang menjadi bagian kontrak</div></div></div>
      <div class="row g-3">
        <div class="col-md-6"><label>Ruang Lingkup</label><textarea name="scope" id="contract_scope" class="form-control" rows="5" required></textarea></div>
        <div class="col-md-6"><label>Ketentuan Pembayaran</label><textarea name="payment_terms" id="contract_payment" class="form-control" rows="5" required></textarea></div>
      </div>

      <div class="form-section-head"><div class="step-no">04</div><div class="step-copy"><div class="step-title">Clause Builder</div><div class="step-desc">Gunakan field terpisah agar kontrak mudah direview</div></div></div>
      <div class="row g-3">
        <?php
        $clauseFields=[
          'sla'=>['SLA / Service Level','Target layanan, response time, uptime, KPI.'],
          'warranty'=>['Garansi / Warranty','Masa garansi, response warranty, spare part, remedial.'],
          'penalty'=>['Denda / Penalty','Ketentuan denda keterlambatan atau ketidakpatuhan.'],
          'hse'=>['K3 / HSE','Safety induction, PPE, permit, environmental requirement.'],
          'confidentiality'=>['Kerahasiaan','Confidentiality dan perlindungan informasi.'],
          'force_majeure'=>['Force Majeure','Kondisi kahar dan mekanisme pemberitahuan.'],
          'termination'=>['Termination','Hak dan kondisi penghentian kontrak.'],
          'tax'=>['Pajak','Pajak, withholding, dokumen perpajakan.'],
          'dispute'=>['Penyelesaian Perselisihan','Escalation, musyawarah, forum penyelesaian.']
        ];
        foreach($clauseFields as $n=>$a):?>
          <div class="col-md-6"><label><?=$a[0]?></label><textarea name="<?=$n?>" class="form-control" rows="3" placeholder="<?=$a[1]?>"></textarea></div>
        <?php endforeach;?>
        <div class="col-12"><label>Ketentuan Tambahan</label><textarea name="clauses" class="form-control" rows="4" placeholder="Tambahkan klausul lain yang belum tercakup."></textarea></div>
      </div>

      <div class="form-section-head"><div class="step-no">05</div><div class="step-copy"><div class="step-title">Workflow</div><div class="step-desc">Tentukan status awal dokumen</div></div></div>
      <div class="row g-3"><div class="col-md-6"><label>Status</label><select name="status" class="form-select form-select-lg"><option>Draft</option><option>Review</option><option>Approved</option><option>Rejected</option></select></div></div>
    </div>
    <div class="modal-footer bg-light"><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary px-4" type="submit">Simpan & Buat Draft</button></div>
   </form>
  </div>
 </div>
</div>

<script>
const KAK_DATA = <?=json_encode($kakMap, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)?>;
document.addEventListener('DOMContentLoaded', function(){
  const sel=document.getElementById('kak_id');
  if(!sel) return;
  sel.addEventListener('change',function(){
    const k=KAK_DATA[this.value];
    if(!k) return;
    const title=document.getElementById('contract_title');
    const value=document.getElementById('contract_value');
    const scope=document.getElementById('contract_scope');
    const pay=document.getElementById('contract_payment');
    if(title && !title.value) title.value=k.title||'';
    if(value && (!value.value || value.value==='0')) value.value=k.budget||0;
    if(scope && !scope.value) scope.value=k.scope||'';
    if(pay && !pay.value) pay.value=k.payment||'';
  });
});
</script>
