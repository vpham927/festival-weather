/**
 * Run async work over `items` with at most `limit` tasks in flight.
 * Preserves input order in the result array.
 */
export async function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await mapper(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(1, limit), items.length || 1) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
