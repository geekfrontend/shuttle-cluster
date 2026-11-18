/**
 * Level turnamen 1–5 dari label `tier` di dataset BWF, disetarakan antara era Superseries/Grand Prix
 * (2007–2017) dan HSBC BWF World Tour (2018–). Dipakai sebagai filter clustering: membandingkan pemain hanya
 * dari turnamen dengan level tertentu ke atas supaya win rate di Super 100 tidak disamakan dengan Super 1000.
 */
export const TIER_LEVELS = [1, 2, 3, 4, 5] as const;

export type TierLevel = (typeof TIER_LEVELS)[number];

const PATTERNS: [RegExp, TierLevel][] = [
  [/super 1000|world tour finals|grade 1/i, 5],
  [/super 750|superseries premier/i, 4],
  [/super 500|superseries/i, 3],
  [/super 300|grand prix gold/i, 2],
  [/super 100|grand prix/i, 1],
];

/** `null` bila tier kosong atau tidak dikenali (mis. pertandingan yang dicatat manual). */
export function tierLevel(tier: string | null | undefined): TierLevel | null {
  if (!tier) return null;
  for (const [pattern, level] of PATTERNS) if (pattern.test(tier)) return level;
  return null;
}
