/**
 * Fetches ALL rows from a Supabase query by paginating in batches.
 * Supabase caps responses at 1000 rows by default.
 * This utility fetches in pages until all data is retrieved.
 */
export async function fetchAllRows<T = any>(
  queryBuilder: any,
  pageSize = 1000
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await queryBuilder.range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break; // last page
    from += pageSize;
  }

  return allRows;
}
