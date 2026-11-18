# ShuttleCluster — Keputusan Produk

> Dokumen ini adalah sumber kebenaran untuk keputusan produk. Jika berbeda dengan dokumen lain, dokumen ini yang berlaku.

## 1. Tujuan

Mengelompokkan pemain bulu tangkis berdasarkan tingkat performa pertandingan menggunakan algoritma **K-Means Clustering**. Fokus awal tunggal putra, tetapi aplikasi dirancang agar bisa dipakai untuk kategori lain (tunggal putri, ganda putra, ganda putri, ganda campuran).

## 2. Status

Basis aplikasi sudah dibersihkan dari template sebelumnya (dashboard asuransi multi-tenant). Yang tersisa:

- **Auth:** login email + password, session di database + cookie `httpOnly`, logout, refresh session, kunci akun setelah 5 kali gagal login.
- **Akun:** profil (nama), preferensi bahasa (id/en), info keamanan. Ganti password tersedia di API tetapi dinonaktifkan lewat `AUTH_CONFIG.passwordChangeEnabled`.
- **Pemain & pertandingan:** `/players` dan `/matches` (lihat semua user; tambah/ubah/hapus khusus admin). Unit yang bertanding (pemain tunggal atau pasangan) disimpan di `entries` dan dibuat otomatis saat pertandingan dicatat — unit inilah yang nanti di-cluster.
- **Kategori (UI saja):** `/categories` menampilkan lima kategori BWF; `/categories/[kode]` menampilkan tiga tingkat performa hasil clustering (masih kosong). Definisi kategori dan tingkat ada di `src/lib/badminton/categories.ts`.
- **Pengguna (khusus admin):** `/users` — tambah akun, ubah role, nonaktifkan/aktifkan, reset password.
- **Shell dashboard:** sidebar, header (bahasa, tema, layout, menu akun), skeleton loading, `DataTable` server-side, kit import CSV/XLSX, grafik (Recharts).
- **Audit log:** aksi auth, profil, dan kelola pengguna ditulis ke `audit_logs` (belum ada UI).

Tidak ada multi-tenant. Akses diatur dengan dua role (§3). Akun admin pertama dibuat lewat seed (`ADMIN_EMAIL` / `ADMIN_PASSWORD`); akun lain dibuat admin di `/users`.

## 3. Keputusan yang sudah diambil

- Single-tenant.
- Dua role, disimpan di `users.role`:

  | Role | Akses |
  |---|---|
  | **admin** | Semua yang bisa dilakukan user, ditambah kelola pengguna. Nanti juga: kelola data pemain/pertandingan dan menjalankan clustering. |
  | **user** | Akses biasa: dasbor, akun sendiri, dan (nanti) melihat hasil clustering. |

  Aturan kelola pengguna: admin tidak bisa mengubah role/status/password dirinya sendiri lewat `/users`, minimal satu admin aktif harus tersisa, menonaktifkan akun mencabut semua session-nya, dan reset password membuka kunci login.
- Akun dibuat langsung oleh admin (tanpa register publik, tanpa undangan).
- Lima kategori BWF; clustering dijalankan per kategori, dan di ganda unit yang dikelompokkan adalah pasangan:

  | Kode | Kategori | Unit yang bertanding |
  |---|---|---|
  | MS | Tunggal putra | 1 pemain |
  | WS | Tunggal putri | 1 pemain |
  | MD | Ganda putra | Pasangan 2 putra |
  | WD | Ganda putri | Pasangan 2 putri |
  | XD | Ganda campuran | Pasangan 1 putra + 1 putri |

- **Sumber data:** [SahilMotyar/bwf-match-data](https://github.com/SahilMotyar/bwf-match-data) (hasil pertandingan elite BWF 2007–2026, skor per game), diimport dengan `bun run db:import-bwf`. Fitur performa dihitung sistem dari hasil pertandingan. Dataset tidak punya gender & negara pemain: gender diturunkan dari kategori (XD dari pasangannya), negara dibiarkan kosong.
- Pertandingan divalidasi dengan aturan BWF (`src/lib/badminton/match-rules.ts`): game selesai di 21 dengan selisih 2 atau di 30 (30-29), best of 3, game 3 hanya bila 1-1. Jumlah & gender pemain tiap sisi harus sesuai kategori. Retired/walkover boleh punya game terakhir yang belum selesai, dengan pemenang diisi manual.
- K = 3 dengan label diurutkan dari centroid: **Dominan** (tinggi), **Kompetitif** (sedang), **Berkembang** (rendah).
- UI dan pesan API dalam bahasa Indonesia (default) dan Inggris.
- Stack tetap: Next.js 16, Prisma 7 + Neon, Bun, Biome, deploy ke Vercel.

## 4. Pertanyaan terbuka (fitur clustering)

- **Fitur performa:** mis. win rate, rasio game menang, rata-rata selisih poin per game, win rate rubber game.
- **Normalisasi:** min-max atau z-score.
- **Validasi K = 3:** tampilkan Elbow (WCSS) dan Silhouette sebagai pembenaran nilai K?
- **Transparansi:** perlu menampilkan langkah perhitungan (data mentah, normalisasi, iterasi centroid) dan ekspor hasil?
