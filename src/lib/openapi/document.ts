import { z } from "zod";

import { CATEGORY_CODES } from "@/lib/badminton/categories";
import { LOCALES } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/messages/en";
import { changePasswordSchema, loginSchema } from "@/validations/auth.schema";
import { clusteringQuerySchema } from "@/validations/clustering.schema";
import { createMatchSchema, listMatchesQuerySchema } from "@/validations/match.schema";
import { updateMeSchema } from "@/validations/me.schema";
import { createPlayerSchema, GENDERS, listPlayersQuerySchema, updatePlayerSchema } from "@/validations/player.schema";
import {
  createUserSchema,
  listUsersQuerySchema,
  resetPasswordSchema,
  USER_ROLES,
  USER_STATUSES,
  updateUserSchema,
} from "@/validations/user.schema";

type JsonSchema = Record<string, unknown>;

/** JSON Schema untuk input request, dihasilkan dari schema zod yang sama dengan validasi server. */
function schemaOf(schema: z.ZodType): JsonSchema {
  const { $schema: _ignored, ...json } = z.toJSONSchema(schema, {
    io: "input",
    target: "draft-2020-12",
    unrepresentable: "any",
  }) as JsonSchema;
  return json;
}

function queryParams(schema: z.ZodType) {
  const json = schemaOf(schema) as { properties?: Record<string, JsonSchema>; required?: string[] };
  return Object.entries(json.properties ?? {}).map(([name, property]) => ({
    name,
    in: "query",
    required: json.required?.includes(name) ?? false,
    schema: property,
  }));
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

type Op = {
  tag: string;
  summary: string;
  description?: string;
  public?: boolean;
  /** Hanya admin (role `admin`); selain itu 403 `auth.admin_required`. */
  admin?: boolean;
  params?: "id"[];
  query?: z.ZodType;
  body?: z.ZodType;
  success: { status: number; code: keyof typeof en; data?: JsonSchema };
  errors?: number[];
};

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "Validasi gagal (`error.validation_failed`), JSON tidak valid, atau aturan bisnis",
  401: "Belum login atau session tidak valid",
  403: "Bukan admin (`auth.admin_required`), wajib ganti password (`auth.password_change_required`), atau mutasi lintas origin",
  404: "Resource tidak ditemukan",
  409: "Konflik: data sudah ada, atau admin aktif terakhir",
  423: "Akun terkunci",
  429: "Terlalu banyak request",
  503: "Layanan pendukung (mis. database) tidak tersedia",
};

function operation(op: Op) {
  const description = [
    op.description,
    op.public ? "**Publik** — tanpa session." : undefined,
    op.admin ? "**Admin saja.**" : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  const errorCodes = op.errors ?? (op.public ? [400, 429] : [400, 401, 403]);

  return {
    tags: [op.tag],
    summary: op.summary,
    description: description || undefined,
    security: op.public ? [] : undefined,
    parameters: [
      ...(op.params ?? []).map((name) => ({ $ref: `#/components/parameters/${name}` })),
      ...(op.query ? queryParams(op.query) : []),
      { $ref: "#/components/parameters/XLocale" },
      { $ref: "#/components/parameters/AcceptLanguage" },
    ],
    requestBody: op.body
      ? { required: true, content: { "application/json": { schema: schemaOf(op.body) } } }
      : undefined,
    responses: {
      [op.success.status]: {
        description: `\`${op.success.code}\``,
        content: {
          "application/json": {
            schema: {
              allOf: [
                ref("SuccessEnvelope"),
                {
                  type: "object",
                  properties: {
                    code: { const: op.success.code },
                    ...(op.success.data ? { data: op.success.data } : {}),
                  },
                },
              ],
            },
          },
        },
      },
      ...Object.fromEntries(
        errorCodes.map((status) => [
          status,
          {
            description: ERROR_DESCRIPTIONS[status],
            content: { "application/json": { schema: ref("ErrorEnvelope") } },
          },
        ]),
      ),
    },
  };
}

const page = (item: string) => ({
  type: "object",
  properties: {
    items: { type: "array", items: ref(item) },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
});

const DESCRIPTION = `API ShuttleCluster.

## Autentikasi
Login lewat \`POST /api/auth/login\` (email + password). Server mengirim cookie \`shuttle_session\` (httpOnly); tombol **Test Request** di halaman ini otomatis memakai cookie tersebut karena satu origin.
Akun baru wajib ganti password (\`PATCH /api/me/password\`) sebelum bisa memakai endpoint lain.

## Role
- **admin** — semua akses, termasuk kelola pengguna (\`/api/users\`).
- **user** — akses biasa; endpoint khusus admin mengembalikan **403** \`auth.admin_required\`.

## Multi bahasa
Locale respons: header \`X-Locale\` → preferensi user (\`PATCH /api/me { locale }\`) → \`Accept-Language\` → default \`id\`.
Setiap respons membawa \`code\` (stabil, untuk logika klien) dan \`message\` (terjemahan).
`;

export function buildOpenApiDocument(serverUrl: string) {
  const paths: Record<string, Record<string, unknown>> = {
    "/api/health": {
      get: operation({
        tag: "System",
        summary: "Health check (koneksi database)",
        public: true,
        success: { status: 200, code: "health.ok" },
        errors: [503],
      }),
    },
    "/api/auth/login": {
      post: operation({
        tag: "Auth",
        summary: "Login dengan email + password",
        description: "5 kali gagal berturut-turut → akun dikunci 15 menit (423).",
        public: true,
        body: loginSchema,
        success: { status: 200, code: "auth.login_success" },
        errors: [400, 401, 423, 429],
      }),
    },
    "/api/auth/logout": {
      post: operation({
        tag: "Auth",
        summary: "Logout (idempoten)",
        public: true,
        success: { status: 200, code: "auth.logout_success" },
        errors: [],
      }),
    },
    "/api/auth/refresh": {
      post: operation({
        tag: "Auth",
        summary: "Rotasi token & perpanjang session",
        success: { status: 200, code: "auth.session_refreshed" },
        errors: [401],
      }),
    },
    "/api/auth/session": {
      get: operation({
        tag: "Auth",
        summary: "Session aktif + locale efektif",
        success: { status: 200, code: "auth.session_active" },
        errors: [401],
      }),
    },
    "/api/me": {
      get: operation({
        tag: "Me",
        summary: "Profil saya",
        success: { status: 200, code: "me.profile", data: ref("Me") },
      }),
      patch: operation({
        tag: "Me",
        summary: "Ubah profil & preferensi bahasa",
        body: updateMeSchema,
        success: { status: 200, code: "me.updated", data: ref("Me") },
      }),
    },
    "/api/me/password": {
      patch: operation({
        tag: "Me",
        summary: "Ganti password",
        description: "Satu-satunya mutasi yang boleh selama wajib ganti password. Session di device lain dicabut.",
        body: changePasswordSchema,
        success: { status: 200, code: "auth.password_changed" },
        errors: [400, 401, 429],
      }),
    },
    "/api/players": {
      get: operation({
        tag: "Players",
        summary: "Daftar pemain",
        query: listPlayersQuerySchema,
        success: { status: 200, code: "players.list", data: page("Player") },
      }),
      post: operation({
        tag: "Players",
        summary: "Tambah pemain",
        admin: true,
        body: createPlayerSchema,
        success: { status: 201, code: "players.created", data: ref("Player") },
        errors: [400, 401, 403, 409],
      }),
    },
    "/api/players/{id}": {
      patch: operation({
        tag: "Players",
        summary: "Ubah pemain",
        description: "Gender tidak bisa diubah setelah pemain punya pertandingan (409 `players.gender_locked`).",
        admin: true,
        params: ["id"],
        body: updatePlayerSchema,
        success: { status: 200, code: "players.updated", data: ref("Player") },
        errors: [400, 401, 403, 404, 409],
      }),
      delete: operation({
        tag: "Players",
        summary: "Hapus pemain",
        description: "Hanya pemain tanpa pertandingan (409 `players.has_matches`).",
        admin: true,
        params: ["id"],
        success: { status: 200, code: "players.deleted" },
        errors: [401, 403, 404, 409],
      }),
    },
    "/api/matches": {
      get: operation({
        tag: "Matches",
        summary: "Daftar pertandingan",
        description: "`q` mencari nama turnamen atau nama pemain. Urut dari tanggal terbaru.",
        query: listMatchesQuerySchema,
        success: { status: 200, code: "matches.list", data: page("Match") },
      }),
      post: operation({
        tag: "Matches",
        summary: "Catat pertandingan",
        description:
          "Jumlah & gender pemain tiap sisi harus sesuai kategori (XD = 1 putra + 1 putri). Skor divalidasi dengan aturan BWF (21 poin, selisih 2, maksimal 30; best of 3) dan pemenang ditentukan dari skor. `retired: true` untuk retired/walkover: game terakhir boleh belum selesai dan `winner` wajib diisi.",
        admin: true,
        body: createMatchSchema,
        success: { status: 201, code: "matches.created", data: ref("Match") },
      }),
    },
    "/api/matches/{id}": {
      delete: operation({
        tag: "Matches",
        summary: "Hapus pertandingan",
        admin: true,
        params: ["id"],
        success: { status: 200, code: "matches.deleted" },
        errors: [401, 403, 404],
      }),
    },
    "/api/clustering": {
      get: operation({
        tag: "Clustering",
        summary: "Jalankan K-Means satu kategori",
        description:
          "Fitur per unit (pemain tunggal / pasangan): win rate, rasio game menang, rata-rata selisih poin per game — dari pertandingan selesai normal (retired/walkover tidak dihitung) di periode `from`–`to` (default 24 bulan terakhir data), opsional tanpa kualifikasi dan hanya turnamen level ≥ `minTier`. Unit dengan pertandingan < `minMatches` dilewati. Dinormalisasi (`zscore`/`minmax`), K-Means K = 3 (k-means++, seed 42, 20 percobaan), cluster diurutkan dari centroid tertinggi: `dominant`, `competitive`, `developing`. `result` = `null` bila unit yang memenuhi syarat kurang dari 3.",
        query: clusteringQuerySchema,
        success: { status: 200, code: "clustering.result", data: ref("ClusteringResult") },
      }),
    },
    "/api/users": {
      get: operation({
        tag: "Users",
        summary: "Daftar pengguna",
        admin: true,
        query: listUsersQuerySchema,
        success: { status: 200, code: "users.list", data: page("User") },
      }),
      post: operation({
        tag: "Users",
        summary: "Buat akun pengguna",
        description: "Akun baru wajib ganti password saat login pertama (bila fitur ganti password aktif).",
        admin: true,
        body: createUserSchema,
        success: { status: 201, code: "users.created", data: ref("User") },
        errors: [400, 401, 403, 409],
      }),
    },
    "/api/users/{id}": {
      patch: operation({
        tag: "Users",
        summary: "Ubah nama, role, atau status pengguna",
        description:
          "Role & status sendiri tidak bisa diubah. Minimal satu admin aktif harus tersisa (409 `users.last_admin`). Menonaktifkan pengguna mencabut semua session-nya.",
        admin: true,
        params: ["id"],
        body: updateUserSchema,
        success: { status: 200, code: "users.updated", data: ref("User") },
        errors: [400, 401, 403, 404, 409],
      }),
    },
    "/api/users/{id}/reset-password": {
      post: operation({
        tag: "Users",
        summary: "Reset password pengguna",
        description: "Membuka kunci login dan mencabut semua session pengguna. Tidak untuk akun sendiri.",
        admin: true,
        params: ["id"],
        body: resetPasswordSchema,
        success: { status: 200, code: "users.password_reset" },
        errors: [400, 401, 403, 404, 429],
      }),
    },
  };

  const messageCodes = Object.keys(en);

  return {
    openapi: "3.1.0",
    info: { title: "ShuttleCluster API", version: "0.1.0", description: DESCRIPTION },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "System" },
      { name: "Auth" },
      { name: "Me" },
      { name: "Players", description: "Pemain. Semua user bisa membaca; tambah, ubah, hapus khusus admin." },
      {
        name: "Matches",
        description:
          "Pertandingan per kategori (MS, WS, MD, WD, XD). Unit yang bertanding (pemain tunggal atau pasangan) dibuat otomatis dan menjadi unit clustering.",
      },
      {
        name: "Clustering",
        description: "K-Means per kategori: Dominan (tinggi), Kompetitif (sedang), Berkembang (rendah).",
      },
      { name: "Users", description: "Kelola pengguna. Khusus admin." },
    ],
    security: [{ cookieAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "shuttle_session",
          description: "Didapat dari `POST /api/auth/login`.",
        },
      },
      parameters: {
        id: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        XLocale: {
          name: "X-Locale",
          in: "header",
          required: false,
          description: "Paksa bahasa respons (mengalahkan preferensi user & Accept-Language).",
          schema: { type: "string", enum: [...LOCALES] },
        },
        AcceptLanguage: {
          name: "Accept-Language",
          in: "header",
          required: false,
          schema: { type: "string" },
          example: "id-ID,id;q=0.9,en;q=0.8",
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: "object",
          required: ["success", "code", "message", "statusCode"],
          properties: {
            success: { const: true },
            code: { type: "string", enum: messageCodes },
            message: { type: "string", description: "Terjemahan `code` sesuai locale." },
            statusCode: { type: "integer" },
            data: {},
          },
        },
        ErrorEnvelope: {
          type: "object",
          required: ["success", "code", "message", "statusCode"],
          properties: {
            success: { const: false },
            code: { type: "string", enum: messageCodes },
            message: { type: "string" },
            statusCode: { type: "integer" },
            errors: { description: "Detail tambahan, mis. error per field untuk 400." },
          },
          example: {
            success: false,
            code: "auth.invalid_credentials",
            message: "Email atau kata sandi salah",
            statusCode: 401,
          },
        },
        Me: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            avatarUrl: { type: ["string", "null"] },
            locale: { type: ["string", "null"], enum: [...LOCALES, null] },
            role: { type: "string", enum: [...USER_ROLES] },
            mustChangePassword: { type: "boolean" },
            lastActiveAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            avatarUrl: { type: ["string", "null"] },
            role: { type: "string", enum: [...USER_ROLES] },
            status: { type: "string", enum: [...USER_STATUSES] },
            lastActiveAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Player: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            gender: { type: "string", enum: [...GENDERS] },
            country: { type: ["string", "null"], example: "INA" },
            externalId: { type: ["string", "null"] },
            matchCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        MatchSide: {
          type: "object",
          properties: {
            entryId: { type: "string", format: "uuid" },
            players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                  country: { type: ["string", "null"] },
                },
              },
            },
          },
        },
        Match: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            category: { type: "string", enum: [...CATEGORY_CODES] },
            tournament: { type: "string" },
            round: { type: ["string", "null"] },
            playedOn: { type: "string", format: "date" },
            winner: { type: "string", enum: ["a", "b"] },
            retired: { type: "boolean" },
            sideA: ref("MatchSide"),
            sideB: ref("MatchSide"),
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "integer" },
                  scoreA: { type: "integer" },
                  scoreB: { type: "integer" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Features: {
          type: "object",
          properties: {
            winRate: { type: "number" },
            gameWinRate: { type: "number" },
            pointDiffPerGame: { type: "number" },
          },
        },
        ClusteringResult: {
          type: "object",
          properties: {
            params: { type: "object", description: "Parameter yang dipakai, termasuk periode efektif dan `k` (3)." },
            dataRange: {
              type: ["object", "null"],
              properties: { first: { type: "string", format: "date" }, last: { type: "string", format: "date" } },
              description: "Rentang tanggal data kategori ini — dasar shortcut periode di UI.",
            },
            summary: {
              type: "object",
              properties: {
                matches: { type: "integer" },
                units: { type: "integer" },
                eligibleUnits: { type: "integer" },
              },
            },
            features: { type: "array", items: { type: "string" } },
            result: {
              type: ["object", "null"],
              properties: {
                clusters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      level: { type: "string", enum: ["dominant", "competitive", "developing"] },
                      size: { type: "integer" },
                      centroid: ref("Features"),
                      normalizedCentroid: { type: "array", items: { type: "number" } },
                      silhouette: { type: "number" },
                    },
                  },
                },
                members: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      entryId: { type: "string", format: "uuid" },
                      players: { type: "array", items: { type: "object" } },
                      level: { type: "string", enum: ["dominant", "competitive", "developing"] },
                      stats: { type: "object" },
                      features: ref("Features"),
                      silhouette: { type: "number" },
                    },
                  },
                },
                quality: {
                  type: "object",
                  properties: {
                    wcss: { type: "number" },
                    silhouette: { type: "number" },
                    iterations: { type: "integer" },
                  },
                },
                normalization: { type: "object" },
                evaluation: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { k: { type: "integer" }, wcss: { type: "number" }, silhouette: { type: "number" } },
                  },
                },
                history: { type: "array", items: { type: "array", items: ref("Features") } },
                seed: { type: "integer" },
              },
            },
          },
        },
      },
    },
  };
}
