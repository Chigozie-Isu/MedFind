// POST { bank_code, bank_name, account_number }: asks Paystack whose account it is, checks the name
// matches the signed-in owner's pharmacy (in the database, private.account_name_matches), and saves
// it as the payout account if it does.
// Answers { account_name, matches } or { error, code: 'not_found' | 'bad_request' | ... }.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { corsHeaders, json, resolveAccountName } from '../_shared/paystack.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST', code: 'bad_request' }, 405);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'Sign in first', code: 'unauthorised' }, 401);
  const userId = userData.user.id;

  let body: { bank_code?: string; bank_name?: string; account_number?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Send JSON', code: 'bad_request' }, 400);
  }
  const accountNumber = (body.account_number ?? '').replace(/\s/g, '');
  const bankCode = body.bank_code ?? '';
  const bankName = body.bank_name ?? '';
  if (!/^\d{10}$/.test(accountNumber) || !bankCode || !bankName) {
    return json({ error: 'Choose a bank and enter the 10-digit account number', code: 'bad_request' }, 400);
  }

  const { data: owner } = await admin
    .from('pharmacy_staff')
    .select('pharmacy_id, pharmacies!inner(name, application_status)')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle();
  const pharmacy = (owner as { pharmacies?: { name: string; application_status: string } } | null)?.pharmacies;
  if (!pharmacy || pharmacy.application_status !== 'draft') {
    return json({ error: 'Finish your pharmacy details first', code: 'no_draft' }, 409);
  }

  let accountName: string | null;
  try {
    accountName = await resolveAccountName(accountNumber, bankCode, pharmacy.name);
  } catch (e) {
    console.error('paystack-resolve-account', e);
    return json({ error: 'We couldn’t reach the bank. Try again in a moment.', code: 'unavailable' }, 502);
  }
  if (!accountName) return json({ error: 'We couldn’t find this account. Check the bank and number.', code: 'not_found' }, 404);

  const { data: matches, error } = await admin.rpc('save_verified_payout_account', {
    p_user: userId,
    p_bank_name: bankName,
    p_bank_code: bankCode,
    p_account_number: accountNumber,
    p_account_name: accountName,
  });
  if (error) {
    console.error('save_verified_payout_account', error);
    return json({ error: 'We couldn’t save this account. Try again.', code: 'save_failed' }, 500);
  }
  return json({ account_name: accountName, matches: matches === true, business_name: pharmacy.name });
});
