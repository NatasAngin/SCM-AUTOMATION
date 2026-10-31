<?php
session_start(); require_once __DIR__.'/config/database.php';
if(!isset($_SESSION['user'])){header('Location: login.php');exit;}
$page=$_GET['page']??'dashboard';
$allowed=['dashboard','vendors','sourcing','kak','contract_draft','contracts','obligations','change_order','approval','vendor_performance','contract_monitoring','reports','autopilot','ai_settings','settings','help'];
if(!in_array($page,$allowed,true))$page='dashboard';
include __DIR__.'/views/header.php';
include __DIR__."/views/$page.php";
include __DIR__.'/views/footer.php';
