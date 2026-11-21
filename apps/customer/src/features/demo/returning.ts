import { getAccount, resetAccount } from './account';
import { resetReservations } from './store';

const digits = (s: string) => s.replace(/\D/g, '').slice(-10);

/**
 * Log in = returning customer. Signing up swaps the demo to an empty new account; logging in
 * afterwards with any other email or phone brings back Grace's returning-customer data (history,
 * saved cards, addresses and wallet). Logging in as the account that was just created keeps it.
 */
export function startReturningCustomer(identifier?: string): void {
  const { profile } = getAccount();
  const id = (identifier ?? '').trim().toLowerCase();
  const isThisAccount =
    !!id &&
    ((!!profile.email && profile.email.toLowerCase() === id) || (!!profile.phone && digits(id).length === 10 && digits(profile.phone) === digits(id)));
  if (isThisAccount) return;
  resetAccount();
  resetReservations();
}
