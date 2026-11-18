# Arsitektur API — ShuttleCluster

API-first: setiap fitur punya Route Handler di `src/app/api/`, dan UI memakai API tersebut lewat TanStack React Query. Keputusan produk ada di [project.md](./project.md).

## 1. Struktur

```
src/app/api/            Route Handler: auth/, me/, users/, health/, docs/, openapi.json/
src/server/services/    Service layer — satu-satunya jalan ke DB
src/server/auth/        Session (cookie + tabel sessions)
src/server/audit/       writeAudit
src/validations/        Schema request (Zod 4)
src/lib/i18n/messages/  Katalog pesan API (en/id)
src/lib/openapi/        Spec OpenAPI 3.1 untuk /api/docs
src/proxy.ts            Lapisan pertama: origin check + cek cookie session
prisma/                 schema.prisma, migrations/, seed.ts
```

## 2. Konvensi API

### Response envelope

```ts
// sukses
{ success: true,  code: MessageKey, message: string, statusCode: number, data?: T }
// gagal
{ success: false, code: MessageKey, message: string, statusCode: number, errors?: unknown }
```

- `code` = kunci pesan yang **stabil** (mis. `auth.invalid_credentials`). Klien memakai `code` untuk logika, bukan `message`.
- `message` = terjemahan `code` sesuai locale request (§2.1).
- Header respons: `Content-Language`, `Vary: Accept-Language, X-Locale`, `Cache-Control: no-store`.
- `bigint` diubah ke string saat serialisasi; `Date` menjadi ISO string.

Helper: `ApiResponse.ok(code, data)`, `.created(code, data)`, `.success(code, data, { statusCode })`, `.error(code, statusCode, { params, errors })`.

### 2.1 Multi bahasa (i18n)

Locale: **`id`** (default) dan **`en`**. Urutan pemilihan per request:

1. Header **`X-Locale`**.
2. Preferensi user yang login: **`users.locale`** (`PATCH /api/me { "locale": "en" }`; `null` = ikuti header).
3. Header **`Accept-Language`**.
4. Default `id`.

- `message` diambil dari `src/lib/i18n/messages/{en,id}.ts`. `en.ts` adalah sumber kunci; `id.ts` bertipe `Record<MessageKey, string>` sehingga kunci yang hilang gagal di type-check.
- Error validasi per field memakai locale bawaan zod lewat error map **per-parse**, jadi schema zod **tidak** memakai pesan kustom. Aturan yang pesan bawaannya tidak ramah memakai `localized("validation.…")`.
- Placeholder pesan memakai `{nama}`.

### Kode status

| Kondisi | Status |
|---|---|
| Session tidak ada / tidak valid | **401** |
| Bukan admin di endpoint khusus admin (`auth.admin_required`), wajib ganti password, atau mutasi lintas origin | **403** |
| Resource tidak ditemukan | **404** |
| Data sudah ada, atau admin aktif terakhir (`users.last_admin`) | **409** |
| Akun terkunci | **423** |
| Validasi input gagal | **400**, `errors` = hasil zod per field |
| Rate limit | **429** |

`ApiError` membawa **kunci pesan**, bukan teks: `throw ApiError.notFound("error.not_found")`. Factory: `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `locked`, `tooManyRequests`, `server`.

### Pola Route Handler

```ts
// src/app/api/me/route.ts
export const PATCH = RouteHandler(async (req) => {
  const session = await requireSession();                                     // 401 / 403
  const input = await validateRequest(updateMeSchema, await readJson(req));   // 400
  return ApiResponse.ok("me.updated", await updateMe(session.user.id, input));
});
```

- Handler tipis: session, validasi, lalu panggil service. Logika bisnis dan audit log ada di service.
- Setiap mutasi menulis `audit_logs` di transaksi yang sama (`writeAudit`; aksinya didaftarkan di `src/lib/audit-actions.ts`).

### List & pagination

Query seragam: `?page=1&pageSize=20&q=&sort=field:asc` + filter spesifik resource (multi-nilai dipisah koma, `csvListSchema`). `pageSize` maksimum 100. Helper di `src/lib/pagination.ts`.

```ts
data: { items: T[], page: number, pageSize: number, total: number, totalPages: number }
```

## 3. Pola akses data

| Pemanggil | Cara akses |
|---|---|
| **Route Handler** | `requireSession` → validasi → service |
| **Server Component** | Panggil service langsung. **Jangan** `fetch()` ke API sendiri. |
| **Client Component** | Hook React Query di `src/features/<feature>/hooks/` → fungsi di `src/features/<feature>/api/` → `apiFetch` (`src/lib/api-client.ts`). |

## 4. Database

Prisma 7 + `@prisma/adapter-neon`. Client di-generate ke `src/generated/prisma` (git-ignored).

| Variabel | Isi | Dipakai oleh |
|---|---|---|
| `DATABASE_URL` | Connection string Neon **pooled** (host `-pooler`) | Runtime aplikasi |
| `DIRECT_URL` | Connection string Neon **langsung** | `prisma migrate`, Studio, seed |
| `SESSION_SECRET` | Secret token session | Auth |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Akun admin awal | Seed |

Model saat ini: `User` (dengan `role`: admin | user), `Session`, `AuditLog`.

**Konvensi model:**

- Model PascalCase singular, tabel snake_case plural (`@@map`), kolom snake_case (`@map`).
- ID `String @id @default(uuid(7)) @db.Uuid`. Timestamps `createdAt @default(now())`, `updatedAt @updatedAt`.
- Enum Prisma tidak boleh berisi spasi. Label tampilan tetap di UI.

Branch Neon: `production` untuk produksi dan `dev` untuk pengembangan. `migrate dev` **tidak pernah** dijalankan ke `production`; produksi hanya `migrate deploy`.

## 5. Auth

```
proxy.ts         /api/* : mutasi lintas origin → 403; tanpa cookie session → 401
                 (kecuali /api/health, /api/auth/login, /api/auth/logout, /api/docs, /api/openapi.json)
                 halaman tanpa cookie → redirect /login?next=...
getSession()     validasi session di DB (tokenHash, expiresAt, revokedAt, user.status)
requireSession() per handler → 401, atau 403 selama wajib ganti password
requireAdmin()   seperti requireSession, ditambah 403 jika users.role bukan admin
```

- **Role:** `admin` dan `user` (`users.role`, default `user`). Role dibaca dari DB di setiap request lewat session, jadi perubahan role langsung berlaku. UI menyembunyikan menu admin (`adminOnly` di sidebar, `useIsAdmin()`), tetapi API tetap sumber kebenaran.

- **Session di DB + cookie `httpOnly`, `Secure`, `SameSite=Lax`** (`shuttle_session`; yang disimpan hanya hash token). Berlaku 7 hari, diperpanjang lewat `POST /api/auth/refresh`.
- Password minimal 12 karakter, disimpan sebagai hash scrypt (`src/helpers/password.helper.ts`), tidak pernah dikembalikan di response atau ditulis ke audit log.
- Rate limit (`src/lib/rate-limiter.ts`) di login (per IP + per email), `PATCH /api/me/password`, dan reset password oleh admin. Setelah 5 kali login gagal, akun dikunci 15 menit.

## 6. Daftar endpoint

```
GET    /api/health              publik
POST   /api/auth/login          publik
POST   /api/auth/logout         publik (idempoten)
POST   /api/auth/refresh
GET    /api/auth/session
GET    /api/me
PATCH  /api/me                  nama, avatar, locale
PATCH  /api/me/password         404 selama AUTH_CONFIG.passwordChangeEnabled = false
GET    /api/users               admin — daftar (q, role, status, pagination)
POST   /api/users               admin — buat akun (email, name, password, role)
PATCH  /api/users/{id}          admin — ubah name, role, status (active | deactivated)
POST   /api/users/{id}/reset-password   admin
GET    /api/docs                Scalar API Reference
GET    /api/openapi.json        spec OpenAPI 3.1
```

`/api/docs` dan `/api/openapi.json` aktif di development; di production hanya jika `API_DOCS_ENABLED=true`. Schema body & query di spec dibuat dengan `z.toJSONSchema` dari schema di `src/validations/`. **Endpoint baru wajib ditambahkan ke `src/lib/openapi/document.ts`.** Koleksi request: [api/shuttle-cluster.http](./api/shuttle-cluster.http).

## 7. Menjalankan secara lokal

```bash
cp .env.example .env.local        # isi DATABASE_URL, DIRECT_URL (branch Neon dev), SESSION_SECRET, ADMIN_*
bun run db:deploy                 # terapkan prisma/migrations
bun run db:seed                   # akun admin (role admin)
bun run dev
```

## 8. Jebakan

- Next.js 16 memakai **`proxy.ts`** (bukan `middleware.ts`). `params`, `cookies()`, dan `headers()` adalah async.
- Prisma 7 tidak otomatis membaca `.env` → `prisma.config.ts` memuat dotenv (`.env.local` diprioritaskan).
- `BigInt` tidak bisa di-`JSON.stringify` → diubah di response formatter.
- Neon pooled connection untuk runtime, direct untuk migrasi. Jangan tertukar.
