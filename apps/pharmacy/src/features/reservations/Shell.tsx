'use client';

import { type ReactNode } from 'react';
import { Icon, Logo, SideNav, Text, ThemeToggle, cssVar, pharmacyNavItems } from '@medfind/ui/web';
import { staff, useReservations } from './store';
import s from './reservations.module.css';
import { updateWorkspace, useWorkspace } from '../workspace/Workspace';

const hrefs: Record<string, string> = { dashboard: '/dashboard', inventory: '/inventory', reservations: '/reservations', activity: '/activity', earnings: '/earnings', profile: '/profile' };

/** Side nav, bell and sun/moon toggle shared by the pharmacy demo screens (Figma "Dashboard" 167:2472). */
export function Shell({ active, heading, children }: { active: 'dashboard' | 'reservations' | 'inventory' | 'activity' | 'earnings' | 'profile'; heading: ReactNode; children: ReactNode }) {
  const waiting = useReservations().filter((r) => r.status === 'review').length;
  const workspace = useWorkspace();
  const items = pharmacyNavItems.map((item) => ({
    ...item,
    href: hrefs[item.key],
    count: item.key === 'dashboard' || item.key === 'reservations' ? waiting : item.key === 'inventory' ? workspace.items.filter((i) => i.quantity <= 3).length : undefined,
  }));
  return (
    <div className={s.layout}>
      <SideNav
        items={items}
        activeKey={active}
        takingReservations={workspace.accepting}
        onTakingReservationsChange={(accepting) => updateWorkspace({ accepting }, accepting ? 'Started taking reservations' : 'Paused reservations')}
        header={<Logo height={48} />}
        footer={
          <div className={s.staffCard}>
            <Text variant="caption2" color={cssVar.text.secondary}>
              {workspace.pharmacy}
            </Text>
            <span className="mf-tm-h5" style={{ color: cssVar.text.heading }}>
              {workspace.staffName}
            </span>
            <Text variant="caption1" color={cssVar.text.secondary}>
              {staff.code}
            </Text>
          </div>
        }
      />
      <main className={s.main}>
        <div className={s.topbar}>
          {heading}
          <div className={s.actions}>
            <span className={s.bell} aria-label={`${waiting + 2} notifications`} role="img">
              <Icon name="notification" size={28} />
              <span className={`${s.bellBadge} mf-t-caption2`}>{waiting + 2}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
        {children}
      </main>

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
