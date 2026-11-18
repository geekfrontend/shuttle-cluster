# ShuttleCluster

ShuttleCluster mengelompokkan pemain bulu tangkis berdasarkan tingkat performa pertandingan menggunakan algoritma **K-Means Clustering**. Fokus awal tunggal putra, dengan rencana mendukung kategori lain.

Repo ini dibangun **API-first**: semua fitur punya API (Route Handlers) dan UI-nya memakai API tersebut. UI tersedia dalam bahasa Indonesia (default) dan Inggris.

## Status

Basis aplikasi sudah bersih dan siap untuk fitur clustering. Yang tersedia saat ini:

| Menu | Route | Isi |
|---|---|---|
| Dasbor | `/` | Sapaan dan tautan cepat |
| Pemain | `/players` | Daftar pemain (gender, negara, jumlah pertandingan). Tambah/ubah/hapus khusus admin |
| Pertandingan | `/matches` | Hasil pertandingan per kategori dengan skor per game; validasi aturan BWF. Catat/hapus khusus admin |
| Kategori | `/categories`, `/categories/[ms\|ws\|md\|wd\|xd]` | Lima kategori BWF dan tiga tingkat performa (Dominan, Kompetitif, Berkembang). Baru UI, belum ada data |
| Akun | `/account` | Profil, bahasa, keamanan |
| Pengguna | `/users` | Khusus admin: tambah akun, ubah role, nonaktifkan, reset kata sandi |
| Login | `/login` | Satu-satunya halaman auth |

Rencana dan pertanyaan terbuka fitur clustering ada di [docs/project.md](docs/project.md).

Catatan:

- Fitur ganti kata sandi sementara dinonaktifkan di `src/config/auth-config.ts`.
- Layar contoh Tasks disembunyikan dari menu dan dialihkan ke `/`. Kodenya tetap ada sebagai referensi pola halaman dengan tabel.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [docs/project.md](docs/project.md) | Tujuan, status, keputusan produk, pertanyaan terbuka |
| [docs/api-architecture.md](docs/api-architecture.md) | Struktur, konvensi API, i18n, database, auth, daftar endpoint |
| `/api/docs` (saat `bun run dev`) | Dokumentasi API interaktif (Scalar), spec di `/api/openapi.json` |
| [docs/api/shuttle-cluster.http](docs/api/shuttle-cluster.http) | Koleksi request untuk mencoba API (VS Code REST Client / JetBrains HTTP Client) |
| [AGENTS.md](AGENTS.md) | Aturan kerja di repo ini (untuk manusia dan AI agent). [CLAUDE.md](CLAUDE.md) mengimpor file ini untuk Claude Code |

## Tech stack

| Area | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Route Handlers, React Compiler), React 19, TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui (`radix-lyra`), TanStack Table v9, Recharts |
| Data di client | TanStack React Query |
| Database | Neon (PostgreSQL serverless) |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| Auth | Session di database + cookie `httpOnly`, password di-hash dengan scrypt (`node:crypto`) |
| Validasi | Zod 4 (pesan error mengikuti bahasa request) |
| Tooling | Bun (runtime, package manager, test runner), Biome, Husky + lint-staged |
| Deploy | Vercel |

## Menjalankan secara lokal

Prasyarat: [Bun](https://bun.sh), dan project Neon dengan branch `dev`. **Jangan memakai branch `production` untuk development.**

```bash
bun install                 # juga menjalankan `prisma generate`
cp .env.example .env.local  # lalu isi nilainya
bun run db:deploy           # terapkan migrasi ke branch Neon dev
bun run db:seed             # akun admin (role admin) dari ADMIN_EMAIL / ADMIN_PASSWORD
bun run dev
```

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000), API di `http://localhost:3000/api`. Cek `GET /api/health` untuk memastikan koneksi database, dan buka [http://localhost:3000/api/docs](http://localhost:3000/api/docs) untuk dokumentasi API.

Seed menolak jalan jika `VERCEL_ENV=production`.

### Environment variables

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Neon **pooled** (host `-pooler`), dipakai runtime |
| `DIRECT_URL` | Connection string Neon **langsung**, dipakai migrasi, Prisma Studio, dan seed |
| `SESSION_SECRET` | Minimal 32 karakter acak, misalnya `openssl rand -base64 48` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Akun admin awal (hanya untuk seed) |
| `NEXT_PUBLIC_SITE_URL` | URL publik untuk sitemap |
| `API_DOCS_ENABLED` | `true` untuk mengaktifkan `/api/docs` di production (default: hanya development) |

`.env.local` dibaca oleh Next.js dan juga oleh Prisma CLI dan seed. File ini tidak di-commit.

## Script

```bash
bun run dev                  # development server
bun run build                # production build
bun run start                # jalankan hasil build
bun run check                # Biome: format + lint + urutan import
bun run check:fix            # perbaiki otomatis
bun run test                 # unit test (bun test, file *.test.ts)
bun run generate:presets     # generate preset tema (juga dijalankan pre-commit)

bun run db:generate          # generate Prisma Client ke src/generated/prisma
bun run db:migrate           # buat migrasi baru dari perubahan schema (branch dev saja)
bun run db:deploy            # terapkan migrasi yang ada
bun run db:studio            # Prisma Studio
bun run db:seed              # akun admin
bun run db:import-bwf        # import dataset hasil pertandingan BWF (lihat di bawah)
```

## Dataset pertandingan

Sumber data: [SahilMotyar/bwf-match-data](https://github.com/SahilMotyar/bwf-match-data) — ±105 ribu pertandingan elite BWF 2007–2026, lima kategori, satu CSV per kategori. Data milik BWF dan didistribusikan ulang untuk riset; cantumkan sumbernya bila dipakai.

```bash
git clone https://github.com/SahilMotyar/bwf-match-data ../bwf-match-data
D=../bwf-match-data
bun run db:import-bwf -- $D/ms.csv $D/ws.csv $D/md.csv $D/wd.csv $D/xd.csv --dry-run   # cek dulu
bun run db:import-bwf -- $D/ms.csv $D/ws.csv $D/md.csv $D/wd.csv $D/xd.csv            # semua periode
```

Opsi: `--from` / `--to YYYY-MM-DD` (batasi tanggal), `--main-draw` (tanpa babak kualifikasi), `--dry-run` (tanpa menulis).

- Idempoten: pertandingan yang sudah ada (ID eksternal sama) dilewati; pemain dicocokkan lewat nama lengkap di dataset.
- Gender tidak ada di dataset: diturunkan dari kategori (MS/MD putra, WS/WD putri) dan, untuk XD, dari pasangannya — karena itu import kelima file sekaligus.
- Skor yang belum selesai dicatat sebagai retired dengan pemenang dari dataset; uji coba format 5×11 poin (2014–2017) dilewati.

## API singkat

- **Auth:** login memakai email + password. Tidak ada register publik dan tidak ada undangan; admin pertama dibuat lewat seed, akun lain dibuat admin di `/users`.
- **Role:** `admin` (termasuk kelola pengguna) dan `user` (akses biasa). Endpoint khusus admin mengembalikan `403` `auth.admin_required` untuk role `user`.
- **Multi bahasa:** `id` (default) dan `en`. Bahasa dipilih dari header `X-Locale`, lalu preferensi user (`PATCH /api/me`), lalu `Accept-Language`.

Setiap respons memakai envelope yang sama:

```json
{ "success": false, "code": "auth.invalid_credentials", "message": "Email atau kata sandi salah", "statusCode": 401 }
```

Gunakan `code` untuk logika di klien. `message` sudah diterjemahkan sesuai bahasa request.

## Struktur proyek

```
prisma/                      schema, migrasi, seed
src/app/(protected)/         halaman dashboard (butuh login)
src/app/(public)/            /login, /unauthorized
src/app/api/                 Route Handlers: auth, me, players, matches, users, health, docs
src/features/<feature>/      lapisan API client: fetch, hook React Query, tipe, pesan UI (id, en)
src/server/services/         service layer (satu-satunya jalan ke database)
src/server/                  session, workspace (user aktif), audit, i18n, import spreadsheet
src/db/                      Prisma Client
src/lib/i18n/                locale, katalog pesan API, provider pesan UI
src/lib/openapi/             spec OpenAPI untuk /api/docs
src/validations/             schema zod request
src/navigation/sidebar/      menu sidebar
src/components/shared/       komponen bersama (ConfirmDialog, Badge, skeleton, empty state)
src/components/ui/           komponen shadcn (jangan diubah)
```

Kode fitur diletakkan dekat route yang memilikinya (colocation). Aturan lengkapnya ada di [AGENTS.md](AGENTS.md).

## Kontribusi

- Commit memakai conventional prefix: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` (boleh dengan scope, mis. `feat(players): …`).
- Pre-commit hook menjalankan `generate:presets` dan Biome pada file yang di-stage.
- Perubahan tampilan disertai screenshot (termasuk mobile dan dark mode bila relevan).
- Pesan API baru ditambahkan ke **kedua** katalog, `src/lib/i18n/messages/en.ts` dan `id.ts`. Begitu juga pesan UI di `src/features/<feature>/messages/`. Kalau salah satu lupa, type-check akan gagal.
- Endpoint baru didaftarkan di `src/lib/openapi/document.ts` agar `/api/docs` tetap lengkap.
