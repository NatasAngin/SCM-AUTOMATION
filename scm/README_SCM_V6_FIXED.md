# SCM Procurement V6 - FIXED / STABLE

Versi ini memperbaiki bug fatal `Cannot redeclare de()` yang terjadi karena helper didefinisikan ulang pada `dashboard.php` dan `header.php`.

## Perbaikan utama
- Helper PHP terpusat di `views/header.php` agar tidak redeclare.
- `dashboard.php` dan `kak.php` tidak lagi mendefinisikan helper duplikat.
- Database bootstrap dibuat lebih resilient: database `scm_v1` dan tabel inti/V6 dibuat otomatis jika belum tersedia.
- Seed demo hanya dibuat saat database masih kosong; data existing tidak ditimpa.
- Semua file PHP sudah lolos `php -l`.
- UI enterprise V6 dan Local AI tetap dipertahankan.

## Instalasi
1. Backup folder SCM lama.
2. Extract folder `scm` ke `C:\xampp\htdocs\`.
3. Start Apache dan MySQL di XAMPP.
4. Buka `http://localhost/scm/`.
5. Jika database kosong, sistem akan bootstrap otomatis (dengan asumsi MySQL user memiliki izin CREATE DATABASE/TABLE).
6. Login default instalasi baru: `admin` / `admin123`.

## Local AI
Jalankan `INSTALL_AI_AUTO.bat` untuk menyiapkan Ollama + Qwen3 4B. AI bersifat optional.
