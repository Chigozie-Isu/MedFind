'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatNaira } from '@medfind/core';
import { Badge, Button, Checkbox, Icon, Text, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { updateWorkspace } from '../workspace/store';
import { PageHeading, Tabs, notify } from '../common/ui';
import c from '../common/common.module.css';
import s from './inventory.module.css';

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

interface Photo {
  id: string;
  name: string;
  url: string;
  progress: number;
  error?: string;
}

/** What the demo "reads" from the photos (Figma "Bulk upload – check details" 420:20179). */
interface Found {
  id: string;
  brand: string;
  kind: 'Rx' | 'OTC';
  detail: string;
  quantity: number;
  price: string;
  confirmed: boolean;
  isNew: boolean;
}
const FOUND: Found[] = [
  { id: 'f1', brand: 'Amlodipine', kind: 'Rx', detail: '5mg . 20 tablets . Exp:20-11-2028', quantity: 80, price: '1200', confirmed: true, isNew: false },
  { id: 'f2', brand: 'Cetirizine', kind: 'OTC', detail: '5mg . 30 tablets . Exp:15-08-2028', quantity: 30, price: '1350', confirmed: true, isNew: false },
  { id: 'f3', brand: 'Lisinopril', kind: 'Rx', detail: '5mg . 30 tablets . Exp:15-08-2028', quantity: 98, price: '2000', confirmed: true, isNew: false },
  { id: 'f4', brand: 'Atorvastatin', kind: 'Rx', detail: '10mg . 10 tablets . Exp:25-09-2028', quantity: 80, price: '', confirmed: false, isNew: true },
  { id: 'f5', brand: 'Loratadine', kind: 'OTC', detail: '10mg . 10 tablets . Exp:02-03-2028', quantity: 40, price: '1350', confirmed: true, isNew: false },
  { id: 'f6', brand: 'Metformin', kind: 'Rx', detail: '500mg . 30 tablets . Exp:11-01-2029', quantity: 60, price: '1800', confirmed: false, isNew: false },
];

type Step = 1 | 2 | 3;

function Steps({ step }: { step: Step }) {
  const labels = ['Upload photos', 'Check details', 'Confirm inventory'];
  return (
    <div className={s.steps}>
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const done = n < step;
        return (
          <div key={l} className={s.step}>
            <span className={`${s.stepDot} mf-t-h5`} data-state={done ? 'done' : n === step ? 'now' : 'next'}>
              {done ? <Icon name="tick" size={22} /> : n}
            </span>
            <Text variant="body1" color={cssVar.text.secondary}>
              {l}
            </Text>
            {i < 2 && <span className={s.stepLine} />}
          </div>
        );
      })}
    </div>
  );
}

/** Bulk upload (Figma 420:15429 → 420:19220 → 420:20179): photos are simulated, nothing leaves the browser. */
export function BulkUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reading, setReading] = useState(false);
  const [found, setFound] = useState<Found[]>(FOUND);
  const [tab, setTab] = useState<'all' | 'confirmed' | 'unconfirmed' | 'new'>('all');
  const [tried, setTried] = useState(false);

  // Upload progress animation.
  useEffect(() => {
    if (!photos.some((p) => !p.error && p.progress < 100)) return;
    const t = setTimeout(() => setPhotos((ps) => ps.map((p) => (p.error ? p : { ...p, progress: Math.min(100, p.progress + 25) }))), 250);
    return () => clearTimeout(t);
  }, [photos]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      url: URL.createObjectURL(f),
      progress: 0,
      error: !OK_TYPES.includes(f.type) && !/\.(jpe?g|png|heic)$/i.test(f.name) ? 'This isn’t a photo. Use JPG, PNG or HEIC.' : f.size > MAX_BYTES ? 'This photo is over 10 MB. Take it again at a lower size.' : undefined,
    }));
    setPhotos((p) => [...p, ...next]);
  };
  const good = photos.filter((p) => !p.error);
  const uploading = good.some((p) => p.progress < 100);

  const read = () => {
    setReading(true);
    setTimeout(() => {
      setReading(false);
      setStep(2);
    }, 2500);
  };

  const rows = found.filter((f) => (tab === 'all' ? true : tab === 'confirmed' ? f.confirmed : tab === 'unconfirmed' ? !f.confirmed : f.isNew));
  const patch = (id: string, ch: Partial<Found>) => setFound((fs) => fs.map((f) => (f.id === id ? { ...f, ...ch } : f)));
  const missingPrice = found.filter((f) => f.confirmed && !(Number(f.price) > 0));
  const confirmed = found.filter((f) => f.confirmed);

  const finish = () => {
    setTried(true);
    if (missingPrice.length || !confirmed.length) return;
    const today = new Date().toISOString().slice(0, 10);
    updateWorkspace(
      (st) => {
        let items = [...st.items];
        for (const f of confirmed) {
          const [dosage, pack] = f.detail.split(' . ');
          const ex = items.find((i) => i.brand.toLowerCase() === f.brand.toLowerCase());
          const priceKobo = Math.round(Number(f.price) * 100);
          items = ex
            ? items.map((i) => (i === ex ? { ...i, quantity: i.quantity + f.quantity, priceKobo, updatedAt: today, updatedBy: st.staffName } : i))
            : [{ id: `b${f.id}${Date.now()}`, brand: f.brand, generic: f.brand, dosage, pack, quantity: f.quantity, priceKobo, prescription: f.kind === 'Rx', expiry: '2028-09-25', updatedAt: today, updatedBy: st.staffName }, ...items];
        }
        return { items };
      },
      { kind: 'stock', text: `Bulk added ${confirmed.length} medicines from ${good.length} photo${good.length === 1 ? '' : 's'}`, statuses: [{ label: 'Stock added', tone: 'info' }] },
    );
    setStep(3);
    setTimeout(() => {
      notify(`${confirmed.length} medicines added to your inventory`, 'Patients nearby can reserve them now. We delete the photos after 30 days.');
      router.push('/inventory');
    }, 1200);
  };

  return (
    <Shell
      active="inventory"
      heading={
        <div className={c.stack8}>
          <PageHeading title="Add medicine" crumbs={{ label: 'Add stock', href: '/inventory/add' }} />
          <Text variant="body3" color={cssVar.text.secondary}>
            Snap packs of medications. We read the names, strengths and expiry dates. You check them before anything goes live and confirm.
          </Text>
        </div>
      }
    >
      <Steps step={step} />
      {step === 1 && (
        <>
          <div className={s.uploadGrid}>
            <section className={c.panel}>
              {reading ? (
                <div className={s.drop} aria-busy="true">
                  <span className="mf-spinner" style={{ width: 40, height: 40, color: cssVar.brand.default }} />
                  <Text variant="h5" color={cssVar.text.heading}>
                    Reading your photos
                  </Text>
                  <Text variant="body3" color={cssVar.text.secondary}>
                    Looking for names, strengths and expiry dates on {good.length} photo{good.length === 1 ? '' : 's'}…
                  </Text>
                </div>
              ) : (
                <div
                  className={s.drop}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                >
                  <span className={s.dropIcon}>
                    <Icon name="camera" size={48} />
                  </span>
                  <Text variant="body1" color={cssVar.text.heading}>
                    Drop photos here
                  </Text>
                  <Text variant="body3" color={cssVar.text.secondary}>
                    JPG, PNG or HEIC, up to 10 MB each. Add as many as you like.
                  </Text>
                  <div className={c.row8} style={{ gap: 16 }}>
                    <Button label="Choose photos" onPress={() => input.current?.click()} />
                    <Button label="Use device’s camera" variant="secondary" iconLeft="camera" onPress={() => camera.current?.click()} />
                  </div>
                  <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                  <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addFiles(e.target.files)} />
                </div>
              )}
              <div className={c.between}>
                <Text variant="h5" color={cssVar.text.heading}>
                  Photos
                </Text>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {photos.length ? `${good.length} ready` : 'No uploads'}
                </Text>
              </div>
              {photos.length === 0 ? (
                <Text variant="caption1" color={cssVar.text.secondary}>
                  Photos you choose or take with the camera show up here, with their upload progress.
                </Text>
              ) : (
                photos.map((p) => (
                  <div key={p.id} className={s.photoRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className={s.thumbImg} />
                    <div className={c.cellStack} style={{ flex: 1 }}>
                      <Text variant="label1" color={cssVar.text.heading}>
                        {p.name}
                      </Text>
                      {p.error ? (
                        <Text variant="caption2" color={cssVar.text.error}>
                          {p.error}
                        </Text>
                      ) : (
                        <div className={s.bar}>
                          <div style={{ width: `${p.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <Button label="Remove" variant="destructive-inline" size="small" onPress={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} />
                  </div>
                ))
              )}
            </section>
            <div className={c.stack24}>
              <section className={c.panel} style={{ background: cssVar.brandSubtle }}>
                <Text variant="body1" color={cssVar.text.heading}>
                  You can use your phone
                </Text>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  Open this page on your phone and tap “Use device’s camera”. Photos you take there show up in the same list.
                </Text>
                <Button label="Text me link" variant="text" size="small" onPress={() => notify('Link sent', 'We texted the upload link to +234 810 9876 5432. (Demo: no SMS is sent.)', 'info')} />
              </section>
              <section className={c.panel}>
                <Text variant="body1" color={cssVar.text.heading}>
                  For the best results
                </Text>
                {['Up to 20 brands of medication at a time', 'Hold steady until labels are sharp', 'Use bright, even light with no shadows or flash', 'Show expiry dates if you can'].map((t) => (
                  <span key={t} className={c.row8} style={{ color: cssVar.text.brand, alignItems: 'flex-start' }}>
                    <Icon name="info-circle" size={20} />
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      {t}
                    </Text>
                  </span>
                ))}
              </section>
            </div>
          </div>
          <div className={c.saveBar}>
            <span className={c.row8}>
              <Icon name="info-circle" size={20} color={cssVar.text.secondary} />
              <Text variant="caption1" color={cssVar.text.secondary}>
                {good.length ? (uploading ? 'Uploading… we start reading as soon as each upload finishes.' : `${good.length} photo${good.length === 1 ? '' : 's'} ready to read.`) : 'Add at least one photo to continue. We start reading as soon as each upload finishes.'}
              </Text>
            </span>
            <div className={c.row8} style={{ gap: 16 }}>
              <Button label="Cancel" variant="inline" onPress={() => router.push('/inventory')} />
              <Button label="Read images" iconLeft="search" disabled={!good.length || uploading || reading} onPress={read} />
            </div>
          </div>
        </>
      )}
      {step >= 2 && (
        <div className={s.checkGrid}>
          <aside className={c.stack24}>
            <Text variant="h4" as="h2" color={cssVar.text.heading}>
              {good.length} Photo{good.length === 1 ? '' : 's'}
            </Text>
            {good.map((p, i) => (
              <div key={p.id} className={c.panel}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className={s.bigThumb} />
                <Text variant="label1" color={cssVar.text.heading}>
                  {p.name}
                </Text>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {i === 0 ? found.length - (good.length - 1) : 1} medicine{i === 0 && found.length - (good.length - 1) !== 1 ? 's' : ''} found
                </Text>
              </div>
            ))}
          </aside>
          <section className={c.panel} style={{ gap: 24 }}>
            <div className={c.stack8}>
              <Text variant="h3" as="h2" color={cssVar.text.heading}>
                We found {found.length} medicines
              </Text>
              <Text variant="caption1" color={cssVar.text.secondary}>
                Counted from your photos. Change anything that looks wrong, tick each one you want to add.
              </Text>
            </div>
            <Tabs
              tabs={[
                { key: 'all', label: 'All', count: found.length },
                { key: 'confirmed', label: 'Confirmed', count: confirmed.length },
                { key: 'unconfirmed', label: 'Unconfirmed', count: found.length - confirmed.length },
                { key: 'new', label: 'New', count: found.filter((f) => f.isNew).length },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className={`${c.thead} mf-t-body1`} style={{ gridTemplateColumns: '32px 2.4fr 1.2fr 1.1fr 1fr', textTransform: 'none', padding: '0 0 8px' }}>
              <span />
              <span>Medicine</span>
              <span>Quantity</span>
              <span>Price</span>
              <span>Status</span>
            </div>
            {rows.map((f) => {
              const noPrice = tried && f.confirmed && !(Number(f.price) > 0);
              return (
                <div key={f.id} className={c.trow} style={{ gridTemplateColumns: '32px 2.4fr 1.2fr 1.1fr 1fr', margin: 0, background: cssVar.surface.default }}>
                  <Checkbox checked={f.confirmed} onChange={(v) => patch(f.id, { confirmed: v })} accessibilityLabel={`Confirm ${f.brand}`} disabled={step === 3} />
                  <div className={c.cellStack}>
                    <span>
                      <Text variant="body1">{f.brand} </Text>
                      <Text variant="caption1" color={f.kind === 'Rx' ? cssVar.text.required : cssVar.text.success}>
                        {f.kind}
                      </Text>
                    </span>
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      {f.detail}
                    </Text>
                    {f.isNew && (
                      <Text variant="caption1" color={cssVar.tone.warning.text}>
                        New to your inventory. Add price.
                      </Text>
                    )}
                  </div>
                  <span className={c.stepper}>
                    <button type="button" aria-label={`Fewer ${f.brand}`} onClick={() => patch(f.id, { quantity: Math.max(1, f.quantity - 1) })}>
                      <Icon name="minus" size={16} />
                    </button>
                    <input className="mf-t-label2" aria-label={`${f.brand} quantity`} value={f.quantity} onChange={(e) => patch(f.id, { quantity: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1) })} />
                    <button type="button" aria-label={`More ${f.brand}`} onClick={() => patch(f.id, { quantity: f.quantity + 1 })}>
                      <Icon name="add" size={16} />
                    </button>
                  </span>
                  <label className={s.price} data-error={noPrice ? '' : undefined}>
                    ₦
                    <input className="mf-t-body2" aria-label={`${f.brand} price in naira`} value={f.price} placeholder="0" onChange={(e) => patch(f.id, { price: e.target.value.replace(/\D/g, '') })} />
                  </label>
                  <span>
                    <Badge label={f.confirmed ? 'Confirmed' : 'Check it'} tone={f.confirmed ? 'success' : 'warning'} dot="left" />
                  </span>
                </div>
              );
            })}
            {tried && missingPrice.length > 0 && (
              <Text variant="caption1" color={cssVar.text.error}>
                Add a price for {missingPrice.map((m) => m.brand).join(', ')} before you confirm.
              </Text>
            )}
            <div className={c.between}>
              <Button label="Back" variant="inline" icon={undefined} iconLeft="chevron-left" onPress={() => setStep(1)} disabled={step === 3} />
              <Button
                label={step === 3 ? 'Adding…' : `Add ${confirmed.length} to inventory · ${formatNaira(confirmed.reduce((t, f) => t + (Number(f.price) || 0) * 100 * f.quantity, 0))}`}
                loading={step === 3}
                disabled={!confirmed.length}
                onPress={finish}
              />
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
