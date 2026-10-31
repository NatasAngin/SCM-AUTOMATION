  </div>
</main></div>

<div class="modal fade" id="aiCopilotModal" tabindex="-1" aria-hidden="true">
 <div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content ai-modal">
  <div class="modal-header"><div><div class="eyebrow">AUTOMATION & AI</div><h4 class="fw-bold mb-1"><i class="bi bi-stars"></i> AI Copilot <span class="mini-beta">BETA</span></h4><div class="small-muted">Assistant lokal untuk mempercepat pekerjaan procurement.</div></div><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
  <div class="modal-body p-0"><div class="ai-layout"><div class="ai-actions p-3">
    <div class="small-muted fw-bold mb-2">QUICK ACTIONS</div>
    <button class="ai-action active" data-ai-action="chat"><i class="bi bi-chat-dots me-2"></i>Tanya AI</button>
    <button class="ai-action" data-ai-action="generate_kak"><i class="bi bi-file-earmark-plus me-2"></i>Generate KAK</button>
    <button class="ai-action" data-ai-action="review_kak"><i class="bi bi-search me-2"></i>Review KAK</button>
    <button class="ai-action" data-ai-action="vendor_analysis"><i class="bi bi-bar-chart-line me-2"></i>Analisis Vendor</button>
    <button class="ai-action" data-ai-action="contract_risk"><i class="bi bi-shield-exclamation me-2"></i>Contract Risk Scanner</button>
    <button class="ai-action" data-ai-action="email"><i class="bi bi-envelope me-2"></i>Buat Email</button>
    <div class="ai-model-box mt-4"><label class="small-muted fw-bold">MODEL</label><select id="aiModel" class="form-select form-select-sm mt-1"><option value="qwen3:4b">Qwen3 4B</option></select><div id="aiStatus" class="badge ai-offline mt-2">AI OFFLINE</div></div>
  </div><div class="ai-chat p-4"><div id="aiIntro" class="ai-intro"><div class="ai-big">🤖</div><h5 class="fw-bold">Apa yang bisa saya bantu?</h5><p class="text-muted">Generate dokumen, review KAK, analisis vendor, scan risiko kontrak, atau bantu komunikasi vendor.</p></div><div id="aiResult" class="ai-result d-none"></div><div class="ai-input-wrap"><textarea id="aiInput" class="form-control" placeholder="Contoh: Pengadaan jasa maintenance conveyor selama 12 bulan..."></textarea><div class="d-flex justify-content-between align-items-center mt-2"><small class="text-muted">Local AI melalui Ollama • keputusan final tetap pada tim SCM.</small><button id="aiSend" class="btn btn-primary px-4">✨ Jalankan AI</button></div></div></div></div></div>
 </div></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script><script src="public/js/app.js"></script></body></html>
