'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatNaira } from '@medfind/core';
import { Button, Text, TextField, Toggle, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { getWorkspace, updateWorkspace } from '../workspace/store';
import { PageHeading, SearchBox, notify } from '../common/ui';
import c from '../common/common.module.css';

/** The MedFind catalogue the search box looks in (demo list). */
const CATALOGUE = [
  { brand: 'Augmentin', generic: 'Co-amoxiclav', dosage: '625 mg', pack: '14 tablets', prescription: true },
  { brand: 'Amoxil', generic: 'Amoxicillin', dosage: '500 mg', pack: '21 capsules', prescription: true },
  { brand: 'Panadol Extra', generic: 'Paracetamol + caffeine', dosage: '500/65 mg', pack: '24 tablets', prescription: false },
  { brand: 'Lonart', generic: 'Artemether/lumefantrine', dosage: '80/480 mg', pack: '6 tablets', prescription: false },
  { brand: 'Glucophage', generic: 'Metformin', dosage: '500 mg', pack: '30 tablets', prescription: true },
  { brand: 'Lipitor', generic: 'Atorvastatin', dosage: '20 mg', pack: '28 tablets', prescription: true },
  { brand: 'Zyrtec', generic: 'Cetirizine', dosage: '10 mg', pack: '30 tablets', prescription: false },
  { brand: 'Flagyl', generic: 'Metronidazole', dosage: '400 mg', pack: '14 tablets', prescription: true },
];

type Form = { brand: string; generic: string; dosage: string; price: string; amount: string; pack: string; expiry: string; prescription: boolean };
const EMPTY: Form = { brand: '', generic: '', dosage: '', price: '', amount: '', pack: '', expiry: '', prescription: false };

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.brand.trim()) e.brand = 'Enter the brand name';
  if (!f.generic.trim()) e.generic = 'Enter the generic name';
  if (!f.dosage.trim()) e.dosage = 'Enter the dosage, e.g. 500 mg';
  const price = Number(f.price.replace(/,/g, ''));
  if (!f.price.trim()) e.price = 'Enter a price';
  else if (!Number.isFinite(price) || price <= 0) e.price = 'Enter a price above ₦0';
  const amount = Number(f.amount);
  if (!f.amount.trim()) e.amount = 'Enter how many you have';
  else if (!Number.isInteger(amount) || amount < 1) e.amount = 'Enter a whole number, 1 or more';
  if (!f.pack.trim()) e.pack = 'Enter the pack size, e.g. 20 tablets';
  if (!f.expiry) e.expiry = 'Choose the expiry date';
  else if (new Date(f.expiry) <= new Date()) e.expiry = 'This medicine has expired. You can’t list it.';
  return e;
}

/** Add stock › Add medicine (Figma 403:3870 and 2316:52054). `?restock=<id>` pre-fills an existing medicine. */
export function AddMedicine() {
  const router = useRouter();
  const params = useSearchParams();
  const restock = useMemo(() => getWorkspace().items.find((i) => i.id === params.get('restock')), [params]);
  const [f, setF] = useState<Form>(() =>
    restock
      ? { brand: restock.brand, generic: restock.generic, dosage: restock.dosage, price: String(restock.priceKobo / 100), amount: '', pack: restock.pack, expiry: '', prescription: restock.prescription }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const matches = q.trim().length >= 2 ? CATALOGUE.filter((m) => `${m.brand} ${m.generic}`.toLowerCase().includes(q.trim().toLowerCase())) : [];

  const submit = (again: boolean) => {
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      const priceKobo = Math.round(Number(f.price.replace(/,/g, '')) * 100);
      const amount = Number(f.amount);
      const name = `${f.brand.trim()} ${f.dosage.trim()}`;
      updateWorkspace(
        (s) => {
          const existing = s.items.find((i) => i.brand.toLowerCase() === f.brand.trim().toLowerCase() && i.dosage.toLowerCase() === f.dosage.trim().toLowerCase());
          const today = new Date().toISOString().slice(0, 10);
          return {
            items: existing
              ? s.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + amount, priceKobo, expiry: f.expiry, updatedAt: today, updatedBy: s.staffName } : i))
              : [
                  { id: `m${Date.now()}`, brand: f.brand.trim(), generic: f.generic.trim(), dosage: f.dosage.trim(), pack: f.pack.trim(), quantity: amount, priceKobo, prescription: f.prescription, expiry: f.expiry, updatedAt: today, updatedBy: s.staffName },
                  ...s.items,
                ],
          };
        },
        { kind: 'stock', text: `Added ${amount} × ${name} to stock at ${formatNaira(priceKobo)}`, statuses: [{ label: 'Stock added', tone: 'info' }] },
      );
      setBusy(false);
      notify(`${name} added`, `${amount} in stock at ${formatNaira(priceKobo)}. Patients nearby can reserve it now.`);
      if (again) {
        setF(EMPTY);
        setQ('');
      } else router.push('/inventory');
    }, 600);
  };

  return (
    <Shell active="inventory" heading={<PageHeading title="Add medicine" crumbs={{ label: 'Add stock', href: '/inventory' }} />}>
      <section className={c.panel} style={{ gap: 24 }}>
        <div className={c.between}>
          <Text variant="body1" color={cssVar.text.heading}>
            {restock ? `Restock ${restock.brand} ${restock.dosage}` : 'Manually Update Stock'}
          </Text>
          <Button label="Bulk add" variant="secondary" size="small" iconLeft="add" onPress={() => router.push('/inventory/bulk')} />
        </div>
        <div className={c.stack8} style={{ maxWidth: 680, position: 'relative' }}>
          <Text variant="h5" as="h2" color={cssVar.text.heading}>
            Find it in the catalogue
          </Text>
          <SearchBox value={q} onChange={setQ} placeholder="Search by brand or generic name, e.g. Amoxil" />
          <Text variant="caption2" color={cssVar.text.secondary}>
            Pick a match and we fill in the pack sizes and whether it needs a prescription.
          </Text>
          {q.trim().length >= 2 && (
            <div className={c.menu} style={{ top: 84, left: 0, right: 'auto', width: '100%', maxWidth: 520 }}>
              {matches.length ? (
                matches.map((m) => (
                  <button
                    key={m.brand}
                    type="button"
                    className={`${c.menuItem} mf-t-label1`}
                    onClick={() => {
                      setF((p) => ({ ...p, brand: m.brand, generic: m.generic, dosage: m.dosage, pack: m.pack, prescription: m.prescription }));
                      setErrors({});
                      setQ('');
                    }}
                  >
                    {m.brand} · {m.generic} {m.dosage} {m.prescription ? '(Rx)' : '(OTC)'}
                  </button>
                ))
              ) : (
                <span className={`${c.menuItem} mf-t-label2`}>No match. Type the details below instead.</span>
              )}
            </div>
          )}
        </div>
        <div className={c.grid2}>
          <TextField label="Brand Name" required info size="web" placeholder="e.g. Augmentin" value={f.brand} onChangeText={set('brand')} errorText={errors.brand} />
          <TextField label="Generic Name" required info size="web" placeholder="e.g. Co-amoxiclav" value={f.generic} onChangeText={set('generic')} errorText={errors.generic} />
          <TextField label="Dosage" required info size="web" placeholder="e.g.30ml" value={f.dosage} onChangeText={set('dosage')} errorText={errors.dosage} />
          <TextField label="Price" required info size="web" placeholder="₦" value={f.price} onChangeText={(v) => set('price')(v.replace(/[^\d.,]/g, ''))} errorText={errors.price} keyboard="number" />
          <TextField label="Amount" required info size="web" placeholder="How many you’re adding" value={f.amount} onChangeText={(v) => set('amount')(v.replace(/\D/g, ''))} errorText={errors.amount} keyboard="number" />
          <TextField label="Pack" required info size="web" placeholder="e.g.20 tablets" value={f.pack} onChangeText={set('pack')} errorText={errors.pack} />
          <label className={c.stack8}>
            <Text variant="label1" color={cssVar.input.label}>
              Expiry date<span style={{ color: cssVar.text.required }}> *</span>
            </Text>
            <input type="date" className={`${c.select} mf-t-label2`} style={{ height: 51 }} value={f.expiry} onChange={(e) => set('expiry')(e.target.value)} aria-invalid={!!errors.expiry} />
            {errors.expiry && (
              <Text variant="caption2" color={cssVar.text.error}>
                {errors.expiry}
              </Text>
            )}
          </label>
        </div>
        <label className={c.row8} style={{ gap: 16 }}>
          <Text variant="body1" color={cssVar.text.secondary}>
            Prescription
          </Text>
          <Toggle value={f.prescription} onChange={(prescription) => setF((p) => ({ ...p, prescription }))} accessibilityLabel="Needs a prescription" />
        </label>
        <div className={c.between}>
          <Button label="Cancel" variant="inline" onPress={() => router.push('/inventory')} />
          <div className={c.row8} style={{ gap: 16 }}>
            <Button label="Add another" variant="secondary" iconLeft="add" disabled={busy} onPress={() => submit(true)} />
            <Button label="Update" loading={busy} onPress={() => submit(false)} />
          </div>
        </div>
      </section>
    </Shell>
  );
}
