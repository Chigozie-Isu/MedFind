'use client';

import { Button, Logo, Text } from '@medfind/ui/web';
import { AuthPage, authStyles as s } from './parts';

/** Pharmacy Splash (Figma 2332:49341). */
export function Splash({ onSignIn, onCreateAccount }: { onSignIn: () => void; onCreateAccount: () => void }) {
  return (
    <AuthPage
      story={{
        headline: 'The pharmacy counter, now online.',
        body: 'Take reservations, check prescriptions and get paid every second Friday, all from one dashboard.',
      }}
    >
      <div className={s.formWrap}>
        <div className={s.splashBrand}>
          <Logo height={72} />
          <Text variant="body2" color="var(--mf-text-brand)">
            Reservations, prescriptions and payouts for your pharmacy, in one place.
          </Text>
        </div>
        <div className={s.splashButtons}>
          <Button label="Sign in" fullWidth onPress={onSignIn} />
          <Button label="Create a pharmacy account" variant="secondary" fullWidth onPress={onCreateAccount} />
        </div>
      </div>
    </AuthPage>
  );
}
