document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.getElementById('sidebarToggle'), side=document.getElementById('sidebar');
 if(toggle&&side) toggle.addEventListener('click',()=>side.classList.toggle('open'));
 if(window.Chart){
  const c=document.getElementById('contractChart');
  if(c){const labels=window.contractLabels||[];const vals=window.contractVals||[];new Chart(c,{type:'doughnut',data:{labels,datasets:[{data:vals,backgroundColor:['#1769e8','#18ad60','#f5b51b','#ff6b35','#6d3be8','#7b8aa3'],borderWidth:2,borderColor:'#fff',hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'64%',plugins:{legend:{display:false},tooltip:{padding:10}}}});const legend=document.getElementById('contractLegend');if(legend){const cols=['#1769e8','#18ad60','#f5b51b','#ff6b35','#6d3be8','#7b8aa3'];const total=vals.reduce((a,b)=>a+b,0)||1;legend.innerHTML=labels.map((l,i)=>`<div class="legend-item"><span class="legend-dot" style="background:${cols[i%cols.length]}"></span><span>${l}</span><strong>${vals[i]} <small>(${Math.round(vals[i]/total*100)}%)</small></strong></div>`).join('')}}
  const s=document.getElementById('sourcingChart');
  if(s){new Chart(s,{type:'bar',data:{labels:window.sourcingLabels||[],datasets:[{data:window.sourcingVals||[],backgroundColor:['#1769e8','#18ad60','#f5b51b','#ff6b35','#6d3be8'],borderRadius:5,maxBarThickness:48}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{beginAtZero:true,grid:{color:'#edf1f5'},ticks:{font:{size:10},stepSize:1}}}}});}
 }
 const status=document.getElementById('aiStatus');
 const model=document.getElementById('aiModel');
 async function checkAI(){if(!status)return;status.className='badge ai-offline mt-2';status.textContent='AI OFFLINE';try{const r=await fetch('api/ai.php?action=status',{cache:'no-store'});const j=await r.json();if(j.online){status.className='badge ai-online mt-2';status.textContent='AI ONLINE'}}catch(e){}}
 checkAI();
 const send=document.getElementById('aiSend'), input=document.getElementById('aiInput'), result=document.getElementById('aiResult'), intro=document.getElementById('aiIntro');
 document.querySelectorAll('[data-ai-action]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-ai-action]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const actions={chat:'Bantu saya memahami kebutuhan procurement ini.',generate_kak:'Buat draft KAK/TOR berdasarkan kebutuhan pengadaan berikut.',review_kak:'Review KAK berikut dan identifikasi kekurangan, risiko, serta perbaikannya.',vendor_analysis:'Analisis dan bandingkan vendor berdasarkan data berikut.',contract_risk:'Scan kontrak berikut dan identifikasi risiko serta klausul yang perlu diperbaiki.',email:'Buat email profesional kepada vendor berdasarkan konteks berikut.'};input.value=actions[b.dataset.aiAction]||'';input.focus()}));
 document.querySelectorAll('[data-ai-open]').forEach(b=>b.addEventListener('click',()=>{setTimeout(()=>{const target=document.querySelector(`[data-ai-action="${b.dataset.aiOpen}"]`);if(target)target.click()},80)}));
 if(send&&input)send.addEventListener('click',async()=>{const prompt=input.value.trim();if(!prompt)return;send.disabled=true;send.textContent='Memproses...';intro?.classList.add('d-none');result?.classList.remove('d-none');if(result)result.textContent='AI sedang menganalisis...';try{const r=await fetch('api/ai.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,model:model?.value||'qwen3:4b'})});const j=await r.json();if(result)result.textContent=j.answer||j.error||'Tidak ada respons AI.'}catch(e){if(result)result.textContent='AI belum terhubung. Pastikan Ollama berjalan dan model sudah tersedia.'}finally{send.disabled=false;send.textContent='✨ Jalankan AI';checkAI()}});
});

// Global header interactions: theme, notifications and user menu
(function(){
 const root=document.documentElement;
 const themeBtn=document.getElementById('themeToggle');
 const notifBtn=document.getElementById('notificationToggle');
 const notifPanel=document.getElementById('notificationPanel');
 const profileBtn=document.getElementById('profileToggle');
 const userMenu=document.getElementById('userMenu');
 const badge=document.getElementById('notificationBadge');
 const markRead=document.getElementById('markNotificationsRead');
 const notifList=document.getElementById('notificationList');
 const notifEmpty=document.getElementById('notificationEmpty');
 function applyTheme(dark){
   root.classList.toggle('theme-dark',dark);
   if(themeBtn){themeBtn.setAttribute('aria-pressed',dark?'true':'false');themeBtn.title=dark?'Gunakan tema terang':'Gunakan tema malam';themeBtn.innerHTML=`<i class="bi ${dark?'bi-moon-stars-fill':'bi-sun'}"></i>`;}
   try{localStorage.setItem('scm_theme',dark?'dark':'light')}catch(e){}
 }
 let dark=false;try{dark=localStorage.getItem('scm_theme')==='dark'}catch(e){}
 applyTheme(dark);
 themeBtn?.addEventListener('click',e=>{e.preventDefault();applyTheme(!root.classList.contains('theme-dark'));closeMenus('theme')});
 function closeMenus(except){
   if(except!=='notif'){notifPanel?.classList.remove('show');notifBtn?.setAttribute('aria-expanded','false');notifPanel?.setAttribute('aria-hidden','true')}
   if(except!=='profile'){userMenu?.classList.remove('show');profileBtn?.setAttribute('aria-expanded','false');userMenu?.setAttribute('aria-hidden','true')}
 }
 notifBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=!notifPanel.classList.contains('show');closeMenus('notif');notifPanel.classList.toggle('show',open);notifBtn.setAttribute('aria-expanded',open?'true':'false');notifPanel.setAttribute('aria-hidden',open?'false':'true')});
 profileBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=!userMenu.classList.contains('show');closeMenus('profile');userMenu.classList.toggle('show',open);profileBtn.setAttribute('aria-expanded',open?'true':'false');userMenu.setAttribute('aria-hidden',open?'false':'true')});
 markRead?.addEventListener('click',e=>{e.preventDefault();if(notifList)notifList.classList.add('d-none');notifEmpty?.classList.remove('d-none');if(badge){badge.textContent='0';badge.style.display='none'}try{localStorage.setItem('scm_notifications_read','1')}catch(err){}});
 try{if(localStorage.getItem('scm_notifications_read')==='1'){if(notifList)notifList.classList.add('d-none');notifEmpty?.classList.remove('d-none');if(badge)badge.style.display='none'}}catch(e){}
 document.addEventListener('click',e=>{if(!e.target.closest('.top-actions'))closeMenus();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus();});
})();
