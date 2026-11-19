/** Money is stored as whole kobo (1 naira = 100 kobo). */
export type Kobo = number;

export const KOBO_PER_NAIRA = 100;

export function assertKobo(amount: Kobo): void {
  if (!Number.isSafeInteger(amount)) throw new Error(`Money must be whole kobo, got ${amount}`);
}

/** Display a kobo amount in naira, e.g. 345000 -> "₦3,450", 345050 -> "₦3,450.50". */
export function formatNaira(amount: Kobo): string {
  assertKobo(amount);
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const naira = Math.floor(abs / KOBO_PER_NAIRA);
  const kobo = abs % KOBO_PER_NAIRA;
  const grouped = naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}₦${grouped}${kobo ? `.${kobo.toString().padStart(2, '0')}` : ''}`;
}
