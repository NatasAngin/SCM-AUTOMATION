<?php
function e($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
$exp=[];
try {
 $q=$pdo->query("SELECT id,contract_no,vendor_id,end_date,status FROM contracts WHERE status='Active' AND end_date IS NOT NULL AND end_date <= DATE_ADD(CURDATE(),INTERVAL 90 DAY) ORDER BY end_date ASC");
 $exp=$q->fetchAll();
} catch(Throwable $x) {}
$ob=[];
try { $ob=$pdo->query("SELECT * FROM scm_contract_obligations WHERE status IN ('OPEN','OVERDUE') ORDER BY due_date ASC")->fetchAll(); } catch(Throwable $x) {}
?>
<div class="d-flex justify-content-between align-items-center mb-3"><div><h2 class="fw-bold mb-1">SCM Auto-Pilot</h2><div class="small-muted">Monitoring otomatis untuk kontrak dan kewajiban kontrak.</div></div><span class="badge bg-success">ENGINE ACTIVE</span></div>
<div class="row g-3 mb-4">
<?php $cards=[['Contract Expiry',count($exp),'H-90 monitoring'],['Open Obligations',count($ob),'Due date monitoring'],['Urgent','0','H-14 escalation']]; foreach($cards as $c):?><div class="col-md-4"><div class="card stat"><div class="card-body"><small><?=e($c[0])?></small><h3 class="fw-bold mt-2"><?=e($c[1])?></h3><span class="text-muted"><?=e($c[2])?></span></div></div></div><?php endforeach;?></div>
<div class="card mb-4"><div class="card-body"><h5>Contract Expiry Monitor</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Contract</th><th>End Date</th><th>Remaining</th><th>Action</th></tr></thead><tbody>
<?php foreach($exp as $r): $days=(int)((strtotime($r['end_date'])-strtotime(date('Y-m-d')))/86400); $cls=$days<=14?'danger':($days<=30?'warning':'info'); ?><tr><td><?=e($r['contract_no'])?></td><td><?=e($r['end_date'])?></td><td><span class="badge text-bg-<?=$cls?>"><?=$days?> days</span></td><td><?= $days<=14?'URGENT ESCALATION':($days<=30?'REMINDER + ESCALATION':'REMINDER') ?></td></tr><?php endforeach; if(!$exp):?><tr><td colspan="4" class="text-muted">Tidak ada kontrak aktif yang akan berakhir dalam 90 hari.</td></tr><?php endif;?></tbody></table></div></div></div>
<div class="card"><div class="card-body"><h5>Contract Obligations</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Obligation</th><th>Due Date</th><th>Owner</th><th>Status</th></tr></thead><tbody>
<?php foreach($ob as $r):?><tr><td><?=e($r['obligation_title'])?></td><td><?=e($r['due_date'])?></td><td><?=e($r['owner'])?></td><td><span class="badge <?=($r['status']==='OVERDUE'?'text-bg-danger':'text-bg-warning')?>"><?=e($r['status'])?></span></td></tr><?php endforeach; if(!$ob):?><tr><td colspan="4" class="text-muted">Belum ada obligation.</td></tr><?php endif;?></tbody></table></div></div></div>
