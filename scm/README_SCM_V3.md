# SCM Enterprise V3 Auto-Pilot

Upgrade dari SCM Procurement KAK/Draft Contract V2.

## Fitur
- Sourcing -> KAK -> Vendor -> Draft Contract -> Contract.
- KAK Generator dengan form lengkap dan preview/cetak ke PDF melalui **Print -> Save as PDF**.
- Contract Generator dengan referensi KAK dan Vendor, preview/cetak ke PDF.
- Contract expiry monitoring H-90, H-60, H-30, H-14.
- Contract obligation monitoring.
- Notification & audit-trail foundation.
- Auto-Pilot dashboard.
- Tetap berdiri sendiri; **tidak terhubung ke CAPA**.

## Instalasi
1. Backup database `scm_v1`.
2. Import `database/scm_v3_upgrade.sql` melalui phpMyAdmin.
3. Copy folder `scm` ke `C:\xampp\htdocs\`.
4. Start Apache dan MySQL.
5. Buka `http://localhost/scm/`.
6. Masuk menu **KAK / TOR** untuk membuat KAK.
7. Masuk menu **Draft Kontrak** untuk membuat kontrak dari KAK + Vendor.
8. Gunakan tombol **Lihat/Cetak** atau **Preview**, lalu pilih **Save as PDF** pada dialog print browser.
9. Menu **Auto-Pilot** menampilkan kontrak yang akan berakhir dalam 90 hari dan obligation terbuka.

> Catatan: dokumen kontrak merupakan draft/template sistem dan wajib direview oleh Procurement/Legal serta pejabat berwenang sebelum digunakan sebagai kontrak final.
