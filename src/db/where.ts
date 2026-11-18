/** Filter daftar multi-nilai → kondisi Prisma `{ in: [...] }`; kosong/absen berarti tanpa filter. */
export function anyOf<T>(values: readonly T[] | undefined) {
  return values?.length ? { in: [...values] } : undefined;
}
