import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

import { type Category, PrismaClient } from "@/generated/prisma/client";
import {
  type BwfMatch,
  type BwfSkipReason,
  checkSides,
  displayName,
  inferGenders,
  parseBwfRow,
  toBwfRows,
} from "@/lib/badminton/bwf-dataset";
import { entryKey, type Gender } from "@/lib/badminton/match-rules";
import { parseCsv } from "@/lib/csv";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";

config({ path: [".env.local", ".env"], quiet: true });

// Import dataset hasil pertandingan BWF (github.com/SahilMotyar/bwf-match-data) ke database yang ditunjuk
// DIRECT_URL. Idempoten: pertandingan yang sudah pernah diimport (ID eksternal sama) dilewati, pemain dicocokkan
// lewat nama lengkap di dataset (`players.external_id`). Jalankan sesudah `bun run db:deploy`.
//
//   bun run db:import-bwf -- ./ms.csv ./ws.csv ./md.csv ./wd.csv ./xd.csv --from 2024-01-01 --main-draw
//
// Opsi:
//   --from / --to YYYY-MM-DD   batasi tanggal pertandingan (inklusif)
//   --main-draw                lewati babak kualifikasi (round berawalan `Q`)
//   --dry-run                  baca, validasi, dan laporkan saja — tanpa menulis ke database
//
// Import semua kategori dalam satu kali jalan supaya gender pemain XD bisa diturunkan dari nomor lain.

const USAGE =
  "Usage: bun run db:import-bwf -- <file.csv>... [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--main-draw] [--dry-run]";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const READ_CHUNK = 1000;
const WRITE_CHUNK = 500;

const { values: options, positionals: files } = parseArgs({
  allowPositionals: true,
  options: {
    from: { type: "string" },
    to: { type: "string" },
    "main-draw": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (options.help || files.length === 0) {
  console.error(USAGE);
  process.exit(options.help ? 0 : 1);
}
for (const [name, value] of [
  ["--from", options.from],
  ["--to", options.to],
] as const) {
  if (value !== undefined && !DATE.test(value)) {
    console.error(`${name} must be YYYY-MM-DD`);
    process.exit(1);
  }
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DIRECT_URL }) });

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

const externalMatchId = (match: BwfMatch) => `bwf:${createHash("sha1").update(match.key).digest("hex")}`;

type Report = {
  rows: number;
  outOfRange: number;
  qualification: number;
  skipped: Partial<Record<BwfSkipReason, number>>;
  ready: number;
};

const newReport = (): Report => ({ rows: 0, outOfRange: 0, qualification: 0, skipped: {}, ready: 0 });

function skip(report: Report, reason: BwfSkipReason) {
  report.skipped[reason] = (report.skipped[reason] ?? 0) + 1;
}

/**
 * Baca semua file → pertandingan yang lolos filter tanggal/kualifikasi, plus semua baris yang sah (`parsed`,
 * tanpa filter) untuk menurunkan gender dari riwayat lengkap pemain.
 */
async function readMatches() {
  const reports = new Map<string, Report>();
  const reportOf = (key: string) => {
    const report = reports.get(key) ?? newReport();
    reports.set(key, report);
    return report;
  };
  const matches: BwfMatch[] = [];
  const parsed: BwfMatch[] = [];

  for (const file of files) {
    const rows = toBwfRows(parseCsv(await readFile(file, "utf8")));
    for (const row of rows) {
      const report = reportOf((row.discipline ?? "?").toUpperCase());
      report.rows += 1;
      const result = parseBwfRow(row);
      if (!result.ok) {
        skip(report, result.reason);
        continue;
      }
      const { match } = result;
      parsed.push(match);
      if ((options.from && match.playedOn < options.from) || (options.to && match.playedOn > options.to)) {
        report.outOfRange += 1;
        continue;
      }
      if (options["main-draw"] && match.qualification) {
        report.qualification += 1;
        continue;
      }
      matches.push(match);
    }
  }
  return { matches, parsed, reports, reportOf };
}

/** Gender pemain yang sudah ada di database (dicocokkan lewat ID eksternal = nama di dataset). */
async function knownGenders(names: string[]) {
  const known = new Map<string, Gender>();
  for (const batch of chunks(names, READ_CHUNK)) {
    const players = await prisma.player.findMany({
      where: { externalId: { in: batch } },
      select: { externalId: true, gender: true },
    });
    for (const player of players) if (player.externalId) known.set(player.externalId, player.gender);
  }
  return known;
}

/** Pastikan semua pemain ada; kembalikan peta nama dataset → id pemain. */
async function upsertPlayers(names: string[], genders: ReadonlyMap<string, Gender>) {
  let created = 0;
  for (const batch of chunks(names, WRITE_CHUNK)) {
    const result = await prisma.player.createMany({
      data: batch.map((name) => ({ externalId: name, name: displayName(name), gender: genders.get(name) ?? "male" })),
      skipDuplicates: true,
    });
    created += result.count;
  }
  const ids = new Map<string, string>();
  for (const batch of chunks(names, READ_CHUNK)) {
    const players = await prisma.player.findMany({
      where: { externalId: { in: batch } },
      select: { id: true, externalId: true },
    });
    for (const player of players) if (player.externalId) ids.set(player.externalId, player.id);
  }
  return { ids, created };
}

/** Pastikan semua unit (pemain tunggal/pasangan per kategori) ada; kembalikan peta key → id unit. */
async function upsertEntries(entries: Map<string, { category: Category; playerIds: string[] }>) {
  const keys = [...entries.keys()];
  let created = 0;
  for (const batch of chunks(keys, WRITE_CHUNK)) {
    const result = await prisma.entry.createMany({
      data: batch.map((key) => {
        const entry = entries.get(key);
        if (!entry) throw new Error(`Unknown entry ${key}`);
        const [player1Id = "", player2Id] = [...entry.playerIds].sort();
        return { key, category: entry.category, player1Id, player2Id: player2Id ?? null };
      }),
      skipDuplicates: true,
    });
    created += result.count;
  }
  const ids = new Map<string, string>();
  for (const batch of chunks(keys, READ_CHUNK)) {
    const rows = await prisma.entry.findMany({ where: { key: { in: batch } }, select: { id: true, key: true } });
    for (const row of rows) ids.set(row.key, row.id);
  }
  return { ids, created };
}

async function main() {
  console.log(`Reading ${files.length} file(s)…`);
  const { matches: candidates, parsed, reports, reportOf } = await readMatches();

  const names = [...new Set(parsed.flatMap((match) => match.sides.flat()))];
  const known = await knownGenders(names);
  const { genders, conflicts } = inferGenders(parsed, known);

  const matches = candidates.filter((match) => {
    const problem = checkSides(match, genders);
    if (problem) skip(reportOf(match.category), problem);
    return !problem;
  });
  for (const match of matches) reportOf(match.category).ready += 1;

  for (const [category, report] of [...reports].sort(([a], [b]) => a.localeCompare(b))) {
    const skipped = Object.entries(report.skipped)
      .map(([reason, count]) => `${reason} ${count}`)
      .join(", ");
    console.log(
      `${category}: ${report.rows} rows → ${report.ready} ready` +
        ` (out of range ${report.outOfRange}, qualification ${report.qualification}${skipped ? `, skipped: ${skipped}` : ""})`,
    );
  }
  if (conflicts.length > 0) {
    console.log(
      `Players listed in both men's and women's events (majority used): ${conflicts.slice(0, 10).join(", ")}`,
    );
  }

  if (options["dry-run"]) {
    console.log("Dry run: nothing written.");
    return;
  }
  if (matches.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  const usedNames = [...new Set(matches.flatMap((match) => match.sides.flat()))];
  const players = await upsertPlayers(usedNames, genders);
  const playerId = (name: string) => {
    const id = players.ids.get(name);
    if (!id) throw new Error(`Player not saved: ${name}`);
    return id;
  };

  const entries = new Map<string, { category: Category; playerIds: string[] }>();
  const sideKeys = matches.map((match) =>
    match.sides.map((side) => {
      const playerIds = side.map(playerId);
      const key = entryKey(match.category, playerIds);
      entries.set(key, { category: match.category, playerIds });
      return key;
    }),
  );
  const entryIds = await upsertEntries(entries);
  const entryId = (key: string | undefined) => {
    const id = key ? entryIds.ids.get(key) : undefined;
    if (!id) throw new Error(`Entry not saved: ${key}`);
    return id;
  };

  let imported = 0;
  const rows = matches.map((match, index) => ({ match, externalId: externalMatchId(match), keys: sideKeys[index] }));
  for (const [batchIndex, batch] of chunks(rows, WRITE_CHUNK).entries()) {
    // Pertandingan & skornya dalam satu transaksi: tidak ada pertandingan tanpa skor bila batch gagal di tengah.
    const created = await prisma.$transaction(
      async (tx) => {
        const saved = await tx.match.createManyAndReturn({
          data: batch.map(({ match, externalId, keys }) => ({
            externalId,
            category: match.category,
            tournament: match.tournament,
            tier: match.tier,
            round: match.round,
            playedOn: new Date(`${match.playedOn}T00:00:00.000Z`),
            entryAId: entryId(keys?.[0]),
            entryBId: entryId(keys?.[1]),
            winner: match.winner,
            retired: match.retired,
          })),
          select: { id: true, externalId: true },
          skipDuplicates: true,
        });
        const gamesOf = new Map(batch.map(({ match, externalId }) => [externalId, match.games]));
        await tx.matchGame.createMany({
          data: saved.flatMap(({ id, externalId }) =>
            (gamesOf.get(externalId ?? "") ?? []).map((game, index) => ({ matchId: id, number: index + 1, ...game })),
          ),
        });
        return saved.length;
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
    imported += created;
    process.stdout.write(`\rMatches: batch ${batchIndex + 1}/${Math.ceil(rows.length / WRITE_CHUNK)}`);
  }
  process.stdout.write("\n");

  await prisma.auditLog.create({
    data: {
      action: "matches.import",
      targetType: "match",
      after: {
        source: "bwf-match-data",
        files: files.map((file) => file.split("/").pop() ?? file),
        from: options.from ?? null,
        to: options.to ?? null,
        mainDraw: options["main-draw"] ?? false,
        imported,
        alreadyPresent: matches.length - imported,
        playersCreated: players.created,
        entriesCreated: entryIds.created,
      },
    },
  });

  console.log(
    `Imported ${imported} match(es); ${matches.length - imported} already present. ` +
      `New players: ${players.created}, new entries: ${entryIds.created}.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
