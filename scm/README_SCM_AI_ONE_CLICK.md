# SCM Enterprise V4 — Local AI One-Click

## Tujuan
Paket ini membuat instalasi SCM + Local AI sesederhana mungkin.

### Setelah ZIP diekstrak
1. Salin folder `scm` ke `C:\xampp\htdocs\`.
2. Jalankan `INSTALL_AI_AUTO.bat` sekali sebagai Administrator bila Windows meminta izin.
3. Script akan mendeteksi/install Ollama, mengunduh model `qwen3:4b`, memastikan API lokal aktif, dan melakukan pengecekan.
4. Jalankan Apache + MySQL di XAMPP.
5. Buka `http://localhost/scm/` atau jalankan `START_SCM.bat`.

## Kenapa model tidak ditempel langsung ke folder htdocs?
Model LLM berukuran GB dan membutuhkan runtime inferensi. PHP/XAMPP sendiri tidak menjalankan model LLM. Karena itu paket ini memakai Ollama sebagai runtime lokal dan SCM hanya mengakses API lokalnya. Ollama menyediakan API lokal di `http://localhost:11434` dan berjalan sebagai aplikasi Windows/background service. Lihat situs resmi Ollama untuk installer dan dokumentasi.

## Internet
Internet hanya diperlukan saat instalasi pertama untuk memasang Ollama dan mengambil model. Setelah model sudah ada di komputer, pemakaian AI dasar dapat dilakukan secara lokal tanpa mengirim prompt ke cloud.

## Catatan keamanan
AI hanya menjadi copilot. Jangan izinkan AI melakukan approval final, memilih vendor secara otomatis, atau memberikan legal approval.
