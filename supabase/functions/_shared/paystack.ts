// Paystack calls for pharmacy sign up (step 3). The secret key stays on the server.
//
// With no PAYSTACK_SECRET_KEY set (local development), a small built-in list stands in for
// Paystack so the screens can be tried without an account:
//   * any 10-digit number returns the pharmacy's own name + " LTD" (a match),
//   * 9999999999 returns "GRACE OKAFOR" (the name-mismatch state),
//   * 0000000000 is "account not found".

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const secret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
export const usingTestList = secret === '';

export interface Bank {
  name: string;
  code: string;
}

const TEST_BANKS: Bank[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'Opay', code: '999992' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

async function paystack<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.paystack.co${path}`, { headers: { Authorization: `Bearer ${secret}` } });
  const body = await res.json();
  if (!res.ok || body.status !== true) throw new PaystackError(body.message ?? `Paystack error ${res.status}`, res.status);
  return body.data as T;
}

export class PaystackError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function listBanks(): Promise<Bank[]> {
  if (usingTestList) return TEST_BANKS;
  const data = await paystack<Array<{ name: string; code: string; active: boolean }>>('/bank?country=nigeria&currency=NGN&perPage=100');
  return data.filter((b) => b.active).map((b) => ({ name: b.name, code: b.code }));
}

/** The name on the account, or null if the bank has no such account. */
export async function resolveAccountName(accountNumber: string, bankCode: string, businessName: string): Promise<string | null> {
  if (usingTestList) {
    if (accountNumber === '0000000000') return null;
    if (accountNumber === '9999999999') return 'GRACE OKAFOR';
    return `${businessName.toUpperCase()} LTD`;
  }
  try {
    const data = await paystack<{ account_name: string }>(
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    );
    return data.account_name;
  } catch (e) {
    // Paystack answers 422 when the account can't be found.
    if (e instanceof PaystackError && (e.status === 422 || e.status === 400)) return null;
    throw e;
  }
}
