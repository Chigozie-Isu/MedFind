'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STOP_RESERVATIONS_BEFORE_CLOSE_MINUTES } from '@medfind/core';
import { Badge, Button, Icon, Text, TextField, Toggle, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { clock, resetReservations, useNow } from '../reservations/store';
import { ALL_SERVICES, DAY_LABELS, resetWorkspace, updateWorkspace, useWorkspace, type DayHours, type DayKey, type WorkspaceState } from '../workspace/store';
import { Avatar, Modal, Skeleton, hhmmOf, notify, useFirstLoad } from '../common/ui';
import c from '../common/common.module.css';
import s from './profile.module.css';

const DAYS: DayKey[] = ['weekdays', 'saturday', 'sunday', 'holidays'];
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

/** "16:00" for a 18:00 close (new reservations stop 2 hours before closing, rule in @medfind/core). */
export function stopTime(close: string): string {
  const [h, m] = close.split(':').map(Number);
  const mins = (h * 60 + m - STOP_RESERVATIONS_BEFORE_CLOSE_MINUTES + 1440) % 1440;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export function hoursText(h: DayHours) {
  return h.allDay ? 'Open 24 hours' : `${h.open} – ${h.close}`;
}

/** The pharmacy's cover: the photo they chose, or the Fuasi shop-front sign. */
export function Cover({ w, height = 136 }: { w: WorkspaceState; height?: number }) {
  return w.cover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={w.cover} alt={`${w.pharmacy} shop front`} className={s.cover} style={{ height }} />
  ) : (
    <div className={s.coverSign} style={{ height }} role="img" aria-label={`${w.pharmacy} shop front`}>
      <span className="mf-t-h2">{w.pharmacy}</span>
    </div>
  );
}

/** Profile and hours (Figma 562:13928) with Edit profile, Opening hours and Clock out. */
export function Profile() {
  const router = useRouter();
  const w = useWorkspace();
  const now = useNow();
  const loading = useFirstLoad('profile');
  const [editing, setEditing] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [clockOut, setClockOut] = useState(false);
  const [resetting, setResetting] = useState(false);
  const shiftEnd = new Date(w.clockedInAt).getTime() + 12 * 3_600_000;
  const left = Math.max(0, shiftEnd - now);
  const activeStaff = w.employees.filter((e) => e.active);
  const mine = w.activity.filter((a) => a.employee === w.staffName);
  const fulfilled = (w.isNewPharmacy ? 0 : 17) + mine.filter((a) => a.statuses.some((x) => ['Collected', 'Delivered', 'Accepted'].includes(x.label))).length;
  const declined = (w.isNewPharmacy ? 0 : 2) + mine.filter((a) => a.statuses.some((x) => x.label === 'Declined')).length;
  const stockEdits = (w.isNewPharmacy ? 0 : 7) + mine.filter((a) => a.kind === 'stock').length;

  return (
    <Shell
      active="profile"
      heading={
        <div className={c.stack8}>
          <Text variant="h2" as="h1" color={cssVar.text.primary}>
            Profile
          </Text>
          <Text variant="body3" color={cssVar.text.secondary}>
            Your pharmacy details, opening hours, team and shift
          </Text>
        </div>
      }
    >
      {loading ? (
        <Skeleton rows={4} cards={2} />
      ) : (
        <div className={s.grid}>
          <div className={c.stack24}>
            <section className={s.card}>
              <Cover w={w} />
              <div className={s.cardBody}>
                <div className={c.between}>
                  <span className={c.row8} style={{ gap: 16 }}>
                    <Text variant="h4" as="h2" color={cssVar.text.heading}>
                      {w.pharmacy}
                    </Text>
                    <Badge label={w.isNewPharmacy ? "Pending verification" : "Verified"} tone={w.isNewPharmacy ? "warning" : "success"} dot="left" />
                  </span>
                  <Button label="Edit Profile" variant="secondary" size="medium" iconLeft="setting" onPress={() => setEditing(true)} />
                </div>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {w.address} · {w.phone}
                </Text>
                <Text variant="label1" color={cssVar.text.heading}>
                  Services patients can filter by
                </Text>
                <div className={c.chips}>
                  {w.services.map((sv) => (
                    <Badge key={sv} label={sv} />
                  ))}
                </div>
                <div className={s.facts}>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    PCN premises licence
                  </Text>
                  {w.isNewPharmacy ? <Text variant="caption1" color={cssVar.text.secondary}>Application pending review</Text> : <Badge label="Approved until 30-12-2027" tone="success" dot="left" />}
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    Superintendent pharmacist
                  </Text>
                  <Text variant="caption1" color={cssVar.text.heading}>
                    {w.staffName}{w.superintendentPcn ? ` · PCN ${w.superintendentPcn}` : ''}
                  </Text>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    Payout account
                  </Text>
                  <Text variant="caption1" color={cssVar.text.heading}>
                    {w.payoutBank ? `${w.payoutBank} •••• ${w.payoutLast4}` : w.isNewPharmacy ? 'Not added yet' : 'Sterling Bank •••• 2345'}
                  </Text>
                </div>
              </div>
            </section>

            <section className={s.shift}>
              <div className={c.row8} style={{ gap: 16 }}>
                <Avatar name={w.staffName} size={64} />
                <div className={c.stack8}>
                  <Text variant="h3" as="h2" color={cssVar.text.heading}>
                    {w.staffName}
                  </Text>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    Clocked in at {hhmmOf(w.clockedInAt)} with your staff code-{w.staffCode}
                  </Text>
                </div>
              </div>
              <Text variant="h5" color={cssVar.text.heading}>
                {now ? clock(left, true) : '--:--:--'} hours left
              </Text>
              <div className={s.track}>
                <div style={{ width: `${(left / (12 * 3_600_000)) * 100}%` }} />
              </div>
              <div className={c.row8} style={{ gap: 32, flexWrap: 'wrap' }}>
                {[
                  [fulfilled, 'Reservations fulfilled'],
                  [declined, 'Reservations declined'],
                  [String(stockEdits).padStart(2, '0'), 'Stock edits'],
                ].map(([n, l]) => (
                  <span key={l} className={c.row8}>
                    <Text variant="h5" color={cssVar.text.heading}>
                      {n}
                    </Text>
                    <Text variant="caption2" color={cssVar.text.secondary}>
                      {l}
                    </Text>
                  </span>
                ))}
              </div>
              <div className={c.row8} style={{ gap: 16, alignItems: 'center' }}>
                <Button label="Clock out" variant="destructive-primary" size="medium" iconLeft="chevron-right" onPress={() => setClockOut(true)} />
                <Text variant="caption2" color={cssVar.text.secondary}>
                  Clocking out ends your shift and signs you out of this device. If you want a break, switch off Taking reservations on your navigation bar.
                </Text>
              </div>
            </section>

            <section className={c.panel}>
              <div className={c.between}>
                <Text variant="h4" as="h2" color={cssVar.text.heading}>
                  Recent shifts
                </Text>
                <Button label="View all" variant="text" size="small" icon="chevron-right" onPress={() => router.push('/profile/shifts')} />
              </div>
              {w.shifts.slice(1, 3).map((sh) => (
                <div key={sh.id} className={c.between}>
                  <span className={c.row8} style={{ gap: 16 }}>
                    <Avatar name={sh.employee} size={48} />
                    <span className={c.stack8}>
                      <Text variant="body1" color={cssVar.text.heading}>
                        {sh.employee}
                      </Text>
                      <Text variant="caption1" color={cssVar.text.secondary}>
                        {sh.opening} – {sh.closing} · {sh.hours} hours
                      </Text>
                    </span>
                  </span>
                  <Badge label={sh.complete ? 'Completed' : 'Incomplete'} tone={sh.complete ? 'success' : 'error'} dot="left" />
                </div>
              ))}
            </section>
          </div>

          <div className={c.stack24}>
            <section className={c.panel}>
              <div className={c.between}>
                <Text variant="h5" as="h2" color={cssVar.text.heading}>
                  Today so far
                </Text>
                <Button label="Earnings" variant="text" size="small" icon="chevron-right" onPress={() => router.push('/earnings')} />
              </div>
              <span className="mf-t-h2" style={{ color: cssVar.text.heading }}>
                {`₦${(w.transactions.filter(t => t.method !== 'Payout').reduce((sum, t) => sum + t.paidKobo, 0) / 100).toLocaleString('en-NG')}`}
              </span>
              <Text variant="caption1" color={cssVar.text.secondary}>
                {`${w.transactions.filter(t => t.method !== 'Payout').length} completed transactions`}
              </Text>
              <div className={s.divider} />
              <div className={c.between}>
                <Text variant="label1" color={cssVar.text.heading}>
                  Latest activity
                </Text>
                <Button label="View all" variant="text" size="small" icon="chevron-right" onPress={() => router.push('/activity')} />
              </div>
              {w.activity.slice(0, 3).map((a) => (
                <div key={a.id} className={c.between} style={{ alignItems: 'flex-start' }}>
                  <Text variant="caption1" color={cssVar.text.heading}>
                    {hhmmOf(a.at)}
                  </Text>
                  <Text variant="caption1" color={cssVar.text.heading}>
                    <span style={{ display: 'block', textAlign: 'right' }}>{a.text.length > 60 ? `${a.text.slice(0, 58)}…` : a.text}</span>
                  </Text>
                </div>
              ))}
            </section>

            <section className={c.panel}>
              <div className={c.between}>
                <Text variant="h4" as="h2" color={cssVar.text.heading}>
                  Opening hours
                </Text>
                <Button label="Edit" variant="text" size="small" iconLeft="setting" onPress={() => setHoursOpen(true)} />
              </div>
              <div className={s.divider} />
              {DAYS.map((d) => (
                <div key={d} className={c.between}>
                  <Text variant="body3" color={cssVar.text.secondary}>
                    {DAY_LABELS[d]}
                  </Text>
                  <Text variant="body3" color={cssVar.text.secondary}>
                    {hoursText(w.hours[d])}
                  </Text>
                </div>
              ))}
              <span className={c.row8} style={{ color: cssVar.text.brand }}>
                <Icon name="info-circle" size={20} />
                <Text variant="caption1" color={cssVar.text.secondary}>
                  New reservations stop 2 hours before closing time.
                </Text>
              </span>
            </section>

            <section className={c.panel}>
              <Text variant="h4" as="h2" color={cssVar.text.heading}>
                Employees. {activeStaff.length}
              </Text>
              <div className={s.faces}>
                {activeStaff.slice(0, 5).map((e) => (
                  <Avatar key={e.id} name={e.name} size={48} />
                ))}
              </div>
              <Text variant="caption1" color={cssVar.text.secondary}>
                Everyone has their own staff code. They enter it to start a shift, so the activity log shows who did what.
              </Text>
              <div className={c.row8} style={{ gap: 16, flexWrap: 'wrap' }}>
                <Button label="Add employee" size="medium" iconLeft="add" onPress={() => router.push('/profile/employees?add=1')} />
                <Button label="Manage employees and codes" variant="text" size="medium" icon="chevron-right" onPress={() => router.push('/profile/employees')} />
              </div>
            </section>

            <section className={c.panel}>
              <Text variant="h5" as="h2" color={cssVar.text.heading}>
                Demo
              </Text>
              <Text variant="caption1" color={cssVar.text.secondary}>
                Put every reservation, stock level, employee and setting back to how the demo starts.
              </Text>
              <div>
                <Button label="Reset demo" variant="destructive-secondary" size="medium" onPress={() => setResetting(true)} />
              </div>
            </section>
          </div>
        </div>
      )}

      {editing && <EditProfile w={w} onClose={() => setEditing(false)} />}
      {hoursOpen && <OpeningHours w={w} onClose={() => setHoursOpen(false)} />}
      {clockOut && (
        <Modal
          centered
          width={420}
          title="Clock out now?"
          subtitle={`This ends your shift and signs you out of this device. Accepted reservations stay with ${w.pharmacy}.`}
          onClose={() => setClockOut(false)}
          footer={
            <>
              <Button label="Go back" onPress={() => setClockOut(false)} />
              <Button
                label="Clock out"
                variant="destructive-secondary"
                onPress={() => {
                  const mins = Math.round((Date.now() - new Date(w.clockedInAt).getTime()) / 60_000);
                  updateWorkspace({}, { kind: 'account', text: `Clocked out after ${Math.floor(mins / 60)}h ${mins % 60}m`, statuses: [{ label: 'Shift ended', tone: 'neutral' }] });
                  router.push(`/sign-in?ended=${encodeURIComponent(`${Math.floor(mins / 60)}h ${mins % 60}m|${fulfilled}|${declined}|${stockEdits}`)}`);
                }}
              />
            </>
          }
        />
      )}
      {resetting && (
        <Modal
          width={440}
          icon="danger-triangle"
          iconTone="error"
          title="Reset the demo?"
          subtitle="Reservations, stock, employees, hours and profile changes go back to the start. You stay signed in."
          onClose={() => setResetting(false)}
          footer={
            <>
              <Button label="Cancel" variant="secondary" onPress={() => setResetting(false)} />
              <Button
                label="Reset demo"
                variant="destructive-primary"
                onPress={() => {
                  resetWorkspace();
                  resetReservations();
                  setResetting(false);
                  notify('Demo reset', 'Everything is back to how the demo starts.', 'info');
                }}
              />
            </>
          }
        />
      )}
    </Shell>
  );
}

/** Figma "Edit profile" (2451:80303). */
function EditProfile({ w, onClose }: { w: WorkspaceState; onClose: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(w.pharmacy);
  const [address, setAddress] = useState(w.address);
  const [phone, setPhone] = useState(w.phone);
  const [services, setServices] = useState(w.services);
  const [cover, setCover] = useState(w.cover);
  const [errors, setErrors] = useState<{ name?: string; address?: string; phone?: string; cover?: string }>({});
  const save = () => {
    const e: typeof errors = {};
    if (name.trim().length < 3) e.name = 'Enter your pharmacy’s name';
    if (address.trim().length < 10) e.address = 'Enter the full address patients and riders will use';
    if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a phone number with at least 10 digits';
    setErrors(e);
    if (Object.keys(e).length) return;
    updateWorkspace({ pharmacy: name.trim(), address: address.trim(), phone: phone.trim(), services, cover }, { kind: 'account', text: 'Updated the pharmacy profile', statuses: [{ label: 'Profile updated', tone: 'info' }] });
    notify('Profile updated', 'Patients will see your new details on search results and their pickup screens straight away.');
    onClose();
  };
  return (
    <Modal
      title="Edit profile"
      width={600}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button label="Save changes" onPress={save} />
        </>
      }
    >
      <div style={{ position: 'relative' }}>
        <Cover w={{ ...w, pharmacy: name || w.pharmacy, cover }} height={140} />
        <span style={{ position: 'absolute', right: 12, bottom: 12 }}>
          <Button label="Change photo" size="small" iconLeft="camera" onPress={() => file.current?.click()} />
        </span>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (!f) return;
            if (f.size > 3 * 1024 * 1024) return setErrors((x) => ({ ...x, cover: 'Choose a photo under 3 MB.' }));
            const reader = new FileReader();
            reader.onload = () => {
              setCover(String(reader.result));
              setErrors((x) => ({ ...x, cover: undefined }));
              notify('Cover photo updated', 'Patients will see the new photo once you save your profile.', 'info');
            };
            reader.readAsDataURL(f);
          }}
        />
      </div>
      {errors.cover && (
        <Text variant="caption2" color={cssVar.text.error}>
          {errors.cover}
        </Text>
      )}
      <TextField label="Pharmacy name" required info size="web" value={name} onChangeText={setName} helperText="Patients see this on search results and your pickup code." errorText={errors.name} />
      <TextField label="Address" required info size="web" value={address} onChangeText={setAddress} helperText="Used for the map and directions." errorText={errors.address} />
      <TextField label="Phone number" required info size="web" value={phone} onChangeText={setPhone} helperText="Patients and riders call this number." errorText={errors.phone} keyboard="phone" />
      <div className={c.stack8}>
        <Text variant="label1" color={cssVar.text.heading}>
          Services patients can filter by
        </Text>
        <div className={c.chips}>
          {ALL_SERVICES.map((sv) => (
            <button
              key={sv}
              type="button"
              className={`${c.chip} mf-t-caption1`}
              aria-pressed={services.includes(sv)}
              onClick={() => setServices((x) => (x.includes(sv) ? x.filter((y) => y !== sv) : [...x, sv]))}
            >
              {sv}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/** Figma "Opening hours – edit" (2449:54104 … 2449:54276). */
function OpeningHours({ w, onClose }: { w: WorkspaceState; onClose: () => void }) {
  const [hours, setHours] = useState(w.hours);
  const set = (d: DayKey, ch: Partial<DayHours>) => setHours((h) => ({ ...h, [d]: { ...h[d], ...ch } }));
  const bad = DAYS.filter((d) => !hours[d].allDay && hours[d].close <= hours[d].open);
  const save = () => {
    if (bad.length) return;
    const changed = DAYS.filter((d) => JSON.stringify(hours[d]) !== JSON.stringify(w.hours[d]));
    updateWorkspace({ hours, hoursConfigured: true }, { kind: 'account', text: changed.length ? `Changed opening hours for ${changed.map((d) => DAY_LABELS[d]).join(', ')}` : 'Saved opening hours', statuses: [{ label: 'Hours saved', tone: 'info' }] });
    const first = changed[0];
    notify(
      'Opening hours saved',
      first
        ? hours[first].allDay
          ? `${DAY_LABELS[first]} is now open 24 hours. Patients see the new hours straight away.`
          : `${DAY_LABELS[first]} now closes at ${hours[first].close}. New reservations stop at ${stopTime(hours[first].close)}, and patients see the new hours straight away.`
        : 'No changes. Patients see the same hours.',
    );
    onClose();
  };
  return (
    <Modal
      title="Opening hours"
      subtitle="Set when you open and close each day. Patients only see you as open during these hours."
      width={640}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button label="Save hours" onPress={save} disabled={bad.length > 0} />
        </>
      }
    >
      <div className={s.hoursGrid}>
        <Text variant="caption1" color={cssVar.text.secondary}>Day</Text>
        <Text variant="caption1" color={cssVar.text.secondary}>Opens</Text>
        <Text variant="caption1" color={cssVar.text.secondary}>Closes</Text>
        <Text variant="caption1" color={cssVar.text.secondary}>Open 24 hours</Text>
        {DAYS.map((d) => (
          <div key={d} style={{ display: 'contents' }}>
            <Text variant="label1" color={cssVar.text.heading}>
              {DAY_LABELS[d]}
            </Text>
            <select className={`${c.select} mf-t-label2`} aria-label={`${DAY_LABELS[d]} opens`} value={hours[d].open} disabled={hours[d].allDay} onChange={(e) => set(d, { open: e.target.value })}>
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select className={`${c.select} mf-t-label2`} aria-label={`${DAY_LABELS[d]} closes`} value={hours[d].close} disabled={hours[d].allDay} onChange={(e) => set(d, { close: e.target.value })} aria-invalid={bad.includes(d)}>
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Toggle value={hours[d].allDay} onChange={(allDay) => set(d, { allDay })} accessibilityLabel={`${DAY_LABELS[d]} open 24 hours`} />
          </div>
        ))}
      </div>
      <span className={c.row8} style={{ color: bad.length ? cssVar.text.error : cssVar.text.secondary }}>
        <Icon name={bad.length ? 'danger-triangle' : 'info-circle'} size={18} />
        <Text variant="caption1">
          {bad.length
            ? `${DAY_LABELS[bad[0]]} closes before it opens. Pick a later closing time.`
            : `Pick the time you stop serving. Reservations stop 2 hours before closing (Saturday: ${hours.saturday.allDay ? 'open 24 hours' : stopTime(hours.saturday.close)}).`}
        </Text>
      </span>
    </Modal>
  );
}
