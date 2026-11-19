'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { ColorScheme } from '../theme.ts';
import { sizes } from '../tokens/layout.ts';
import type { SideNavItem, TakingReservationsProps } from '../types.ts';
import { Badge, Icon, Toggle } from './components.tsx';

/** "Taking reservations" live/offline switch (Figma 597:13394). */
export function TakingReservations({ live, onChange }: TakingReservationsProps) {
  return (
    <div className="mf-live">
      <Badge label={live ? 'Live' : 'Offline'} tone={live ? 'success' : 'error'} dot="left" />
      <span className="mf-live-toggle">
        Taking reservations
        <Toggle value={live} onChange={onChange} accessibilityLabel="Taking reservations" />
      </span>
    </div>
  );
}

export interface SideNavWebProps {
  items: SideNavItem[];
  activeKey: string;
  onNavigate?: (key: string) => void;
  takingReservations: boolean;
  onTakingReservationsChange?: (value: boolean) => void;
  /** Logo at the top. */
  header?: ReactNode;
  /** Bottom slot under the live switch, e.g. the signed-in staff member. */
  footer?: ReactNode;
}

/** Pharmacy side nav (Figma 169:8189, as used on the Dashboard screen). */
export function SideNav({
  items,
  activeKey,
  onNavigate,
  takingReservations,
  onTakingReservationsChange,
  header,
  footer,
}: SideNavWebProps) {
  return (
    <nav className="mf-sidenav" aria-label="Main">
      <div className="mf-sidenav-items">
        {header}
        <div className="mf-sidenav-items">
          {items.map((item) => {
            const active = item.key === activeKey;
            const content = (
              <>
                <Icon name={item.icon} size={sizes.icon.xl} />
                <span className="mf-nav-label">{item.label}</span>
                {item.count !== undefined && (
                  <span className="mf-nav-count">{String(item.count).padStart(2, '0')}</span>
                )}
              </>
            );
            return item.href ? (
              <a
                key={item.key}
                href={item.href}
                className="mf-nav-item mf-focusable"
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate?.(item.key)}
              >
                {content}
              </a>
            ) : (
              <button
                key={item.key}
                type="button"
                className="mf-nav-item mf-focusable"
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate?.(item.key)}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mf-sidenav-items" style={{ gap: 32 }}>
        <TakingReservations live={takingReservations} onChange={onTakingReservationsChange} />
        {footer}
      </div>
    </nav>
  );
}

/** The pharmacy app's default nav items, in Figma order. */
export const pharmacyNavItems: SideNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'inventory', label: 'Inventory', icon: 'box' },
  { key: 'reservations', label: 'Reservations', icon: 'ticket' },
  { key: 'activity', label: 'Activity', icon: 'history' },
  { key: 'earnings', label: 'Earnings', icon: 'wallet' },
  { key: 'profile', label: 'Profile and hours', icon: 'store' },
];

/* ---------- Light / dark (sun/moon toggle) ---------- */

export const THEME_STORAGE_KEY = 'medfind-theme';

/**
 * Inline script for <head> that applies the saved theme before first paint,
 * so dark mode does not flash light on load.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

function currentScheme(): ColorScheme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Read and set the pharmacy app's colour scheme (stored in localStorage). */
export function useColorScheme(): [ColorScheme, (s: ColorScheme) => void] {
  const [scheme, setScheme] = useState<ColorScheme>('light');
  useEffect(() => setScheme(currentScheme()), []);
  const set = (s: ColorScheme) => {
    document.documentElement.setAttribute('data-theme', s);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, s);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    setScheme(s);
  };
  return [scheme, set];
}

/** Sun/moon button (Figma icons 2263:76920 and 2263:76923). */
export function ThemeToggle() {
  const [scheme, setScheme] = useColorScheme();
  const next = scheme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="mf-theme-toggle mf-focusable"
      onClick={() => setScheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon name={scheme === 'dark' ? 'sun' : 'moon'} size={sizes.icon.md} />
    </button>
  );
}
