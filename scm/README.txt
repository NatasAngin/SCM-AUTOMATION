SCM Procurement Management - KAK & Draft Contract Upgrade
===========================================================
Modules:
- Dashboard
- Sourcing Request
- Vendor Management
- KAK / TOR: create, save, review status, preview/print PDF, and download Microsoft Word (.docx) formatted from the PT BAI KAK reference document
- Draft Kontrak: link KAK + vendor, create commercial/technical clauses, preview and print
- Existing Contract Management

INSTALL:
1. Extract folder "scm" into C:\xampp\htdocs\
2. Start Apache and MySQL in XAMPP.
3. Open phpMyAdmin and import database/scm_v1.sql.
   IMPORTANT: if you already have scm_v1 from the previous version, run the CREATE TABLE IF NOT EXISTS statements at the bottom of this SQL file, or re-import after backup.
4. Open http://localhost/scm/
5. Login demo: admin / admin123

FLOW:
Sourcing -> KAK/TOR -> Vendor -> Draft Kontrak -> Review/Approval -> Contract Final.
Draft contract is a working draft and must be reviewed by authorized procurement/legal personnel before signing.

KAK WORD EXPORT NOTES:
- Export button is available beside each saved KAK under the KAK module.
- The generator uses the included templates/kak_reference_template.docx to preserve the reference document package/styles.
- Ensure PHP ZipArchive is enabled in XAMPP (php.ini: extension=zip).
- Review and complete all generated content before official use; the generated file is a draft.

CHANGELOG (penyempurnaan)
- kak_docx.php: tabel Word kini memiliki tblGrid & shading valid (mencegah pesan "file corrupt" di Word), file sementara ZipArchive aman untuk PHP 8, huruf kapital UTF-8 (mb_strtoupper), tabel tanda tangan 3 kolom + ruang tanda tangan (sama dengan preview PDF).
- views/kak.php: Jenis Pengadaan wajib dipilih (sebelumnya otomatis jadi "Konsultan"), nomor KAK berikutnya berbasis nomor terbesar (bukan COUNT), duplikasi No. KAK ditangani dengan pesan jelas, pesan error di-escape.
- login.php / logout.php: session id diregenerasi saat login, hash password tidak lagi disimpan di session, cookie session dihapus saat logout.
- .gitignore: marker konflik merge (<<<<<<< / >>>>>>>) dibersihkan.
- PENTING sebelum produksi: ganti password admin/admin123 dan hapus teks "Demo: admin / admin123" dari login.php.
