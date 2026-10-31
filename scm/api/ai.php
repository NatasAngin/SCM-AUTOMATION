<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (!isset($_SESSION['user'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Session login tidak ditemukan.']); exit; }

$input=json_decode(file_get_contents('php://input'),true) ?: $_POST;
$action=$input['action'] ?? 'chat';
$model=trim((string)($input['model'] ?? 'qwen3:4b'));
if ($model==='') $model='qwen3:4b';
$base='http://127.0.0.1:11434';

$system=<<<SYS
Anda adalah SCM Procurement Copilot untuk perusahaan di Indonesia.
Tugas Anda membantu pekerjaan sourcing, procurement, KAK/TOR, vendor evaluation, kontrak, dan administrasi pengadaan.
Gunakan Bahasa Indonesia profesional, ringkas, terstruktur, dan mudah ditempel ke dokumen perusahaan.
Jangan mengarang kebijakan perusahaan, angka, nama vendor, pasal hukum, atau fakta yang tidak diberikan.
Jika informasi belum cukup, nyatakan data yang kurang.
AI hanya memberi rekomendasi; keputusan pengadaan, approval, pemilihan vendor, dan keputusan legal tetap dilakukan manusia.
Untuk dokumen resmi gunakan format heading dan bullet yang rapi.
SYS;

function call_ollama($base,$model,$system,$user){
  $payload=json_encode(['model'=>$model,'stream'=>false,'messages'=>[
    ['role'=>'system','content'=>$system],['role'=>'user','content'=>$user]
  ]],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  $url=$base.'/api/chat';
  if(function_exists('curl_init')){
    $ch=curl_init($url);
    curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$payload,CURLOPT_HTTPHEADER=>['Content-Type: application/json'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>180]);
    $raw=curl_exec($ch); $errno=curl_errno($ch); $err=curl_error($ch); $code=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
    if($errno) throw new Exception('Ollama tidak dapat dihubungi: '.$err);
    if($code>=400) throw new Exception('Ollama mengembalikan HTTP '.$code.'. Pastikan model sudah di-download.');
  } else {
    $ctx=stream_context_create(['http'=>['method'=>'POST','header'=>"Content-Type: application/json\r\n",'content'=>$payload,'timeout'=>180]]);
    $raw=@file_get_contents($url,false,$ctx);
    if($raw===false) throw new Exception('Ollama tidak dapat dihubungi. Aktifkan cURL PHP atau pastikan Ollama berjalan.');
  }
  $data=json_decode($raw,true);
  if(!is_array($data)) throw new Exception('Respons Ollama tidak valid.');
  return $data['message']['content'] ?? $data['response'] ?? '';
}

function build_prompt($action,$input){
  if($action==='generate_kak'){
    return "Buat draft KAK/TOR berdasarkan data berikut. Kembalikan hanya isi yang siap ditempel ke form, dengan heading: Latar Belakang, Maksud & Tujuan, Ruang Lingkup, Output/Deliverables, Spesifikasi Teknis, Kriteria Penerimaan, Persyaratan Penyedia, Metode Evaluasi, Jadwal, Ketentuan Pembayaran, Risiko/HSE.\n\nData: ".json_encode($input['data']??[],JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
  }
  if($action==='review_kak'){
    return "Review KAK berikut. Berikan: (1) skor kelengkapan 0-100, (2) temuan kritis, (3) data yang kurang, (4) risiko procurement, (5) rekomendasi perbaikan prioritas. Jangan menyatakan KAK sudah disetujui.\n\nKAK:\n".($input['text']??'');
  }
  if($action==='contract_risk'){
    return "Review draft kontrak berikut sebagai procurement risk assistant. Identifikasi gap pada scope, nilai, payment, SLA, warranty, penalty, HSE, confidentiality, force majeure, termination, tax, dispute, dan masa berlaku. Berikan level Low/Medium/High dan rekomendasi. Jangan memberikan opini hukum final.\n\nKontrak:\n".($input['text']??'');
  }
  if($action==='vendor_analysis'){
    return "Analisis data vendor berikut secara objektif. Buat ringkasan per vendor, kelebihan, kekurangan, red flag, dan pertanyaan klarifikasi. Jangan menetapkan pemenang secara otomatis.\n\nData:\n".($input['text']??'');
  }
  if($action==='email'){
    return "Buat email procurement yang sopan dan profesional berdasarkan konteks berikut. Berikan subject dan body.\n\nKonteks:\n".($input['text']??'');
  }
  return $input['message']??'';
}

try{
  if($action==='health'){
    $ctx=stream_context_create(['http'=>['method'=>'GET','timeout'=>3]]);
    $raw=@file_get_contents($base.'/api/tags',false,$ctx);
    if($raw===false) throw new Exception('offline');
    $d=json_decode($raw,true); $models=array_map(fn($x)=>$x['name']??'', $d['models']??[]);
    echo json_encode(['ok'=>true,'online'=>true,'model'=>$model,'models'=>$models]); exit;
  }
  $prompt=build_prompt($action,$input);
  if(trim($prompt)==='') throw new Exception('Input AI masih kosong.');
  $answer=call_ollama($base,$model,$system,$prompt);
  echo json_encode(['ok'=>true,'answer'=>$answer,'model'=>$model],JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){
  http_response_code(503);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage(),'hint'=>'Pastikan Ollama aktif dan model '.$model.' sudah di-pull.'],JSON_UNESCAPED_UNICODE);
}
