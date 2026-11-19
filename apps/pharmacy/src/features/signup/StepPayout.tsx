'use client';

import { useEffect, useState } from 'react';
import { formatAccountNumber, isValidAccountNumber } from '@medfind/core';
import { sizes } from '@medfind/ui';
import { Button, Icon, Text, TextField } from '@medfind/ui/web';
import { listBanks, resolveAccount, type ApplicationPayout, type Bank } from './api';
import { Notice, SelectField, signupStyles as s } from './Shell';

export type PayoutCheck =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'verified'; accountName: string }
  | { kind: 'mismatch'; accountName: string; businessName: string }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

export interface PayoutState {
  bankCode: string;
  accountNumber: string;
  check: PayoutCheck;
}

/** Step 3 (Figma "Sign up step 3 – …"): bank, account number, the name check and how payouts work. */
export function StepPayout({
  saved,
  initial,
  initialBanks,
  demo,
  onVerified,
  onBack,
  onContinue,
}: {
  saved: ApplicationPayout | null;
  initial?: Partial<PayoutState>;
  initialBanks?: Bank[];
  demo?: boolean;
  onVerified: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [banks, setBanks] = useState<Bank[]>(initialBanks ?? []);
  const [bankError, setBankError] = useState<string | null>(null);
  const [st, setSt] = useState<PayoutState>({
    bankCode: saved?.bank_code ?? '',
    accountNumber: saved?.account_number ?? '',
    check: saved?.verified ? { kind: 'verified', accountName: saved.account_name } : { kind: 'idle' },
    ...initial,
  });
  const [bannerOpen, setBannerOpen] = useState(true);

  useEffect(() => {
    if (initialBanks || demo) return;
    listBanks().then((r) => (r.ok ? setBanks(r.value.banks) : setBankError(r.reason)));
  }, [initialBanks, demo]);

  // Check the account as soon as there is a bank and 10 digits.
  const digits = st.accountNumber.replace(/\D/g, '');
  const bank = banks.find((b) => b.code === st.bankCode);
  useEffect(() => {
    if (demo || !bank || !isValidAccountNumber(digits)) return;
    if (saved?.verified && saved.bank_code === bank.code && saved.account_number === digits && st.check.kind === 'verified') return;
    let live = true;
    setSt((p) => ({ ...p, check: { kind: 'checking' } }));
    resolveAccount(bank, digits).then((r) => {
      if (!live) return;
      setBannerOpen(true);
      if (r.ok) {
        const check: PayoutCheck = r.value.matches
          ? { kind: 'verified', accountName: r.value.accountName }
          : { kind: 'mismatch', accountName: r.value.accountName, businessName: r.value.businessName };
        setSt((p) => ({ ...p, check }));
        if (r.value.matches) onVerified();
      } else {
        setSt((p) => ({ ...p, check: r.reason === 'not_found' ? { kind: 'not_found' } : { kind: 'error', message: r.reason } }));
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank?.code, digits, demo]);

  const c = st.check;
  const accountName = c.kind === 'verified' || c.kind === 'mismatch' ? c.accountName : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className={s.grid} style={{ padding: '0 12px' }}>
        <SelectField
          label="Bank"
          required
          placeholder="Select your bank"
          value={st.bankCode}
          options={banks.map((b) => ({ value: b.code, label: b.name }))}
          onChange={(bankCode) => setSt((p) => ({ ...p, bankCode, check: { kind: 'idle' } }))}
          errorText={bankError ?? undefined}
        />
        <TextField
          label="Account number"
          required
          size="web"
          placeholder="10 digits"
          value={st.accountNumber.length === 10 ? formatAccountNumber(st.accountNumber) : st.accountNumber}
          onChangeText={(t) => setSt((p) => ({ ...p, accountNumber: t.replace(/\D/g, '').slice(0, 10), check: { kind: 'idle' } }))}
          keyboard="number"
          errorText={
            c.kind === 'not_found' ? 'We couldn’t find this account. Check the bank and number.' : c.kind === 'error' ? c.message : undefined
          }
          helperText={c.kind === 'checking' ? 'Checking the account…' : undefined}
        />
        <TextField
          label="Account name"
          size="web"
          placeholder="We fill this in once we find the account"
          value={accountName}
          disabled={!accountName}
          forceState={c.kind === 'mismatch' ? 'error' : accountName ? 'filled' : 'disabled'}
        />
        {c.kind === 'verified' && (
          <div className={s.full} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--mf-text-success)', marginTop: -8 }}>
            <Icon name="tick-circle" size={sizes.icon.sm} />
            <Text variant="caption1" color="var(--mf-text-success)">Account name matches your business</Text>
          </div>
        )}
      </div>

      {c.kind === 'mismatch' && bannerOpen && (
        <div className={s.banner} role="alert" style={{ margin: '0 12px' }}>
          <Icon name="info-circle" size={40} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text variant="h5" color="inherit">This account isn’t in your business name</Text>
            <Text variant="caption1" color="inherit">
              {`Payouts can only go to an account named ${c.businessName.toUpperCase()}, the name on your CAC certificate. Use your business account, or contact us if your business name has changed.`}
            </Text>
          </div>
          <button type="button" className={s.bannerClose} aria-label="Close" onClick={() => setBannerOpen(false)}>
            <Icon name="close" size={sizes.icon.lg} />
          </button>
        </div>
      )}

      <div className={s.card} style={{ margin: '0 12px' }}>
        <Text variant="h5" color="var(--mf-text-heading)">How payouts work</Text>
        <div className={`${s.cardRow} mf-t-body3`}>
          <Icon name="calendar" size={sizes.icon.md} />
          Every second Friday, we pay out your online sales from the last 2 weeks, up to Wednesday midnight.
        </div>
        <div className={`${s.cardRow} mf-t-body3`}>
          <Icon name="discount-circle" size={sizes.icon.md} />
          We take the 5% MedFind fee on reserved sales before each payout.
        </div>
        <div className={`${s.cardRow} mf-t-body3`}>
          <Icon name="setting" size={sizes.icon.md} />
          You can change this account later in Profile and hours.
        </div>
      </div>

      <div style={{ padding: '0 12px', alignSelf: 'flex-start' }}>
        <Notice>We only pay into an account in your registered business name. Bank details are encrypted.</Notice>
      </div>

      <div className={s.actions}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Button label="Continue" disabled={c.kind !== 'verified'} onPress={onContinue} />
      </div>
    </div>
  );
}
