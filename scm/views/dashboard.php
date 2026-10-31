<?php
$vendors=(int)$pdo->query("SELECT COUNT(*) FROM vendors WHERE status='Active'")->fetchColumn();
$sourcing=(int)$pdo->query("SELECT COUNT(*) FROM sourcing_requests WHERE status NOT IN ('Cancelled')")->fetchColumn();
$contracts=(int)$pdo->query("SELECT COUNT(*) FROM contracts WHERE status='Active'")->fetchColumn();
$kak=(int)$pdo->query("SELECT COUNT(*) FROM kak_documents WHERE status <> 'Cancelled'")->fetchColumn();
$drafts=(int)$pdo->query("SELECT COUNT(*) FROM contract_drafts WHERE status IN ('Draft','Review')")->fetchColumn();
$expiry=(int)$pdo->query("SELECT COUNT(*) FROM contracts WHERE status='Active' AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 90 DAY)")->fetchColumn();
$total=(float)$pdo->query("SELECT COALESCE(SUM(contract_value),0) FROM contracts WHERE status='Active'")->fetchColumn();
$cs=$pdo->query("SELECT status,COUNT(*) c FROM contracts GROUP BY status ORDER BY FIELD(status,'Active','Draft','Pending Approval','Expired','Closed')")->fetchAll();
$stageNames=['RFQ','Submission','Evaluation','Negotiation','Awarded']; $stageMap=['RFQ'=>'RFQ','Submission'=>'Review','Evaluation'=>'Evaluation','Negotiation'=>'Evaluation','Awarded'=>'Awarded']; $stageCounts=[];
foreach($stageNames as $s){$stageCounts[$s]=(int)$pdo->query("SELECT COUNT(*) FROM sourcing_requests WHERE status=".$pdo->quote($stageMap[$s]))->fetchColumn();}
$expiring=$pdo->query("SELECT c.contract_no,c.title,c.end_date,v.name vendor_name,DATEDIFF(c.end_date,CURDATE()) days_left FROM contracts c LEFT JOIN vendors v ON v.id=c.vendor_id WHERE c.status='Active' AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 90 DAY) ORDER BY c.end_date LIMIT 5")->fetchAll();
$overdue=[]; try{$overdue=$pdo->query("SELECT o.title,o.due_date,o.status,COALESCE(o.vendor_name,v.name,'-') vendor_name,DATEDIFF(CURDATE(),o.due_date) days_overdue FROM obligations o LEFT JOIN contracts c ON c.id=o.contract_id LEFT JOIN vendors v ON v.id=c.vendor_id WHERE (o.status='Overdue' OR (o.due_date<CURDATE() AND o.status<>'Completed')) ORDER BY o.due_date LIMIT 5")->fetchAll();}catch(Throwable $e){}
$vp=[]; try{$vp=$pdo->query("SELECT v.name,vp.score FROM vendor_performance vp JOIN vendors v ON v.id=vp.vendor_id WHERE vp.period_label='Current' ORDER BY vp.score DESC LIMIT 5")->fetchAll();}catch(Throwable $e){}
if(!$vp){$vp=$pdo->query("SELECT name,0 score FROM vendors WHERE status='Active' ORDER BY name LIMIT 5")->fetchAll();}
$approvalCount=0; try{$approvalCount=(int)$pdo->query("SELECT COUNT(*) FROM approvals WHERE status='Pending'")->fetchColumn();}catch(Throwable $e){}
$recent=[]; try{$recent=$pdo->query("SELECT contract_no ref_no,title,status,created_at FROM contracts ORDER BY id DESC LIMIT 4")->fetchAll();}catch(Throwable $e){}
$contractLabels=[];$contractVals=[];foreach($cs as $r){$contractLabels[]=$r['status'];$contractVals[]=(int)$r['c'];}
$stageVals=array_values($stageCounts);
?>
<div class="page-head dashboard-head"><div><h1>Dashboard</h1><p>Overview Sourcing &amp; Contract Management</p></div><div class="date-filter"><i class="bi bi-calendar3"></i><span><?=date('d M Y',strtotime('-30 days'))?> - <?=date('d M Y')?></span><i class="bi bi-chevron-down"></i></div></div>

<div class="kpi-grid dashboard-kpis mb-4">
 <?php $cards=[['bi-briefcase-fill','Active Contract',$contracts,'12%','up','blue'],['bi-file-earmark-arrow-up-fill','Sourcing Active',$sourcing,'10%','up','green'],['bi-people-fill','Vendors',$vendors,'5%','up','purple'],['bi-file-earmark-text-fill','Draft Kontrak',$drafts,'11%','down','orange'],['bi-clock-fill','Expiry < 90 Hari',$expiry,'16%','up','yellow'],['bi-database-fill','Contract Value','Rp '.number_format($total,0,',','.'),'18%','up','cyan']]; foreach($cards as $c):?>
 <div class="kpi-card modern-kpi"><div class="kpi-top"><div class="kpi-icon <?=$c[5]?>"><i class="bi <?=$c[0]?>"></i></div></div><div class="kpi-label"><?=$c[1]?></div><div class="kpi-value <?=strlen((string)$c[2])>14?'compact':''?>"><?=$c[2]?></div><div class="kpi-trend <?=$c[4]==='down'?'down':''?>"><i class="bi bi-arrow-<?=$c[4]==='down'?'down':'up'?>"></i> <?=$c[3]?> <span>vs last month</span></div><div class="sparkline <?=$c[5]?>"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
 <?php endforeach;?>
</div>

<div class="row g-4 mb-4">
 <div class="col-xl-6"><div class="card analytics-card h-100"><div class="card-head"><div><h3>Contract Status</h3><p>Distribusi status seluruh kontrak</p></div><button class="more-btn"><i class="bi bi-three-dots-vertical"></i></button></div><div class="contract-chart-layout"><div class="donut-wrap"><canvas id="contractChart"></canvas><div class="donut-center"><strong><?=$contracts?></strong><span>Total Active</span></div></div><div class="legend-list" id="contractLegend"></div></div></div></div>
 <div class="col-xl-6"><div class="card analytics-card h-100"><div class="card-head"><div><h3>Sourcing Status</h3><p>Pipeline procurement saat ini</p></div><button class="more-btn"><i class="bi bi-three-dots-vertical"></i></button></div><div class="bar-chart-wrap"><canvas id="sourcingChart"></canvas></div></div></div>
</div>

<div class="row g-4 mb-4">
 <div class="col-xl-4"><div class="card list-card h-100"><div class="card-head"><h3>Contract Expiring Soon</h3><a href="index.php?page=contract_monitoring">View All</a></div><div class="list-stack">
 <?php if($expiring): foreach($expiring as $r):?><div class="list-row"><div class="vendor-mini"><span class="vendor-logo"><?=strtoupper(substr($r['vendor_name']?:'V',0,2))?></span><div><strong><?=de($r['title'])?></strong><small><?=de($r['vendor_name']?:'-')?></small></div></div><div class="date-cell"><strong><?=date('d M Y',strtotime($r['end_date']))?></strong><span class="warning-pill">H-<?=max(0,(int)$r['days_left'])?></span></div></div><?php endforeach; else:?><div class="empty-state">Tidak ada kontrak yang jatuh tempo dalam 90 hari.</div><?php endif;?></div></div></div>
 <div class="col-xl-4"><div class="card list-card h-100"><div class="card-head"><h3>Overdue Obligations</h3><a href="index.php?page=obligations">View All</a></div><div class="list-stack">
 <?php if($overdue): foreach($overdue as $r):?><div class="list-row"><div class="obligation-title"><span class="danger-dot"></span><div><strong><?=de($r['title'])?></strong><small><?=de($r['vendor_name'])?></small></div></div><div class="date-cell overdue"><strong><?=date('d M Y',strtotime($r['due_date']))?></strong><span>Overdue <?=max(1,(int)$r['days_overdue'])?> Hari</span></div></div><?php endforeach; else:?><div class="empty-state success-empty"><i class="bi bi-check-circle"></i> Tidak ada obligation overdue.</div><?php endif;?></div></div></div>
 <div class="col-xl-4"><div class="card list-card h-100"><div class="card-head"><h3>Vendor Performance (Top 5)</h3><a href="index.php?page=vendor_performance">View All</a></div><div class="performance-list">
 <?php foreach($vp as $r):$score=(float)$r['score'];$pct=min(100,max(0,$score*20));?><div class="perf-row"><div class="perf-name"><?=de($r['name'])?></div><div class="perf-bar"><span style="width:<?=$pct?>%"></span></div><div class="perf-score"><?=number_format($score,2)?> <i class="bi bi-star-fill"></i></div></div><?php endforeach;?></div></div></div>
</div>

<div class="card ai-quick-card"><div class="ai-quick-head"><div><h3><i class="bi bi-stars"></i> AI Copilot - Quick Actions <span class="mini-beta">BETA</span></h3></div><button class="copilot-float" data-bs-toggle="modal" data-bs-target="#aiCopilotModal"><span>🤖</span><b></b></button></div><div class="ai-quick-grid">
 <button class="ai-quick" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" data-ai-open="generate_kak"><i class="bi bi-stars yellow-i"></i><div><strong>Generate KAK</strong><small>Buat KAK dengan AI</small></div></button>
 <button class="ai-quick" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" data-ai-open="review_kak"><i class="bi bi-search blue-i"></i><div><strong>Review KAK</strong><small>Analisis kelengkapan</small></div></button>
 <button class="ai-quick" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" data-ai-open="vendor_analysis"><i class="bi bi-bar-chart-line green-i"></i><div><strong>Analisis Vendor</strong><small>Bandingkan vendor</small></div></button>
 <button class="ai-quick" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" data-ai-open="contract_risk"><i class="bi bi-shield-check purple-i"></i><div><strong>Contract Risk Scanner</strong><small>Analisis risiko kontrak</small></div></button>
 <button class="ai-quick" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" data-ai-open="email"><i class="bi bi-envelope orange-i"></i><div><strong>Buat Email</strong><small>Email ke vendor</small></div></button>
 <button class="ai-quick" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" data-ai-open="chat"><i class="bi bi-chat-dots cyan-i"></i><div><strong>Tanya AI</strong><small>Tanya apa saja</small></div></button>
 </div></div>

<script>
window.contractData=<?=json_encode($cs)?>;
window.contractLabels=<?=json_encode($contractLabels)?>;window.contractVals=<?=json_encode($contractVals)?>;
window.sourcingLabels=<?=json_encode($stageNames)?>;window.sourcingVals=<?=json_encode($stageVals)?>;
window.approvalCount=<?=$approvalCount?>;
</script>
