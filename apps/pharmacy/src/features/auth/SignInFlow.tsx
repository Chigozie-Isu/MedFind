'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  hasErrors,
  pharmacySignInFailureErrors,
  validatePharmacySignIn,
  type FieldErrors,
  type PharmacySignInField,
} from '@medfind/core';
import { Button, TextField } from '@medfind/ui/web';
import { isSignInFailure, signIn, type SignInOutcome } from './api';
import { AuthPage, FooterPrompt, FormHeader, SmallLogo, SocialButtons, socialComingSoon, authStyles as s, useCountdown, useToast } from './parts';

export interface SignInState {
  email: string;
  passcode: string;
  password: string;
  errors: FieldErrors<PharmacySignInField>;
  loading: boolean;
  lockedSeconds: number;
}

const EMPTY: SignInState = { email: '', passcode: '', password: '', errors: {}, loading: false, lockedSeconds: 0 };
const PASSCODE_REQUIRED = 'Enter your staff passcode';

/**
 * Pharmacy Sign in (Figma "Sign in – …" frames): email, staff passcode and password, with the
 * required, invalid, not found, wrong passcode, wrong password, too many attempts and loading states.
 */
export function SignInFlow({
  initial,
  demo,
  onSignedIn,
  onForgotPassword,
}: {
  initial?: Partial<SignInState>;
  demo?: boolean;
  onSignedIn: (outcome: SignInOutcome) => void;
  onForgotPassword: () => void;
}) {
  const [st, setSt] = useState<SignInState>({ ...EMPTY, ...initial });
  const [toast, showToast] = useToast();
  const [lockLeft] = useCountdown(st.lockedSeconds);
  const locked = lockLeft > 0;

  useEffect(() => {
    if (st.lockedSeconds === 0) return;
    setSt((p) => ({
      ...p,
      errors: lockLeft > 0 ? { ...p.errors, ...pharmacySignInFailureErrors('locked', lockLeft) } : { ...p.errors, password: undefined },
    }));
  }, [lockLeft, st.lockedSeconds]);

  const set = (field: PharmacySignInField) => (value: string) =>
    setSt((p) => ({ ...p, [field]: value, errors: locked ? p.errors : { ...p.errors, [field]: undefined } }));

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (locked || st.loading) return;
    const errors = validatePharmacySignIn(st);
    // An owner who hasn't finished sign up has no passcode yet, so an empty passcode alone
    // doesn't stop the attempt; the server decides.
    const onlyPasscodeMissing = errors.passcode === PASSCODE_REQUIRED && !errors.email && !errors.password;
    if (hasErrors(errors) && !onlyPasscodeMissing) return setSt((p) => ({ ...p, errors }));
    if (demo) return;
    setSt((p) => ({ ...p, loading: true, errors: {} }));
    const res = await signIn(st.email, st.password, st.passcode);
    if (res.ok) return onSignedIn(res.value);
    if (isSignInFailure(res.reason)) {
      const errs =
        res.reason === 'passcode_required' ? { passcode: PASSCODE_REQUIRED } : pharmacySignInFailureErrors(res.reason, res.lockedSeconds ?? 0);
      setSt((p) => ({ ...p, loading: false, lockedSeconds: res.lockedSeconds ?? 0, errors: errs }));
    } else {
      setSt((p) => ({ ...p, loading: false }));
      showToast(res.reason);
    }
  };

  return (
    <AuthPage
      toast={toast}
      story={{
        headline: 'Your reservations are waiting.',
        body: 'Sign in to review prescriptions, confirm pickups and keep your stock up to date.',
      }}
    >
      <SmallLogo />
      <form className={s.formWrap} onSubmit={submit} noValidate>
        <FormHeader title="Welcome back" subtitle="It’s great to see you again!" />
        <div className={s.form}>
          <TextField
            label="Email"
            required
            info
            size="web"
            placeholder="you@yourpharmacy.ng"
            value={st.email}
            onChangeText={set('email')}
            errorText={st.errors.email}
            keyboard="email"
            autoComplete="username"
          />
          <TextField
            label="Passcode"
            required
            info
            size="web"
            placeholder="5-digit staff code"
            value={st.passcode}
            onChangeText={set('passcode')}
            errorText={st.errors.passcode}
            keyboard="number"
            autoComplete="off"
          />
          <TextField
            label="Password"
            required
            info
            size="web"
            placeholder="Enter your password"
            value={st.password}
            onChangeText={set('password')}
            errorText={st.errors.password}
            secure
            autoComplete="current-password"
          />
          <div className={s.right}>
            <Button label="Forgot password?" variant="text" size="medium" onPress={onForgotPassword} />
          </div>
        </div>
        <Button label="Sign in" loadingLabel="Signing in…" type="submit" fullWidth loading={st.loading} disabled={locked} />
        <SocialButtons onPress={(p) => showToast(socialComingSoon(p), 'info')} />
        <div className={s.spacer} />
        <FooterPrompt prompt="Don’t have an account yet?" action="Sign up" href="/sign-up" />
      </form>
    </AuthPage>
  );
}
