import { useState } from 'react';
import { View } from 'react-native';
import {
  EMAIL_IN_USE_MESSAGE,
  hasErrors,
  normaliseEmail,
  normaliseNigerianPhone,
  PASSWORD_HINT,
  PHONE_IN_USE_MESSAGE,
  validateCustomerSignUp,
  type CustomerSignUpField,
  type FieldErrors,
} from '@medfind/core';
import { Button, TextField } from '@medfind/ui/native';
import { checkSignUp, signUpAndSendCode } from './authApi';
import { AuthHeader, AuthScreen, authStyles, FooterPrompt, SegmentTabs, SocialSignIn, socialComingSoon, StepBar, useToast } from './parts';

export interface SignUpState {
  email: string;
  phone: string;
  password: string;
  errors: FieldErrors<CustomerSignUpField>;
  loading: boolean;
}

const EMPTY: SignUpState = { email: '', phone: '', password: '', errors: {}, loading: false };

/**
 * Sign up step 1 of 2 (Figma "Sign up – …" frames): email, phone and password, with the
 * required, invalid, email in use, weak password and loading states. On success the account
 * exists and a code has been texted; `onCodeSent` gets the number in +234 form.
 */
export function SignUpFlow({
  initial,
  demo,
  onCodeSent,
  onSignIn,
}: {
  initial?: Partial<SignUpState>;
  demo?: boolean;
  onCodeSent: (phone: string) => void;
  onSignIn: () => void;
}) {
  const [s, setS] = useState<SignUpState>({ ...EMPTY, ...initial });
  const [toast, showToast] = useToast();

  const set = (field: CustomerSignUpField) => (value: string) =>
    setS((p) => ({ ...p, [field]: value, errors: { ...p.errors, [field]: undefined } }));

  const submit = async () => {
    const errors = validateCustomerSignUp(s);
    if (hasErrors(errors)) return setS((p) => ({ ...p, errors }));
    if (demo) return;
    const email = normaliseEmail(s.email);
    const phone = normaliseNigerianPhone(s.phone)!;
    setS((p) => ({ ...p, loading: true, errors: {} }));

    const check = await checkSignUp(email, phone);
    if (!check.ok) {
      setS((p) => ({ ...p, loading: false }));
      return showToast(check.reason);
    }
    if (check.value.emailInUse || check.value.phoneInUse) {
      return setS((p) => ({
        ...p,
        loading: false,
        errors: {
          email: check.value.emailInUse ? EMAIL_IN_USE_MESSAGE : undefined,
          phone: check.value.phoneInUse ? PHONE_IN_USE_MESSAGE : undefined,
        },
      }));
    }
    const res = await signUpAndSendCode(email, phone, s.password);
    setS((p) => ({ ...p, loading: false }));
    if (res.ok) return onCodeSent(phone);
    if (res.reason === 'email_in_use') return setS((p) => ({ ...p, errors: { email: EMAIL_IN_USE_MESSAGE } }));
    if (res.reason === 'phone_in_use') return setS((p) => ({ ...p, errors: { phone: PHONE_IN_USE_MESSAGE } }));
    showToast(res.reason);
  };

  return (
    <AuthScreen
      toast={toast}
      footer={<FooterPrompt prompt="Already have an account?" action="Sign in" onPress={onSignIn} />}
    >
      <AuthHeader title="Create your account" subtitle="Access pharmacies around you with ease" />
      <StepBar step={1} />
      <SegmentTabs active="sign_up" onChange={onSignIn} />
      <View style={authStyles.fields}>
        <TextField
          label="Email"
          required
          info
          placeholder="you@example.com"
          value={s.email}
          onChangeText={set('email')}
          helperText="We’ll send a code to confirm it"
          errorText={s.errors.email}
          keyboard="email"
          autoComplete="email"
        />
        <TextField
          label="Phone number"
          required
          info
          placeholder="0803 123 4567"
          value={s.phone}
          onChangeText={set('phone')}
          helperText="Pharmacies can call you about your reservation"
          errorText={s.errors.phone}
          keyboard="phone"
          autoComplete="tel"
        />
        <TextField
          label="Password"
          required
          info
          placeholder="Create a password"
          value={s.password}
          onChangeText={set('password')}
          helperText={PASSWORD_HINT}
          errorText={s.errors.password}
          secure
          autoComplete="new-password"
          onSubmitEditing={submit}
        />
      </View>
      <Button label="Sign Up" loadingLabel="Creating account…" fullWidth loading={s.loading} onPress={submit} />
      <SocialSignIn onPress={(p) => showToast(socialComingSoon(p), 'info')} />
    </AuthScreen>
  );
}
