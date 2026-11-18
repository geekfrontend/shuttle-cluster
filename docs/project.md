# ShuttleCluster — Keputusan Produk

> Dokumen ini adalah sumber kebenaran untuk keputusan produk. Jika berbeda dengan dokumen lain, dokumen ini yang berlaku.

## 1. Tujuan

Mengelompokkan pemain bulu tangkis berdasarkan tingkat performa pertandingan menggunakan algoritma **K-Means Clustering**. Fokus awal tunggal putra, tetapi aplikasi dirancang agar bisa dipakai untuk kategori lain (tunggal putri, ganda putra, ganda putri, ganda campuran).

## 2. Status

Basis aplikasi sudah dibersihkan dari template sebelumnya (dashboard asuransi multi-tenant). Yang tersisa:

- **Auth:** login email + password, session di database + cookie `httpOnly`, logout, refresh session, kunci akun setelah 5 kali gagal login.
- **Akun:** profil (nama), preferensi bahasa (id/en), info keamanan. Ganti password tersedia di API tetapi dinonaktifkan lewat `AUTH_CONFIG.passwordChangeEnabled`.
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
- UI dan pesan API dalam bahasa Indonesia (default) dan Inggris.
- Stack tetap: Next.js 16, Prisma 7 + Neon, Bun, Biome, deploy ke Vercel.

## 4. Pertanyaan terbuka (fitur clustering)

- **Kategori:** clustering dijalankan per kategori (MS, WS, MD, WD, XD), karena skala performa tunggal dan ganda berbeda. Untuk ganda, unit yang dikelompokkan pemain atau pasangan?
- **Sumber data:** hasil pertandingan (skor per game) yang fiturnya dihitung sistem, statistik agregat per pemain dari file, atau keduanya?
- **Fitur performa:** mis. win rate, rasio game menang, rata-rata selisih poin per game, win rate rubber game.
- **Normalisasi:** min-max atau z-score.
- **Nilai K:** dipilih pengguna dengan bantuan Elbow (WCSS) dan Silhouette, atau tetap 3 (Tinggi/Sedang/Rendah)? Label cluster diurutkan dari centroid.
- **Transparansi:** perlu menampilkan langkah perhitungan (data mentah, normalisasi, iterasi centroid) dan ekspor hasil?
