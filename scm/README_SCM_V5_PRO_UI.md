# SCM Enterprise V5 — Professional Procurement Workspace

Versi ini melanjutkan SCM V4 Local AI Auto Setup dengan redesign UI/UX enterprise.

## Menu
- Dashboard
- Sourcing
- KAK / TOR
- Vendors
- Draft Kontrak
- Contracts
- Auto-Pilot
- AI Copilot
- Logout

## Upgrade UI
- Sidebar enterprise dark dengan active state
- Topbar dengan system status dan user
- Executive dashboard hero
- KPI cards
- Contract/Sourcing analytics
- Contract portfolio summary
- Recent activity
- Quick actions
- Responsive tablet/mobile
- KAK dan Contract generator tetap mempertahankan modal scrollable
- AI Copilot tetap tersedia dan terhubung ke endpoint lokal Ollama

## Instalasi
1. Backup folder SCM lama.
2. Extract folder `scm` ke `C:\xampp\htdocs\`.
3. Pastikan database SCM sebelumnya tetap digunakan.
4. Start Apache + MySQL.
5. Buka `http://localhost/scm/`.
6. Jika memakai Local AI, jalankan `INSTALL_AI_AUTO.bat` satu kali pada komputer/server.

## Catatan
SCM tetap standalone dan tidak digabungkan dengan CAPA.
