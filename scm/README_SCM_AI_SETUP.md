# SCM Local AI Copilot — Setup

## Arsitektur
Browser → XAMPP/PHP → `api/ai.php` → Ollama (`127.0.0.1:11434`) → Qwen3.

AI bersifat optional. SCM tetap berjalan ketika Ollama offline.

## 1. Install Ollama
Download **Ollama untuk Windows** dari situs resminya: https://ollama.com/download/windows

Ollama menyediakan API lokal di `http://localhost:11434` saat berjalan. Dokumentasi resmi juga menunjukkan endpoint `/api/chat`.

## 2. Download model gratis
Buka PowerShell atau CMD:

```text
ollama pull qwen3:4b
```

Model `qwen3:4b` pada katalog resmi Ollama berukuran sekitar 2.5 GB. Untuk komputer dengan RAM lebih besar, versi 8B dapat dipertimbangkan kemudian.

## 3. Tes model

```text
ollama run qwen3:4b
```

Lalu ketik:

```text
Buatkan contoh KAK pengadaan jasa maintenance conveyor selama 12 bulan.
```

Jika AI menjawab, Ollama siap.

## 4. Pasang SCM
Extract ZIP ini ke:

`C:\xampp\htdocs\scm`

Replace file project lama. Tidak perlu import database untuk fitur AI Copilot ini.

## 5. Pastikan PHP cURL aktif
Buka:

`C:\xampp\php\php.ini`

Cari:

`extension=curl`

Jika masih diawali `;`, hapus `;` lalu restart Apache.

Jika cURL tidak tersedia, endpoint memiliki fallback HTTP PHP, tetapi cURL lebih direkomendasikan.

## 6. Jalankan
Start Apache + MySQL di XAMPP, lalu buka:

`http://localhost/scm/`

Login → menu **🤖 AI Copilot**.

Status harus berubah menjadi **AI ONLINE**.

## 7. Jika AI OFFLINE
Di CMD jalankan:

```text
ollama list
```

Pastikan ada:

`qwen3:4b`

Lalu:

```text
ollama serve
```

Jika Ollama sudah menjadi background service, tidak perlu menjalankan `serve` secara manual.

Tes API:

```text
curl http://localhost:11434/api/tags
```

Jika muncul JSON daftar model, koneksi SCM → Ollama tersedia.

## Fitur V1
- Tanya AI
- Generate KAK
- Review KAK
- Analisis Vendor
- Contract Risk
- Email Procurement
- AI Online/Offline indicator

## Governance
AI tidak boleh otomatis memilih vendor, menyetujui KAK, menyetujui kontrak, atau memberikan legal approval. Output AI harus direview manusia.
