'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Logo, SideNav, Text, ThemeToggle, cssVar, pharmacyNavItems } from '@medfind/ui/web';
import { dismissIncoming, useIncoming, useReservations } from './store';
import { stockStatus, updateWorkspace, useWorkspace } from '../workspace/store';
import { BannerStack, notify } from '../common/ui';
import s from './reservations.module.css';

const hrefs: Record<string, string> = {
  dashboard: '/dashboard',
  inventory: '/inventory',
  reservations: '/reservations',
  activity: '/activity',
  earnings: '/earnings',
  profile: '/profile',
};

export type NavKey = 'dashboard' | 'reservations' | 'inventory' | 'activity' | 'earnings' | 'profile';

/** Side nav, bell and sun/moon toggle shared by the pharmacy screens (Figma "Dashboard" 167:2472). */
export function Shell({ active, heading, actions, children }: { active: NavKey; heading: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const all = useReservations();
  const waiting = all.filter((r) => r.status === 'review').length;
  const w = useWorkspace();
  const [bellOpen, setBellOpen] = useState(false);
  const lowStock = w.items.filter((i) => stockStatus(i) !== 'in').length;
  // Client-side navigation keeps live reservations in memory between screens.
  const items = pharmacyNavItems.map((item) => ({
    ...item,
    count: item.key === 'dashboard' || item.key === 'reservations' ? waiting : item.key === 'inventory' ? lowStock : undefined,
  }));
  const unread = w.notificationsRead ? waiting : waiting + 3;
  return (
    <div className={s.layout}>
      <SideNav
        items={items}
        activeKey={active}
        onNavigate={(key) => router.push(hrefs[key] ?? '/dashboard')}
        takingReservations={w.accepting}
        onTakingReservationsChange={(accepting) => {
          updateWorkspace({ accepting }, { kind: 'account', text: accepting ? 'Started taking reservations' : 'Paused new reservations', statuses: [{ label: accepting ? 'Live' : 'Offline', tone: accepting ? 'success' : 'error' }] });
          notify(
            accepting ? 'You’re live' : 'You’re offline',
            accepting ? 'Patients nearby can reserve from you again.' : 'Patients can’t reserve from you until you switch Taking reservations back on. Reservations you already have stay here.',
            accepting ? 'success' : 'info',
          );
        }}
        header={
          <button type="button" className={s.logoBtn} onClick={() => router.push('/dashboard')} aria-label="Dashboard">
            <Logo height={48} />
          </button>
        }
        footer={
          <button type="button" className={s.staffCard} onClick={() => router.push('/profile')} aria-label="Your profile and shift">
            <Text variant="caption2" color={cssVar.text.secondary}>
              {w.pharmacy}
            </Text>
            <span className="mf-tm-h5" style={{ color: cssVar.text.heading }}>
              {w.staffName}
            </span>
            <Text variant="caption1" color={cssVar.text.secondary}>
              {w.staffCode}
            </Text>
          </button>
        }
      />
      <main className={s.main}>
        <div className={s.topbar}>
          {heading}
          <div className={s.actions}>
            {actions}
            <button type="button" className={s.bell} aria-label={`${unread} notifications`} onClick={() => setBellOpen((o) => !o)}>
              <Icon name="notification" size={28} />
              {unread > 0 && <span className={`${s.bellBadge} mf-t-caption2`}>{unread}</span>}
            </button>
            <ThemeToggle />
          </div>
        </div>
        {children}
      </main>
      {bellOpen && <Notifications onClose={() => setBellOpen(false)} />}
      <IncomingToast />
      <BannerStack />
    </div>
  );
}

/** Figma "Overlay – notifications" (2654:127999). */
function Notifications({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const all = useReservations();
  const w = useWorkspace();
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const reviewNotes = all
    .filter((r) => r.status === 'review')
    .map((r) => ({
      key: r.id,
      icon: r.fulfilment === 'delivery' ? ('location' as const) : ('ticket' as const),
      title: r.fulfilment === 'delivery' ? 'Delivery order' : 'New reservation',
      when: `${Math.max(1, Math.round((Date.now() - r.placedAt.getTime()) / 60_000))} min ago`,
      body:
        r.fulfilment === 'delivery'
          ? `${r.customerName} wants ${r.medicineName.split(' ')[0]} delivered to ${(r.address ?? '').split(',')[0]}.`
          : `${r.customerName} reserved ${r.medicineName}.${r.kind === 'prescription' ? ' Review the prescription.' : ''}`,
      action: 'Review',
      href: r.kind === 'prescription' ? `/reservations/${r.id}` : '/reservations',
      unread: true,
    }));
  const rider = all.find((r) => r.fulfilment === 'delivery' && r.status === 'ready');
  const out = w.items.find((i) => i.quantity === 0);
  const notes = [
    ...reviewNotes,
    ...(rider ? [{ key: 'rider', icon: 'time-circle' as const, title: 'Rider arriving', when: '12 min ago', body: `Musa arrives for ${rider.ref} in about 5 minutes.`, action: 'Open', href: '/reservations', unread: !w.notificationsRead }] : []),
    ...(out ? [{ key: 'stock', icon: 'box' as const, title: 'Out of stock', when: '1 h ago', body: `${out.brand} ${out.dosage} has run out. Patients can’t reserve it.`, action: 'Restock', href: `/inventory/add?restock=${out.id}`, unread: !w.notificationsRead }] : []),
    { key: 'payout', icon: 'wallet' as const, title: 'Payout sent', when: 'Fri 13 Nov', body: '₦196,950 is on its way to Sterling Bank •••• 2345. Next payout in 2 weeks.', action: 'View', href: '/earnings', unread: !w.notificationsRead },
  ];
  return (
    <div className={s.popScrim} onClick={onClose}>
      <div className={s.notifications} role="dialog" aria-label="Notifications" onClick={(e) => e.stopPropagation()}>
        <div className={s.between} style={{ padding: '16px 16px 8px' }}>
          <Text variant="h4" as="h2" color={cssVar.text.heading}>
            Notifications
          </Text>
          <button type="button" className={`${s.textLink} mf-t-label1`} onClick={() => updateWorkspace({ notificationsRead: true })}>
            Mark all as read
          </button>
        </div>
        {notes.map((n) => (
          <div key={n.key} className={s.note2} data-unread={n.unread ? '' : undefined}>
            <span className={s.noteIcon}>
              <Icon name={n.icon} size={18} />
            </span>
            <div className={s.grow} style={{ gap: 6 }}>
              <div className={s.between} style={{ alignItems: 'baseline' }}>
                <Text variant="body1" color={cssVar.text.heading}>
                  {n.title}
                </Text>
                <Text variant="caption2" color={cssVar.text.secondary}>
                  {n.when}
                </Text>
              </div>
              <Text variant="caption1" color={cssVar.text.secondary}>
                {n.body}
              </Text>
              <button type="button" className={`${s.textLink} mf-t-label1`} onClick={() => go(n.href)}>
                {n.action}
              </button>
            </div>
          </div>
        ))}
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Text variant="caption1" color={cssVar.text.secondary}>
            You’re all caught up
          </Text>
        </div>
      </div>
    </div>
  );
}

/** Figma "Overlay – new reservation toast" (2654:128066). */
function IncomingToast() {
  const r = useIncoming();
  const router = useRouter();
  if (!r) return null;
  return (
    <div className={s.incoming} role="status">
      <span className={s.noteIcon}>
        <Icon name="ticket" size={18} />
      </span>
      <div className={s.grow} style={{ gap: 4 }}>
        <Text variant="body1" color={cssVar.text.heading}>
          New reservation
        </Text>
        <Text variant="caption1" color={cssVar.text.secondary}>
          {r.customerName} · {r.medicineName} × {r.quantity} · {r.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
        </Text>
      </div>
      <button
        type="button"
        className={`${s.textLink} mf-t-label1`}
        onClick={() => {
          dismissIncoming();
          router.push(r.kind === 'prescription' ? `/reservations/${r.id}` : '/reservations');
        }}
      >
        View
      </button>
      <button type="button" className={s.closeBtn} onClick={dismissIncoming} aria-label="Close">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function Progress({ fraction, tone = 'brand' }: { fraction: number; tone?: 'brand' | 'warning' | 'error' }) {
  const cls = tone === 'error' ? s.fillError : tone === 'warning' ? s.fillWarning : s.fill;
  return (
    <div className={s.track}>
      <div className={cls} style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%` }} />
    </div>
  );
}
