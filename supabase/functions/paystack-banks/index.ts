// GET: the Nigerian banks Paystack can pay into, for "Select your bank" in pharmacy sign up.
import { corsHeaders, json, listBanks, usingTestList } from '../_shared/paystack.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    return json({ banks: await listBanks(), test_mode: usingTestList });
  } catch (e) {
    console.error('paystack-banks', e);
    return json({ error: 'We couldn’t load the bank list. Try again.' }, 502);
  }
});
