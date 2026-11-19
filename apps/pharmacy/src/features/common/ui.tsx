'use client';

/**
 * Pieces shared by the pharmacy screens: popups (Figma "Overlay – …"), the big notification
 * banners at the bottom of the page, tab rows, table pagers, loading skeletons, empty states
 * and CSV export. Colours, text styles and radii come from @medfind/ui.
 */
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Button, Icon, Tag, Text, cssVar } from '@medfind/ui/web';
import type { IconName } from '@medfind/ui';
import s from './common.module.css';

/* ---------- Banners ("… notification" in Figma, e.g. "Opening hours saved") ---------- */

export type BannerTone = 'success' | 'info' | 'error';
export interface Banner {
  id: number;
  title: string;
  body?: string;
  tone: BannerTone;
  action?: { label: string; onPress: () => void };
}

let banners: Banner[] = [];
let nextId = 1;
const bannerListeners = new Set<() => void>();
const emitBanners = () => bannerListeners.forEach((l) => l());

/** Show a banner at the bottom of the screen. It closes by itself after 6 seconds (8 with an action). */
export function notify(title: string, body?: string, tone: BannerTone = 'success', action?: Banner['action']) {
  const id = nextId++;
  banners = [...banners.slice(-2), { id, title, body, tone, action }];
  emitBanners();
  setTimeout(() => dismiss(id), action ? 8000 : 6000);
}
export function dismiss(id: number) {
  banners = banners.filter((b) => b.id !== id);
  emitBanners();
}
const EMPTY: Banner[] = [];
export function useBanners(): Banner[] {
  return useSyncExternalStore(
    (l) => {
      bannerListeners.add(l);
      return () => bannerListeners.delete(l);
    },
    () => banners,
    () => EMPTY,
  );
}

export function BannerStack() {
  const list = useBanners();
  if (!list.length) return null;
  return (
    <div className={s.bannerStack} aria-live="polite">
      {list.map((b) => (
        <div key={b.id} className={s.banner} data-tone={b.tone} role="status">
          <Icon name={b.tone === 'error' ? 'danger-circle' : b.tone === 'success' ? 'tick-circle' : 'info-circle'} size={28} />
          <div className={s.bannerText}>
            <Text variant="h5">{b.title}</Text>
            {b.body && <Text variant="caption1">{b.body}</Text>}
          </div>
          {b.action && <Button label={b.action.label} size="small" onPress={b.action.onPress} />}
          <button type="button" className={s.iconBtn} onClick={() => dismiss(b.id)} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Popup ---------- */

export function Modal({
  title,
  subtitle,
  icon,
  iconTone = 'success',
  onClose,
  children,
  footer,
  width = 520,
  centered,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  iconTone?: 'success' | 'info' | 'error';
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  centered?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={s.scrim} onClick={onClose}>
      <div
        className={s.modal}
        style={{ width, textAlign: centered ? 'center' : undefined }}
        role="dialog"
        aria-modal
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">
          <Icon name="close" size={20} />
        </button>
        {icon && (
          <span className={s.modalIcon} data-tone={iconTone}>
            <Icon name={icon} size={28} />
          </span>
        )}
        <div className={s.stack8}>
          <Text variant="h4" as="h2" color={cssVar.text.primary}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="body3" as="p" color={cssVar.text.secondary}>
              {subtitle}
            </Text>
          )}
        </div>
        {children}
        {footer && <div className={s.modalFooter} style={centered ? { justifyContent: 'center' } : undefined}>{footer}</div>}
      </div>
    </div>
  );
}

/** Pale blue box with a big code in it (rider code, staff code). */
export function CodeBox({ code, caption }: { code: string; caption: string }) {
  return (
    <div className={s.codeBox}>
      <span className="mf-t-h2" style={{ color: cssVar.text.heading, letterSpacing: 1 }}>
        {code}
      </span>
      <Text variant="caption1" color={cssVar.text.secondary}>
        {caption}
      </Text>
    </div>
  );
}

/** Amber "Only hand over if the codes match" style note. */
export function WarningNote({ title, body }: { title: string; body: string }) {
  return (
    <div className={s.warning}>
      <Icon name="danger-triangle" size={18} />
      <div className={s.stack8}>
        <Text variant="label1" color={cssVar.text.heading}>
          {title}
        </Text>
        <Text variant="caption2" color={cssVar.tone.warning.text}>
          {body}
        </Text>
      </div>
    </div>
  );
}

/* ---------- Page bits ---------- */

export function PageHeading({ title, subtitle, crumbs }: { title: string; subtitle?: string; crumbs?: { label: string; href: string } }) {
  return (
    <div className={s.stack8}>
      {crumbs && (
        <div className={s.crumbs}>
          <Link href={crumbs.href} className={`${s.crumbLink} mf-t-label1`}>
            <Icon name="chevron-left" size={14} />
            {crumbs.label}
          </Link>
          <Text variant="label1" color={cssVar.text.secondary}>
            /
          </Text>
          <Text variant="label1" color={cssVar.text.secondary}>
            {title}
          </Text>
        </div>
      )}
      <Text variant={crumbs ? 'h3' : 'h2'} as="h1" color={cssVar.text.primary}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="body3" color={cssVar.text.secondary}>
          {subtitle}
        </Text>
      )}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string; count?: number }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div className={s.tabs} role="tablist">
      {tabs.map((t) => (
        <Tag key={t.key} label={t.label} count={t.count === undefined ? undefined : String(t.count).padStart(3, '0')} active={t.key === value} onPress={() => onChange(t.key)} />
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className={s.search}>
      <input className="mf-t-label2" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
      <Icon name="search" size={24} />
    </label>
  );
}

export const PAGE_SIZE = 5;

export function usePaged<T>(rows: T[], resetKey: string) {
  const [page, setPage] = useState(0);
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) {
    setKey(resetKey);
    setPage(0);
  }
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const p = Math.min(page, pages - 1);
  return { page: p, setPage, pages, rows: rows.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE), total: rows.length };
}

export function Pager({ page, pages, total, setPage }: { page: number; pages: number; total: number; setPage: (p: number) => void }) {
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  return (
    <div className={s.pager}>
      <Text variant="caption1" color={cssVar.text.secondary}>
        {from} - {to} of {total}
      </Text>
      <div className={s.row8}>
        <button type="button" className={s.pageBtn} disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <Icon name="chevron-left" size={16} />
        </button>
        <button type="button" className={s.pageBtn} data-primary="" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next page">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  );
}

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`${s.avatar} mf-t-h5`} style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}

export function EmptyState({ icon = 'box', title, body, action }: { icon?: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Icon name={icon} size={40} />
      </span>
      <Text variant="h4" as="h2" color={cssVar.text.heading}>
        {title}
      </Text>
      <Text variant="body3" as="p" color={cssVar.text.secondary}>
        {body}
      </Text>
      {action}
    </div>
  );
}

/* ---------- Loading ---------- */

const seen = new Set<string>();
/** True for a moment the first time a screen opens in this visit (Figma "… – loading" frames). */
export function useFirstLoad(key: string, ms = 700): boolean {
  const [loading, setLoading] = useState(() => !seen.has(key));
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      seen.add(key);
      setLoading(false);
    }, ms);
    return () => clearTimeout(t);
  }, [key, loading, ms]);
  return loading;
}

export function Skeleton({ rows = 5, cards = 0 }: { rows?: number; cards?: number }) {
  return (
    <div className={s.stack24} aria-busy="true" aria-label="Loading">
      {cards > 0 && (
        <div className={s.skelCards}>
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className={s.skel} style={{ height: 140 }} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.skel} style={{ height: 68 }} />
      ))}
    </div>
  );
}

/* ---------- CSV ---------- */

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Export ready', 'Your CSV has downloaded to this computer. Open it in Excel or Google Sheets.', 'info');
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const hhmmOf = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
export const dmyOf = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
};
