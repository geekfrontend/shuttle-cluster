# AGENTS.md

## Project overview

ShuttleCluster groups badminton players by match performance using **K-Means clustering**, built API-first with Next.js 16 (App Router + Route Handlers), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Neon Postgres, and Prisma 7.

- **Scope:** men's singles first, designed to extend to the other categories (women's singles, doubles, mixed). The clustering domain is not built yet; the repo is a clean base with auth, account settings, and the dashboard shell.
- **Single-tenant, two roles:** `admin` (everything, including user management at `/users`) and `user` (regular access), stored in `users.role`. The first admin comes from the seed (`ADMIN_EMAIL` / `ADMIN_PASSWORD`); admins create the other accounts. There is no public sign-up.
- Product decisions and open questions live in `docs/project.md`; API architecture in `docs/api-architecture.md`. When they disagree, `docs/project.md` wins. Docs and code comments are written in Indonesian; follow that in comments next to existing Indonesian ones.

This repository uses the shadcn `radix-lyra` style. The shadcn CLI reports `base: "radix"`, which refers to Radix UI. Always inspect the local components in `src/components/ui/` because individual wrappers may use different primitives.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Next.js 16 notes for this repo: request interception lives in `src/proxy.ts` (not `middleware.ts`), `params`/`cookies()`/`headers()` are async, and the React Compiler is enabled (`next.config.mjs`), so do not add `useMemo`/`useCallback` only for memoization.

## shadcn skill

Use the shadcn skill for all work involving shadcn/ui components, styling, composition, registries, presets, or `components.json`.

If the skill is not available, install it with:

```bash
npx skills add shadcn/ui
```

The skill contains the component, styling, composition, accessibility, and CLI rules. Do not duplicate those rules here. Always inspect the local component source before using it.

Do not modify files inside `src/components/ui/` or `src/components/calendar/`. Keep these components intact and apply styling or customization where they are used.

## Setup

This project uses Bun. See `README.md` for environment variables and the Neon branch setup (never develop against the `production` branch).

```bash
bun install          # also runs `prisma generate`
bun run db:deploy    # apply migrations
bun run db:seed      # admin account
bun run dev
```

Available commands:

```bash
bun run build
bun run lint
bun run format
bun run check
bun run check:fix
bun run test
bun run generate:presets
bun run db:generate | db:migrate | db:deploy | db:studio | db:seed | db:import-bwf
```

`bun run test` runs the unit tests (`bun test`, files named `*.test.ts` next to the code they test). Tests cover pure logic such as BWF match rules (`src/lib/badminton/match-rules.ts`), the BWF dataset parser (`src/lib/badminton/bwf-dataset.ts`, used by `prisma/import-bwf.ts`), K-Means (`src/lib/clustering/kmeans.ts`: normalization, k-means++, silhouette, cluster ranking), performance features (`src/lib/clustering/features.ts`), period presets (`src/lib/clustering/period.ts`), tournament tier levels (`src/lib/badminton/tiers.ts`), error handling, and shared schemas; keep such logic free of database/request dependencies so it stays testable. Run build, lint, check, tests, or other validation commands only when the user explicitly requests that validation.

The pre-commit hook runs `bun run generate:presets` (and stages `src/lib/preferences/theme.ts`) plus Biome via lint-staged.

## Backend (API)

- **Route Handlers** live in `src/app/api/`: `auth/`, `me/`, `players/`, `matches/` (reads for everyone, writes admin-only), `clustering/` (runs K-Means for one category; reads only), `users/` (admin), `health/`, `docs/` + `openapi.json`.
- Handler pattern (see `src/app/api/me/route.ts`): wrap in `RouteHandler` → `requireSession()` (or `requireAdmin()` for admin-only endpoints, 403 `auth.admin_required`) → `validateRequest(schema, readJson(req) | readQuery(req))` → call a service → `ApiResponse.ok|created("<message.key>", data)`. Throw `ApiError` for failures.
- **Service layer** (`src/server/services/*.service.ts`) is the only path to the database (`prisma` from `@/db/client`).
- Request schemas live in `src/validations/<feature>.schema.ts` (Zod 4). Responses use one envelope: `{ success, code, message, statusCode, data? }`. Clients branch on `code`; `message` is localized.
- **Audit:** mutations write an audit entry with `writeAudit`; actions must be listed in `src/lib/audit-actions.ts`.
- **API messages** (`src/lib/i18n/messages/en.ts` and `id.ts`) must be added to both catalogs; the type-check fails otherwise. Locale comes from `X-Locale`, then the user preference, then `Accept-Language`.
- **OpenAPI:** register new endpoints and schemas in `src/lib/openapi/document.ts` so `/api/docs` (Scalar) stays complete. Update `docs/api/shuttle-cluster.http` when adding notable endpoints.
- **Database:** schema in `prisma/schema.prisma`, Prisma Client generated into `src/generated/prisma` (git-ignored). Current models: `User` (with `role`), `Session`, `AuditLog`, `Player`, `Entry` (the competing unit — one player or a pair — per category, and the unit that gets clustered), `Match`, `MatchGame`.
- Feature flags live in `src/config/` (e.g. `AUTH_CONFIG.passwordChangeEnabled`, currently `false`).

## Co-location-based structure

Keep feature code close to the route that owns it.

- Dashboard routes: `src/app/(protected)/<screen>/page.tsx` (e.g. `players`, `matches`, `categories`, `account`, `users`). Badminton categories (MS, WS, MD, WD, XD) and cluster levels are defined once in `src/lib/badminton/categories.ts`; their labels live in `clusteringMessages`. Public pages (`/login`, `/unauthorized`): `src/app/(public)/`.
- Screen-specific components, data, and schemas: `src/app/(protected)/<screen>/_components/`
- Shared dashboard components (data table, skeletons, workspace, header, sidebar, import kit, page tabs, quick links): `src/app/(protected)/_components/`
- Shared application components: `src/components/`
- Local shadcn components: `src/components/ui/`
- Shared building blocks on top of the UI primitives (no i18n inside; labels come in as props): `src/components/shared/` — `ConfirmDialog` (use for every new confirmation), `Badge` in `src/components/shared/badge.tsx` (render every status with it), skeletons that mirror the real layout (`SkeletonTableRows`, `SkeletonFieldGrid`, `SkeletonStatCards`, …), `EmptyStateMarquee`, `Marquee`, `ShinyText`, `AITextLoading`, and `AppLoading` (the app loading screen, used only once by the root `src/app/loading.tsx`).
- Shared hooks and utilities: `src/hooks/` and `src/lib/`
- Client-side feature logic: `src/features/<feature>/` — `api/` (fetch functions over `@/lib/api-client`), `hooks/` (TanStack React Query `useQuery`/`useMutation`), and `types.ts` (name payload types `<Action>Request` / `<Action>Response`, e.g. `LoginRequest`, `LoginResponse`), plus `messages/` for the feature's UI copy (see "UI localization"). Apart from those static messages, this is an **API layer only**: no components and no UI logic (no router navigation, toasts, or redirect decisions) — hooks only wrap fetch functions and manage the query cache. UI components and UI behavior stay in the owning route's `_components/` inside `src/app` (or `src/hooks/` when shared across routes).
- Server-only code: `src/server/` (services, auth/session, workspace, audit, import spreadsheet, i18n).
- Theme presets: `src/styles/presets/`

Keep a component inside its route until it is reused by another feature. Do not move screen-specific code into a shared directory preemptively.

The template example screen `tasks` is hidden from the menu and redirected to `/` in `next.config.mjs`. Keep its code as reference; do not wire it to the API.

### Loading and empty states

- `(protected)/loading.tsx` is a general skeleton (page header + content) shown while navigating to a page whose skeleton is not known yet (sidebar links are not prefetched); the dashboard lives in the `(protected)/(dashboard)` route group with its own skeleton. Every route under `(protected)` has its own `loading.tsx` with a skeleton that mirrors that page (heading, tabs, table, cards). Compose it from `src/app/(protected)/_components/skeletons/` (`RouteLoading`, `PageHeaderSkeleton`, `DetailHeaderSkeleton`, `TabsSkeleton`, `DataTableSkeleton` with shapes from `SKELETON_COLUMNS`, `CardSkeleton`, …). Detail screens render the same `<name>-skeleton.tsx` while their query is pending.
- `DataTable` shows two empty states with `EmptyStateMarquee`: no data yet (`empty={{ icon, title, description }}`, the icon represents the table's records) and no results for the current search/filters (with a clear-filters button). Pass the same `search`/`onSearchChange` to `DataTable` as to `DataTableToolbar`.

### Frontend data fetching

- Client components fetch and mutate API data only through TanStack React Query hooks in `src/features/<feature>/hooks/`. Do not call `fetch` directly inside components.
- The `QueryClient` lives in `src/lib/query/` and is provided in the root layout.
- Server Components call server services directly (see `docs/api-architecture.md` §3) and never `fetch()` their own API.

### Charts

- Build charts with EvilCharts (`@evilcharts` registry in `components.json`; components in `src/components/evilcharts/`, kept as shipped by the registry). Use `EvilBarChart` / `EvilLineChart`; for forms EvilCharts lacks (e.g. the cluster scatter plot) compose Recharts with the EvilCharts primitives (`ChartContainer`, `ChartTooltip`, `ChartLegend`).
- Colors come from theme tokens, not raw values in components: cluster levels use `--chart-dominant`, `--chart-competitive`, `--chart-developing` (validated categorical palette, light and dark) through `LEVEL_COLOR` / `levelChartConfig` in `src/lib/clustering/chart.ts`; a single series without identity uses `neutralSeries`. Badges and legends for cluster levels use the same colors (`LevelDot`).
- Recharts sorts legend items alphabetically: pass `itemSorter={null}` (and `selected={null}` to `ChartLegendContent`) to keep the series order. Never use two y-axes; split into separate charts instead.

### Data tables

- The Tasks screen (`src/app/(protected)/tasks/`) is the reference for the table page layout: page heading (`h2` + description) with primary actions on the right, then a bordered container with a toolbar (search input, dashed faceted filters, Reset, View column toggle), the table, and a footer with rows per page, "Page X of Y", and numbered pagination.
- Build tables with TanStack Table v9 (`useTable` + `dataTableFeatures` from `src/lib/data-table-features.ts`) and column definitions in a `<name>-columns.tsx` file inside the route's `_components/`.
- For API data (server-side pagination and filters), reuse `src/app/(protected)/_components/data-table/`: `useServerTableState()` for pagination, filters, visibility, and debounced search; `DataTable`, `DataTableToolbar`, and `DataTableFacetedFilter` (`single` when the API accepts one value) for the UI. Pass `manualPagination`, `manualFiltering`, and `rowCount` to `useTable`.
- Bulk CSV/XLSX imports share the import kit in `src/app/(protected)/_components/import/` and `src/server/import/spreadsheet.ts`. Multi-sheet files use `readWorkbook` + `mapRecords`; `ImportReview` takes `lineLabel` for rows identified by sheet and row, and `ImportFileCard` takes `extensions` to restrict the file type.

### Session and workspace in the UI

- The `(protected)` layout loads `getWorkspace()` (`src/server/workspace/workspace.ts`): the signed-in user and their role. It is provided to Client Components by `WorkspaceProvider`; read it with `useWorkspace()` and `useIsAdmin()` from `src/app/(protected)/_components/workspace/workspace-provider.tsx`. Use them only to show or hide UI; the API remains the source of truth for authorization.
- Admin-only pages check `workspace.user.role` on the server and render `AccessEmptyState` for other users (see `src/app/(protected)/users/page.tsx`).
- `proxy.ts` only checks that the session cookie exists; the layout validates the session against the database and redirects to `/login` when it is invalid.
- `/account` holds settings of the signed-in user (profile, language, security). Put app-wide settings on their own screen.
- Add sidebar entries in `src/navigation/sidebar/sidebar-items.ts` (`adminOnly: true` for admin screens); `useNavGroups()` filters and localizes them for the sidebar and search (titles from `workspaceMessages.nav.items`).

### UI localization

- The UI supports the same locales as the API (`id` default, `en`; see `src/lib/i18n/config.ts`). The request locale comes from `getLocale()` in `src/server/i18n.ts`, and the root layout sets `<html lang>` and `LocaleProvider` from it.
- Every feature owns its UI copy in `src/features/<feature>/messages/`: `en.ts` defines the shape (`export type <Feature>Messages = typeof en`), `id.ts` must `satisfies <Feature>Messages`, and `index.ts` exports `<feature>Messages` as a `MessageCatalog`. Group keys by screen or component (e.g. `login.title`).
- Server Components and `generateMetadata` read copy with `await getMessages(<feature>Messages)`; Client Components use `useMessages(<feature>Messages)` from `@/lib/i18n/locale-provider`. Use `interpolate()` for `{placeholder}` values and `Intl` formatters with the active locale for numbers, currency (IDR), and dates.
- Do not hardcode user-facing text in components, including zod validation messages (build the schema from the messages). API error messages are already localized by the server; `apiFetch` sends `X-Locale` from `<html lang>`.
- API messages stay in `src/lib/i18n/messages/`; they are separate from UI messages.

## Creating or extending a screen

1. Inspect the closest current screen before writing code. Users is the reference for an API-backed table (server-side pagination, filters, row actions, create dialog), Account for tabs and forms, and Tasks for the table layout.
2. When reproducing a UI from a screenshot or image, follow its visual direction closely, including layout, hierarchy, spacing, component structure, and important details. Implement it with the project's existing components and semantic theme tokens rather than copying raw color values. If the design needs a color that is not available through the existing theme tokens, or the user explicitly requests a non-theme color, use a named color from Tailwind's default palette. Do not use arbitrary hex, RGB, HSL, or OKLCH values.
3. Reuse the existing dashboard shell, local components, layout controls, and theme tokens.
4. Break each new page into focused components inside the route's `_components/` directory. Keep `page.tsx` small and focused on composing those pieces.
5. Keep `page.tsx` as a Server Component by default. Move interactive or browser-dependent code into a dedicated Client Component.
6. Add the screen to `src/navigation/sidebar/sidebar-items.ts` when it should appear in the dashboard navigation, and add a `loading.tsx`.
7. Decide the information hierarchy before choosing widgets. Let the content determine the page structure.
8. Keep the established visual rhythm where it fits: compact spacing, clear typography hierarchy, responsive action rows, and grids that collapse cleanly on smaller screens.
9. Widget selection is not a fixed formula. Try different arrangements of cards, resource rows, meters, charts, tabs, empty states, and actions, then keep the version that communicates the content clearly and feels consistent with the project.
10. Match nearby screens in card density, borders, radius, spacing, content width, and responsive behavior.
11. Use semantic theme tokens so new screens work with light mode, dark mode, and the existing theme presets.
12. Keep the flat look: no shadows or rings (`shadow-*`, `ring-*`, `inset-shadow-*`); separate surfaces with `border`. `src/app/globals.css` removes every box-shadow globally, borders cards and floating panels via `data-slot`, and draws keyboard focus as a 1px `--ring` outline, so do not add focus rings yourself.
13. Handle relevant loading, empty, error, disabled, and overflow states.
14. Keep screens accessible with semantic HTML, keyboard support, visible focus states, labels, and appropriate ARIA attributes.

## Code conventions

- TypeScript strict mode is enabled. Use precise types and avoid `any`.
- Use the existing `@/` import aliases.
- Follow the Biome configuration: double quotes, semicolons, two-space indentation, sorted imports, and a 120-character line width.
- Avoid unnecessary dependencies.
- Keep changes focused and do not refactor unrelated files.
- Never commit secrets. `.env` and `.env*.local` are git-ignored; `.env.example` holds placeholders only.

## Contributions

- Use conventional commit prefixes such as `feat:`, `fix:`, `refactor:`, `docs:`, and `chore:`, optionally scoped (e.g. `feat(players): …`).
- Include screenshots for new screens and material visual changes. Include mobile and dark-theme states when relevant.
- Explain new reusable patterns or dependencies in the pull request.
- Update `README.md` and the relevant file in `docs/` when a change alters setup, environment variables, endpoints, or product decisions.
