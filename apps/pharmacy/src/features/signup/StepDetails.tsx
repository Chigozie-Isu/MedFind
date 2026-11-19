'use client';

import dynamic from 'next/dynamic';
import { useCallback, type FormEvent } from 'react';
import {
  cityLabel,
  PASSWORD_HINT,
  PHARMACY_CITIES,
  PIN_HELP,
  type FieldErrors,
  type PharmacyDetailsField,
  type PharmacyDetailsInput,
} from '@medfind/core';
import { sizes } from '@medfind/ui';
import { Button, Checkbox, Icon, Text, TextField } from '@medfind/ui/web';
import type { LatLng } from './PinMap';
import { Section, SelectField, signupStyles as s } from './Shell';

const PinMap = dynamic(() => import('./PinMap'), { ssr: false, loading: () => null });

/** Where the map looks before the pin is placed. */
const CITY_CENTRES: Record<string, LatLng> = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  'Port Harcourt': { lat: 4.8156, lng: 7.0498 },
  Ibadan: { lat: 7.3775, lng: 3.947 },
  Kano: { lat: 12.0022, lng: 8.592 },
  'Benin City': { lat: 6.335, lng: 5.6037 },
  Enugu: { lat: 6.4584, lng: 7.5464 },
};

export function centreFor(cityState: string): LatLng {
  const c = PHARMACY_CITIES.find((x) => cityLabel(x) === cityState);
  return CITY_CENTRES[c?.city ?? 'Lagos'];
}

/** Step 1 (Figma "Sign up step 1 – …"): pharmacy details, the map pin and the superintendent. */
export function StepDetails({
  value,
  errors,
  includeAccount,
  submitting,
  hideMap,
  onChange,
  onContinue,
}: {
  value: PharmacyDetailsInput;
  errors: FieldErrors<PharmacyDetailsField>;
  /** False once the account exists (editing from Review): no email or password fields. */
  includeAccount: boolean;
  submitting: boolean;
  /** The dev gallery skips the live map tiles. */
  hideMap?: boolean;
  onChange: (patch: Partial<PharmacyDetailsInput>) => void;
  onContinue: () => void;
}) {
  const field = (k: keyof PharmacyDetailsInput) => (v: string) => onChange({ [k]: v } as Partial<PharmacyDetailsInput>);
  const onPin = useCallback((pin: LatLng) => onChange({ pin }), [onChange]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Section title="Pharmacy details">
        <div className={s.grid}>
          <TextField label="Pharmacy name" required info size="web" placeholder="e.g. Fuasi Pharmacy" value={value.pharmacyName}
            onChangeText={field('pharmacyName')} helperText="As it appears on your premises licence" errorText={errors.pharmacyName} />
          <TextField label="Pharmacy phone" required info size="web" placeholder="+234 800 000 0000" value={value.phone}
            onChangeText={field('phone')} helperText="Patients can call this number" errorText={errors.phone} keyboard="phone" autoComplete="tel" />
          <TextField label="Street" required info size="web" placeholder="e.g. No. 50 EVO Road" value={value.street}
            onChangeText={field('street')} helperText="House number and street name" errorText={errors.street} />
          <TextField label="Area" required info size="web" placeholder="e.g. GRA Phase 2" value={value.area}
            onChangeText={field('area')} helperText="Neighbourhood or estate" errorText={errors.area} />
          <SelectField
            label="City and state"
            required
            info
            placeholder="Choose your city"
            value={value.cityState}
            options={PHARMACY_CITIES.map((c) => ({ value: cityLabel(c), label: cityLabel(c) }))}
            onChange={(cityState) => onChange({ cityState })}
            helperText="Where your pharmacy is"
            errorText={errors.cityState}
          />
          <TextField label="Landmark (optional)" info size="web" placeholder="e.g. Off Nibble restaurant" value={value.landmark}
            onChangeText={field('landmark')} helperText="Helps riders and patients find your door" />
        </div>
      </Section>

      <Section title="Pin your door">
        <div className={s.map}>
          {!hideMap && <PinMap center={centreFor(value.cityState)} pin={value.pin} onPin={onPin} />}
          <div className={`${s.mapHint} mf-t-caption1`}>{value.pin ? 'Pin placed. Drag it again to adjust.' : PIN_HELP}</div>
        </div>
        {errors.pin ? (
          <div className={`${s.mapError} mf-t-caption2`} role="alert">
            <Icon name="danger-triangle" size={sizes.icon.xs} />
            {errors.pin}
          </div>
        ) : (
          <div className="mf-field-helper mf-t-caption2">
            <Icon name="info-circle" size={sizes.icon.xs} />
            {PIN_HELP}
          </div>
        )}
      </Section>

      <Section title="Superintendent details">
        <div className={s.grid}>
          <TextField label="Full name" required info size="web" placeholder="e.g. Yusuf Bilal" value={value.superintendentName}
            onChangeText={field('superintendentName')} helperText="As it appears on your PCN licence" errorText={errors.superintendentName} autoComplete="name" />
          <TextField label="PCN registration number" required info size="web" placeholder="e.g. PCN 0081 4472" value={value.pcnNumber}
            onChangeText={field('pcnNumber')} helperText="On your PCN annual licence" errorText={errors.pcnNumber} />
          {includeAccount && (
            <>
              <div className={s.full}>
                <TextField label="Work email" required info size="web" placeholder="you@yourpharmacy.ng" value={value.email}
                  onChangeText={field('email')} helperText="We’ll send updates and sign-in codes here" errorText={errors.email} keyboard="email" autoComplete="email" />
              </div>
              <TextField label="Password" required info size="web" placeholder="Create a password" value={value.password}
                onChangeText={field('password')} helperText={PASSWORD_HINT} errorText={errors.password} secure autoComplete="new-password" />
              <TextField label="Confirm password" required info size="web" placeholder="Type it again" value={value.confirmPassword}
                onChangeText={field('confirmPassword')} helperText="Type the same password again" errorText={errors.confirmPassword} secure autoComplete="new-password" />
            </>
          )}
        </div>
        {includeAccount && (
          <div>
            <div className={s.terms}>
              <Checkbox checked={value.agreedToTerms} onChange={(agreedToTerms) => onChange({ agreedToTerms })} accessibilityLabel="Agree to the MedFind Terms" />
              <Text variant="body3" color="var(--mf-text-heading)">
                I agree to the MedFind Terms including the 5% fee on reserved sales, and the Privacy Policy
              </Text>
            </div>
            {errors.agreedToTerms && (
              <div className={`${s.mapError} mf-t-caption2`} style={{ marginTop: 8 }} role="alert">
                <Icon name="danger-triangle" size={sizes.icon.xs} />
                {errors.agreedToTerms}
              </div>
            )}
          </div>
        )}
      </Section>

      <div className={s.actions}>
        {includeAccount ? (
          <span className="mf-t-caption1" style={{ color: 'var(--mf-text-secondary)' }}>
            Already have an account?{' '}
            <a href="/sign-in" className="mf-t-button2" style={{ color: 'var(--mf-text-brand)', textDecoration: 'none', marginLeft: 8 }}>
              Sign in
            </a>
          </span>
        ) : (
          <span />
        )}
        <Button label="Continue" loadingLabel="Saving…" type="submit" loading={submitting} />
      </div>
    </form>
  );
}
