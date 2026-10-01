/**
 * Pobiera wszystkie wiersze zapytania porcjami.
 * Supabase (PostgREST) zwraca domyślnie max 1000 wierszy na zapytanie,
 * więc bez stronicowania większe tabele są po cichu obcinane.
 *
 * `buildQuery` musi za każdym razem tworzyć nowe zapytanie (z ustalonym sortowaniem),
 * do którego zostanie doklejony `.range()`.
 */
const PAGE_SIZE = 1000;

export async function fetchAllRows<T = any>(
  buildQuery: () => any
): Promise<{ data: T[]; error: any }> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return { data: rows, error: null };
}
