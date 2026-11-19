'use client';

import { useState, type FormEvent } from 'react';
import {
  formatCountdown,
  hasErrors,
  isCompleteCode,
  OTP_MAX_TRIES,
  OTP_RESEND_SECONDS,
  validateForgotIdentifier,
  validateNewPassword,
  wrongCodeMessage,
  type FieldErrors,
} from '@medfind/core';
import { Button, Icon, Text, TextField } from '@medfind/ui/web';
import { saveNewPassword, sendResetCode, verifyResetCode } from './api';
import { AuthPage, FooterPrompt, FormHeader, SmallLogo, authStyles as s, useCountdown, useToast } from './parts';

export type ForgotStep = 'email' | 'code' | 'new' | 'done';

export interface ForgotState {
  step: ForgotStep;
  email: string;
  emailError: string | null;
  code: string;
  triesUsed: number;
  codeError: string | null;
  password: string;
  confirm: string;
  passwordErrors: FieldErrors<'password' | 'confirm'>;
  pharmacyName: string;
  busy: boolean;
}

const EMPTY: ForgotState = {
  step: 'email',
  email: '',
  emailError: null,
  code: '',
  triesUsed: 0,
  codeError: null,
  password: '',
  confirm: '',
  passwordErrors: {},
  pharmacyName: 'MedFind',
  busy: false,
};

const STORY = {
  headline: 'Your reservations are waiting.',
  body: 'Sign in to review prescriptions, confirm pickups and keep your stock up to date.',
};

/** Pharmacy Forgot password (Figma "Forgot password – …" frames): email, code, new password, changed. */
export function ForgotFlow({ initial, demo, onSignIn }: { initial?: Partial<ForgotState>; demo?: boolean; onSignIn: () => void }) {
  const [st, setSt] = useState<ForgotState>({ ...EMPTY, ...initial });
  const [resendLeft, restartResend] = useCountdown(st.step === 'code' ? OTP_RESEND_SECONDS : 0);
  const [toast, showToast] = useToast();
  const patch = (p: Partial<ForgotState>) => setSt((prev) => ({ ...prev, ...p }));
  const outOfTries = st.triesUsed >= OTP_MAX_TRIES;

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const emailError = validateForgotIdentifier(st.email, 'pharmacy');
    if (emailError) return patch({ emailError });
    if (demo) return;
    patch({ busy: true });
    const res = await sendResetCode(st.email);
    patch({ busy: false });
    if (!res.ok) return showToast(res.reason);
    if (st.step === 'code') showToast(`We sent a new code to ${st.email.trim()}`, 'success');
    patch({ step: 'code', code: '', triesUsed: 0, codeError: null });
    restartResend();
  };

  const verify = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!isCompleteCode(st.code)) return patch({ codeError: 'Enter the 6-digit code' });
    if (outOfTries || demo) return;
    patch({ busy: true, codeError: null });
    const res = await verifyResetCode(st.email, st.code);
    if (res.ok) return patch({ busy: false, step: 'new', pharmacyName: res.value });
    if (res.reason === 'bad_code') {
      const triesUsed = st.triesUsed + 1;
      return patch({ busy: false, triesUsed, codeError: wrongCodeMessage(triesUsed) });
    }
    patch({ busy: false });
    showToast(res.reason);
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    const passwordErrors = validateNewPassword({ password: st.password, confirm: st.confirm });
    if (hasErrors(passwordErrors)) return patch({ passwordErrors });
    if (demo) return;
    patch({ busy: true });
    const res = await saveNewPassword(st.password);
    patch({ busy: false });
    if (res.ok) return patch({ step: 'done' });
    showToast(res.reason === 'same_password' ? 'Use a password you haven’t used on MedFind before.' : res.reason);
  };

  return (
    <AuthPage story={STORY} toast={toast}>
      <SmallLogo />
      {st.step === 'email' && (
        <form className={s.formWrap} onSubmit={sendCode} noValidate>
          <FormHeader title="Reset your password" subtitle="Enter the email linked to your pharmacy. We’ll send you a 6-digit code." />
          <TextField
            label="Email"
            required
            size="web"
            placeholder="you@yourpharmacy.ng"
            value={st.email}
            onChangeText={(email) => patch({ email, emailError: null })}
            errorText={st.emailError ?? undefined}
            keyboard="email"
            autoComplete="username"
          />
          <Button label="Send code" type="submit" fullWidth loading={st.busy} />
          <div className={s.spacer} />
          <FooterPrompt prompt="Remembered it?" action="Sign in" href="/sign-in" />
        </form>
      )}

      {st.step === 'code' && (
        <form className={s.formWrap} onSubmit={verify} noValidate>
          <FormHeader
            title="Check your email"
            subtitle={`We sent a 6-digit code to ${st.email.trim()}. It expires in 10 minutes.`}
          />
          <TextField
            label="Code"
            required
            size="web"
            placeholder="Enter the 6-digit code"
            value={st.code}
            onChangeText={(code) => patch({ code: code.replace(/\D/g, '').slice(0, 6), codeError: outOfTries ? st.codeError : null })}
            errorText={st.codeError ?? undefined}
            keyboard="number"
            autoComplete="one-time-code"
          />
          <Button label="Verify code" type="submit" fullWidth loading={st.busy} disabled={outOfTries} />
          <div className={s.center}>
            <Text variant="caption1" color="var(--mf-text-secondary)">
              Didn’t get it?
            </Text>
            <button type="button" className={`${s.link} mf-t-button2`} disabled={resendLeft > 0 && !outOfTries} onClick={() => sendCode()}>
              {resendLeft > 0 && !outOfTries ? `Resend code in ${formatCountdown(resendLeft)}` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {st.step === 'new' && (
        <form className={s.formWrap} onSubmit={save} noValidate>
          <FormHeader title="Create a new password" subtitle="Use at least 8 characters, with a number and a symbol." />
          <div className={s.form}>
            <TextField
              label="New password"
              required
              size="web"
              placeholder="Enter a new password"
              value={st.password}
              onChangeText={(password) => patch({ password, passwordErrors: { ...st.passwordErrors, password: undefined } })}
              errorText={st.passwordErrors.password}
              secure
              autoComplete="new-password"
            />
            <TextField
              label="Confirm password"
              required
              size="web"
              placeholder="Enter it again"
              value={st.confirm}
              onChangeText={(confirm) => patch({ confirm, passwordErrors: { ...st.passwordErrors, confirm: undefined } })}
              errorText={st.passwordErrors.confirm}
              secure
              autoComplete="new-password"
            />
          </div>
          <Button label="Save new password" type="submit" fullWidth loading={st.busy} />
        </form>
      )}

      {st.step === 'done' && (
        <div className={s.formWrap}>
          <div className={s.done}>
            <div className={s.badge}>
              <Icon name="shield-tick" size={32} />
            </div>
            <FormHeader title="Password changed" />
            <Text variant="body3" color="var(--mf-text-secondary)">
              {`You can now sign in to ${st.pharmacyName} with your new password.`}
            </Text>
          </div>
          <Button label="Sign in" fullWidth onPress={onSignIn} />
        </div>
      )}
    </AuthPage>
  );
}
