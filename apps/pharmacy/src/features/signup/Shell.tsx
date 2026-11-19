'use client';

import { useId, type ReactNode } from 'react';
import { PHARMACY_SIGNUP_STEPS, type PharmacySignupStep } from '@medfind/core';
import { sizes, type ToastTone } from '@medfind/ui';
import { Icon, Logo, Text, Toast } from '@medfind/ui/web';
import s from './signup.module.css';

export type StepStatus = 'pending' | 'current' | 'done';

export interface RailStep {
  key: PharmacySignupStep;
  status: StepStatus;
  /** The grey line under the step title. */
  detail: string;
}

/** Step rail (Figma "Progress indicator"), "Need a hand?" card and the illustration. */
export function Rail({ steps }: { steps: RailStep[] }) {
  return (
    <aside className={s.rail} aria-label="Sign-up steps">
      <Logo height={40} />
      <ol className={s.steps}>
        {steps.map((st, i) => {
          const title = PHARMACY_SIGNUP_STEPS.find((p) => p.key === st.key)!.title;
          return (
            <li key={st.key} className={s.step} aria-current={st.status === 'current' ? 'step' : undefined}>
              <span className={`${s.dot} mf-t-h5`} data-status={st.status}>
                {st.status === 'done' ? <Icon name="tick" size={24} accessibilityLabel="Done" /> : i + 1}
              </span>
              <span className={s.stepText}>
                <Text variant="h5" color="var(--mf-text-heading)">
                  {title}
                </Text>
                <Text variant="caption1" color="var(--mf-text-secondary)">
                  {st.detail}
                </Text>
              </span>
            </li>
          );
        })}
      </ol>
      <div className={s.help}>
        <Icon name="message" size={40} color="var(--mf-text-heading)" />
        <Text variant="h5" color="var(--mf-text-heading)">
          Need a hand?
        </Text>
        <Text variant="body3" color="var(--mf-text-secondary)">
          Our pharmacy team can help you get set up, 08:00 to 20:00 every day.
        </Text>
        <a className={`${s.helpLink} mf-t-caption1`} href="mailto:pharmacies@medfind.ng">
          <Icon name="document" size={sizes.icon.md} />
          Chat with us, 08:00 to 20:00
        </a>
      </div>
      <div className={s.railArt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/auth/rail.svg" width={250} height={181} alt="" />
      </div>
    </aside>
  );
}

export function SignupPage({
  rail,
  title,
  subtitle,
  children,
  toast,
}: {
  rail: RailStep[];
  title: string;
  subtitle: string;
  children: ReactNode;
  toast?: { message: string; tone: ToastTone } | null;
}) {
  return (
    <div className={s.page}>
      <Rail steps={rail} />
      <main className={s.main}>
        <header className={s.header}>
          <Text variant="h2" as="h1" className={s.title}>
            {title}
          </Text>
          <Text variant="body3" color="var(--mf-text-secondary)">
            {subtitle}
          </Text>
        </header>
        {children}
      </main>
      {toast && (
        <div className={s.toast}>
          <Toast message={toast.message} tone={toast.tone} />
        </div>
      )}
    </div>
  );
}

/** Select styled as an input field (Figma "City and state", "Bank"). */
export function SelectField({
  label,
  required,
  info,
  placeholder,
  value,
  options,
  onChange,
  helperText,
  errorText,
  disabled,
}: {
  label: string;
  required?: boolean;
  info?: boolean;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const state = disabled ? 'disabled' : errorText ? 'error' : value ? 'filled' : undefined;
  const helper = errorText ?? helperText;
  return (
    <div className="mf-field">
      <label htmlFor={id} className="mf-field-label mf-t-label1">
        <span>
          {label}
          {required && <span className="mf-field-required"> *</span>}
        </span>
        {info && <Icon name="info-circle" size={sizes.icon.xs} color="var(--mf-text-brand)" />}
      </label>
      <div className="mf-field-box" data-size="web" data-state={state}>
        <select
          id={id}
          className={`${s.select} mf-t-body3`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!errorText || undefined}
          aria-describedby={helper ? `${id}-help` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={s.selectChevron}>
          <Icon name="chevron-down" size={sizes.icon.md} />
        </span>
      </div>
      {helper && (
        <div id={`${id}-help`} className="mf-field-helper mf-t-caption2" data-error={errorText ? '' : undefined}>
          <Icon name={errorText ? 'danger-triangle' : 'info-circle'} size={sizes.icon.xs} />
          {helper}
        </div>
      )}
    </div>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.section}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <Text variant="h5" as="h2" className={s.sectionTitle} color="var(--mf-text-heading)">
          {title}
        </Text>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Notice({ icon = 'shield', children }: { icon?: 'shield' | 'info-circle'; children: ReactNode }) {
  return (
    <div className={`${s.notice} mf-t-body3`}>
      <Icon name={icon} size={sizes.icon.md} />
      <span>{children}</span>
    </div>
  );
}

export { s as signupStyles };
