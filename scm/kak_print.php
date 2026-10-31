<?php
session_start();
require_once __DIR__.'/config/database.php';
if(!isset($_SESSION['user'])){header('Location: login.php');exit;}
if(!function_exists('h')){function h($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}}
$id=(int)($_GET['id']??0);
$s=$pdo->prepare('SELECT * FROM kak_documents WHERE id=?');$s->execute([$id]);$r=$s->fetch();
if(!$r){http_response_code(404);exit('KAK tidak ditemukan.');}
$x=json_decode($r['special_terms']??'{}',true);if(!is_array($x))$x=[];
$labels=['contract_type'=>'Jenis Kontrak','contract_duration'=>'Durasi Kontrak','delivery_duration'=>'Durasi Pengiriman','work_duration'=>'Durasi Pekerjaan','work_location'=>'Lokasi kerja;','execution_method'=>'Cara Pelaksanaan Pekerjaan','technical_specification'=>'Spesifikasi Teknis, Part Number, Serial Number, Technical Drawing, dsb;','brand'=>'Merek (untuk kasus tertentu)','material_description'=>'Deskripsi material jika ada;','estimated_quantity'=>'Estimasi Kuantitas;','contract_scheme'=>'Skema kontrak (Fix price / Price adjustment)','payment_scheme'=>'Skema Pembayaran;','after_sales_warranty'=>'Jaminan purnajual, dan Garansi pemakaian;','training'=>'Training jika diperlukan;','delivery_place'=>'Tempat Penyerahan;','commissioning'=>'Comissioning, dan atau uji coba jika diperlukan;','provider_responsibility'=>'Tanggung jawab Penyedia Barang/Jasa','company_responsibility'=>'Tanggung jawab Perusahaan','sanctions'=>'Sanksi','performance_index'=>'Indeks Performa','others'=>'Lain-lain','work_output'=>'Hasil Pekerjaan/Target Pekerjaan/Output Pekerjaan','tools_requirement'=>'Jenis/Jumlah alat yang dibutuhkan/Gambar/Drawing (Jika diperlukan);','qualification_certification'=>'Kualifikasi dan sertifikasi SDM (Jika diperlukan);','work_warranty'=>'Garansi Pekerjaan (Jika diperlukan);','risk_classification'=>'Klasifikasi resiko','reporting_supervision'=>'Mekanisme Pelaporan & Pengawasan','work_scope'=>'Lingkup pekerjaan','methodology'=>'Metodologi & Cara Pelaksanaan Pekerjaan;'];
$type=$x['type']??'Material / Barang';
$sub=$type==='Material / Barang'?'a. Material/barang':($type==='Jasa / Services'?'b. Jasa/Services':'c. Konsultan');
?><!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAK <?=h($r['kak_no'])?></title><style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#d9d9d9;color:#20242b;font-family:Arial,Helvetica,sans-serif}.toolbar{position:sticky;top:0;z-index:5;background:#20242b;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;font-family:Arial,sans-serif}.toolbar button{background:#fff;color:#111;border:0;padding:9px 16px;border-radius:4px;font-weight:700;cursor:pointer}.doc{width:210mm;min-height:297mm;margin:16px auto;background:#fff;position:relative;padding:14mm 18mm 14mm;box-shadow:0 2px 18px rgba(0,0,0,.25);overflow:hidden}.page-no{position:absolute;bottom:11mm;left:0;right:0;text-align:center;font-size:10pt}.cover{position:relative;min-height:269mm;text-align:center;padding-top:17mm;z-index:1}.cover-title{font-size:17pt;font-weight:700;margin-bottom:1mm}.cover-job{display:inline-block;font-size:17pt;font-weight:700;text-transform:uppercase;padding:0;margin-bottom:1mm}.cover-no{font-size:16pt;font-weight:700;margin:0}.cover-no b{padding:0}.cover-logo{width:98mm;height:auto;margin:46mm auto 40mm;display:block;position:relative;z-index:2}.watermark{position:absolute;width:220mm;left:-4mm;top:77mm;opacity:.16;filter:grayscale(1);transform:rotate(-43deg);z-index:0}.company{font-size:15pt;font-weight:700;position:relative;z-index:2}.dept{display:inline-block;font-size:13pt;margin-top:1mm;padding:0;position:relative;z-index:2}.approval{width:156mm;border-collapse:collapse;margin:8mm auto 0;font-size:10pt;position:relative;z-index:2}.approval th,.approval td{border:1px solid #333;text-align:center;padding:1.5mm}.approval th{background:#ddd;font-weight:700}.approval .space td{height:28mm}.approval .name{font-weight:700}.content{font-size:11pt;line-height:1.35;padding-top:14mm}.content-title{font-size:16pt;font-weight:bold;margin:0 0 8mm}.section{margin:0 0 5mm}.section h2{font-size:12pt;margin:0 0 2mm;font-weight:bold}.section p{margin:0;white-space:pre-wrap;text-align:justify}.sub{margin-left:5mm}.sub h3{font-size:11pt;margin:0 0 2mm;font-weight:bold}.bullet{display:flex;gap:4mm;margin:2.5mm 0;page-break-inside:avoid}.bullet-dot{width:4mm;flex:0 0 4mm;text-align:center}.bullet-text{flex:1}.bullet-text strong{font-weight:normal}@media print{@page{size:A4;margin:0}html,body{background:#fff}.toolbar{display:none}.doc{width:210mm;min-height:297mm;margin:0;box-shadow:none;page-break-after:always}.doc:last-child{page-break-after:auto}}
</style></head><body>
<div class="toolbar"><div><strong>Preview KAK</strong> — <?=h($r['kak_no'])?></div><button onclick="window.print()">Cetak / Save as PDF</button></div>
<section class="doc"><div class="cover">
<img class="watermark" src="public/images/logo-bai.png" alt="">
<div class="cover-title">KERANGKA ACUAN KERJA</div>
<div class="cover-job"><?=h($r['title'])?></div>
<div class="cover-no">No. <b><?=h($r['kak_no'])?></b></div>
<img class="cover-logo" src="public/images/logo-bai.png" alt="BAI">
<div class="company">PT BORNEO ALUMINA INDONESIA</div>
<div class="dept"><?=h(($x['division']??'').(($x['division']??'')&&$r['department']?' & ':'').$r['department'])?></div>
<table class="approval"><tr><th>Dibuat</th><th>Diperiksa</th><th>Disetujui</th></tr><tr class="space"><td></td><td></td><td></td></tr><tr><td class="name"><?=h($x['created_by']??'Nama')?><br>Jabatan</td><td class="name"><?=h($x['checked_by']??'Nama')?><br>Jabatan</td><td class="name"><?=h($x['approved_by']??'Nama')?><br>Jabatan</td></tr></table>
</div><div class="page-no">1</div></section>
<section class="doc content"><div class="page-no">2</div><div class="content-title">Konten</div>
<div class="section"><h2>1. Pendahuluan</h2><p><?=h($r['scope'])?></p></div>
<div class="section"><h2>2. Latar Belakang</h2><p><?=h($r['background'])?></p></div>
<div class="section"><h2>3. Maksud dan Tujuan</h2><p><?=h($r['objective'])?></p></div>
<div class="section"><h2>4. Metode Tender (Penunjukan Langsung / Pemilihan Langsung)</h2><p><?=h($x['tender_method']??'')?></p></div>
<div class="section"><h2>5. Metode Kontrak (1 Pemenang / 2 Pemenang / 3 Pemenang)</h2><p><?=h($x['contract_winner']??'')?></p></div>
<div class="section"><h2>6. Metode Evaluasi (Pass – Fail / Scoring)</h2><p><?=h($r['evaluation_method'])?></p></div>
<div class="section"><h2>7. Persyaratan Administrasi, Teknis, Komersial</h2><p><b>Administrasi</b>
<?=h($x['admin']??'')?></p><p><b>Teknis</b>
<?=h($x['technical']??'')?></p><p><b>Komersial</b>
<?=h($x['commercial']??'')?></p></div>
<div class="section"><h2>8. Ruang Lingkup Pekerjaan</h2><div class="sub"><h3><?=$sub?></h3><?php foreach(($x['details']??[]) as $k=>$v):if(trim((string)$v)!==''):?><div class="bullet"><div class="bullet-dot">•</div><div class="bullet-text"><strong><?=h($labels[$k]??$k)?></strong><br><?=nl2br(h($v))?></div></div><?php endif;endforeach;?></div></div></section>
</body></html>