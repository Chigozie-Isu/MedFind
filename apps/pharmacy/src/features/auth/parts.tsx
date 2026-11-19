'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button, Logo, Text, Toast } from '@medfind/ui/web';
import type { ToastTone } from '@medfind/ui';
import s from './auth.module.css';

export const STATS = [
  { value: '2,400+', label: 'pharmacies' },
  { value: '4 min', label: 'average reply' },
  { value: 'Every 2 weeks', label: 'payouts' },
] as const;

/** "Picture story" on the photo: tag, headline, supporting text and the three stats. */
export function Story({ headline, body }: { headline: string; body: string }) {
  return (
    <div className={s.story}>
      <span className={`${s.tag} mf-t-caption1`}>MedFind for pharmacies</span>
      <Text variant="h3" as="h2" className={s.headline}>
        {headline}
      </Text>
      <Text variant="body2" color="#FFFFFF">
        {body}
      </Text>
      <div className={s.stats}>
        {STATS.map((st) => (
          <div key={st.label} className={s.stat}>
            <Text variant="h5" color="#FFFFFF">
              {st.value}
            </Text>
            <Text variant="caption1" color="#FFFFFF">
              {st.label}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Photo panel + form column used by Splash, Sign in and Forgot password. */
export function AuthPage({
  story,
  children,
  toast,
}: {
  story: { headline: string; body: string };
  children: ReactNode;
  toast?: { message: string; tone: ToastTone } | null;
}) {
  return (
    <div className={s.page}>
      <div className={s.photo} role="img" aria-label="A pharmacist hands a bag of medicine to a patient at the counter">
        <Story {...story} />
      </div>
      <main className={s.column}>{children}</main>
      {toast && (
        <div className={s.toast}>
          <Toast message={toast.message} tone={toast.tone} />
        </div>
      )}
    </div>
  );
}

export function FormHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className={s.header}>
      <Text variant="h2" as="h1" className={s.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="body3" color="var(--mf-text-secondary)">
          {subtitle}
        </Text>
      )}
    </div>
  );
}

export function SmallLogo() {
  return (
    <div style={{ paddingTop: 16, paddingBottom: 8 }}>
      <Logo height={36} />
    </div>
  );
}

export function SocialButtons({ onPress }: { onPress: (provider: 'Google' | 'Apple') => void }) {
  return (
    <>
      <div className={`${s.or} mf-t-caption1`}>OR CONTINUE WITH</div>
      <div className={s.social}>
        <Button label="Google" variant="secondary" iconLeft="google" fullWidth onPress={() => onPress('Google')} />
        <Button label="Apple" variant="secondary" iconLeft="apple" fullWidth onPress={() => onPress('Apple')} />
      </div>
    </>
  );
}

export function socialComingSoon(provider: 'Google' | 'Apple'): string {
  return `Sign in with ${provider} is coming soon. Use your email for now.`;
}

export function FooterPrompt({ prompt, action, href }: { prompt: string; action: string; href: string }) {
  return (
    <div className={s.center}>
      <Text variant="caption1" color="var(--mf-text-secondary)">
        {prompt}
      </Text>
      <a href={href} className={`${s.link} mf-t-button1`}>
        {action}
      </a>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, (message: string, tone: ToastTone = 'error') => setToast({ message, tone })] as const;
}

/** Counts down once a second to 0; `restart` starts again from `from`. */
export function useCountdown(from: number) {
  const [left, setLeft] = useState(from);
  const [epoch, setEpoch] = useState(0);
  useEffect(() => setLeft(from), [from, epoch]);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setEpoch((e) => e + 1)] as const;
}

export { s as authStyles };
