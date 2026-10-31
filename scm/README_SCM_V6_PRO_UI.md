# SCM Procurement V6 PRO UI

SCM standalone — tidak digabung dengan CAPA.

## UI
Dashboard mengikuti konsep enterprise procurement pada reference design:
- Sidebar: Dashboard, Sourcing, KAK/TOR, Vendors, Draft Kontrak, Contracts
- Management: Obligations, Change Order, Approval
- Analytics: Vendor Performance, Contract Monitoring, Reports & Analytics
- Automation & AI: AI Copilot, Auto-Pilot, AI Settings
- System: Settings, Help Center, Logout
- KPI cards, Contract Status donut, Sourcing Status bar, Expiry monitoring, Overdue Obligations, Vendor Performance, AI Copilot Quick Actions.

## New V6 features
- Obligation tracker + add obligation form
- Change Order register + add form
- Approval Center + approve/reject action
- Vendor Performance dashboard
- Contract Monitoring
- Reports & Analytics
- AI Settings
- Settings and Help Center
- Local AI Copilot retained
- Supporting tables are auto-created by config/database.php

## Install
1. Backup SCM lama.
2. Extract folder `scm` ke `C:\xampp\htdocs\`.
3. Pastikan MySQL dan Apache aktif.
4. Jika instalasi pertama, import `database/scm_v1.sql` melalui phpMyAdmin.
5. Buka `http://localhost/scm/`.
6. Untuk Local AI, jalankan `INSTALL_AI_AUTO.bat` lalu buka AI Copilot.

## AI
Default model: `qwen3:4b` melalui Ollama pada `localhost:11434`.
AI bersifat optional; SCM tetap berjalan bila Ollama offline.
