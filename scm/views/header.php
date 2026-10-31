<?php
$currentPage=$_GET['page']??'dashboard';
$userName=$_SESSION['user']['full_name'] ?? $_SESSION['user']['username'] ?? 'User';
$userRole=$_SESSION['user']['role'] ?? 'Administrator';
function navActive($page,$current){return $page===$current?'active':'';}
function h($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function de($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
$initial=strtoupper(substr(trim((string)$userName),0,1));
?>
<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SCM Procurement V4.0</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="public/css/app.css?v=6.1"><script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4"></script></head>
<body>
<div class="scm-shell">
<aside class="sidebar" id="sidebar">
  <div class="brand"><div class="brand-mark cube-mark"><span></span><i class="bi bi-box-seam"></i></div><div><div class="brand-title">SCM</div><div class="brand-sub">PROCUREMENT</div></div></div>
  <div class="side-scroll">
  <div class="side-label">MAIN MENU</div>
  <nav class="side-nav">
    <a class="<?=navActive('dashboard',$currentPage)?>" href="index.php?page=dashboard"><i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span></a>
  </nav>
  <div class="side-label">MANAGEMENT</div>
  <nav class="side-nav">
    <a class="<?=navActive('sourcing',$currentPage)?>" href="index.php?page=sourcing"><i class="bi bi-box-seam"></i><span>Sourcing</span></a>
    <a class="<?=navActive('kak',$currentPage)?>" href="index.php?page=kak"><i class="bi bi-file-earmark-check"></i><span>KAK / TOR</span></a>
    <a class="<?=navActive('vendors',$currentPage)?>" href="index.php?page=vendors"><i class="bi bi-people-fill"></i><span>Vendors</span></a>
    <a class="<?=navActive('contract_draft',$currentPage)?>" href="index.php?page=contract_draft"><i class="bi bi-file-earmark-text"></i><span>Draft Kontrak</span></a>
    <a class="<?=navActive('contracts',$currentPage)?>" href="index.php?page=contracts"><i class="bi bi-file-earmark-check-fill"></i><span>Contracts</span></a>
    <a class="<?=navActive('obligations',$currentPage)?>" href="index.php?page=obligations"><i class="bi bi-clipboard-check"></i><span>Obligations</span></a>
    <a class="<?=navActive('change_order',$currentPage)?>" href="index.php?page=change_order"><i class="bi bi-arrow-repeat"></i><span>Change Order</span></a>
    <a class="<?=navActive('approval',$currentPage)?>" href="index.php?page=approval"><i class="bi bi-patch-check"></i><span>Approval</span><b class="nav-badge badge-count" id="approvalBadge">0</b></a>
  </nav>
  <div class="side-label">ANALYTICS</div>
  <nav class="side-nav">
    <a class="<?=navActive('vendor_performance',$currentPage)?>" href="index.php?page=vendor_performance"><i class="bi bi-bar-chart-fill"></i><span>Vendor Performance</span></a>
    <a class="<?=navActive('contract_monitoring',$currentPage)?>" href="index.php?page=contract_monitoring"><i class="bi bi-display"></i><span>Contract Monitoring</span></a>
    <a class="<?=navActive('reports',$currentPage)?>" href="index.php?page=reports"><i class="bi bi-file-earmark-bar-graph"></i><span>Reports & Analytics</span></a>
  </nav>
  <div class="side-label">AUTOMATION & AI</div>
  <nav class="side-nav">
    <a href="#" data-bs-toggle="modal" data-bs-target="#aiCopilotModal" class="ai-link"><i class="bi bi-stars"></i><span>AI Copilot</span><b class="nav-new">NEW</b></a>
    <a class="<?=navActive('autopilot',$currentPage)?>" href="index.php?page=autopilot"><i class="bi bi-lightning-charge-fill"></i><span>Auto-Pilot</span><b class="nav-badge badge-count">3</b></a>
    <a class="<?=navActive('ai_settings',$currentPage)?>" href="index.php?page=ai_settings"><i class="bi bi-cpu"></i><span>AI Settings</span></a>
  </nav>
  <div class="side-label">SYSTEM</div>
  <nav class="side-nav">
    <a class="<?=navActive('settings',$currentPage)?>" href="index.php?page=settings"><i class="bi bi-gear"></i><span>Settings</span></a>
    <a class="<?=navActive('help',$currentPage)?>" href="index.php?page=help"><i class="bi bi-question-circle"></i><span>Help Center</span></a>
  </nav>
  </div>
  <div class="sidebar-footer">
    <div class="side-version">SCM Procurement V4.0<br><span>© 2025 All rights reserved.</span></div>
    <a class="logout-link" href="logout.php"><i class="bi bi-box-arrow-right"></i><span>Logout</span></a>
  </div>
</aside>
<main class="main-area">
  <nav class="topbar">
    <div class="top-left"><button class="sidebar-toggle" id="sidebarToggle" type="button"><i class="bi bi-list"></i></button><div><strong>Sourcing &amp; Contract Management</strong><small>Procurement Workspace</small></div></div>
    <div class="top-actions">
      <button class="icon-btn theme-btn" id="themeToggle" type="button" title="Ubah tema" aria-label="Ubah tema" aria-pressed="false"><i class="bi bi-sun"></i></button>
      <button class="icon-btn notif-btn" id="notificationToggle" type="button" title="Notifikasi" aria-label="Buka notifikasi" aria-expanded="false"><i class="bi bi-bell"></i><span id="notificationBadge">3</span></button>
      <div class="top-divider"></div>
      <button class="top-profile" id="profileToggle" type="button" aria-label="Buka menu pengguna" aria-expanded="false"><div class="avatar top-avatar"><?=h($initial)?></div><div><strong><?=h($userName)?></strong><small><?=h($userRole)?></small></div><i class="bi bi-chevron-down"></i></button>
      <div class="notification-panel" id="notificationPanel" aria-hidden="true">
        <div class="notification-head"><strong>Notifikasi</strong><button type="button" id="markNotificationsRead">Tandai semua dibaca</button></div>
        <div id="notificationList">
          <div class="notification-item"><div class="notification-icon danger"><i class="bi bi-exclamation-triangle"></i></div><div><strong>Kontrak mendekati expiry</strong><small>1 kontrak akan berakhir dalam kurang dari 90 hari.</small></div></div>
          <div class="notification-item"><div class="notification-icon warning"><i class="bi bi-clock-history"></i></div><div><strong>Obligation jatuh tempo</strong><small>Ada kewajiban vendor yang perlu ditindaklanjuti.</small></div></div>
          <div class="notification-item"><div class="notification-icon"><i class="bi bi-check2-circle"></i></div><div><strong>Approval menunggu review</strong><small>Periksa approval yang masih berstatus pending.</small></div></div>
        </div>
        <div class="notification-empty d-none" id="notificationEmpty">Tidak ada notifikasi baru.</div>
      </div>
      <div class="user-menu" id="userMenu" aria-hidden="true">
        <div class="user-menu-head"><strong><?=h($userName)?></strong><small><?=h($userRole)?></small></div>
        <a href="index.php?page=settings"><i class="bi bi-person-gear"></i> Profile & Settings</a>
        <a href="index.php?page=help"><i class="bi bi-question-circle"></i> Help Center</a>
        <a class="danger" href="logout.php"><i class="bi bi-box-arrow-right"></i> Logout</a>
      </div>
    </div>
  </nav>
  <div class="content-wrap">
