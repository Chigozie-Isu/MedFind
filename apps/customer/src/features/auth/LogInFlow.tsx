import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { customerLoginFailureErrors, hasErrors, validateCustomerLogin, type FieldErrors } from '@medfind/core';
import { Button, TextField } from '@medfind/ui/native';
import { isLogInFailure, logIn } from './authApi';
import {
  AuthHeader,
  AuthScreen,
  authStyles,
  FooterPrompt,
  SegmentTabs,
  SocialSignIn,
  socialComingSoon,
  useCountdown,
  useToast,
} from './parts';

type Field = 'identifier' | 'password';

export interface LogInState {
  identifier: string;
  password: string;
  errors: FieldErrors<Field>;
  loading: boolean;
  lockedSeconds: number;
}

const EMPTY: LogInState = { identifier: '', password: '', errors: {}, loading: false, lockedSeconds: 0 };

/**
 * Log in (Figma "Log in – …" frames): email or phone + password, with the required, invalid,
 * not found, wrong password, too many tries and loading states. `initial` and `demo` let the
 * dev gallery show each state without calling Supabase.
 */
export function LogInFlow({
  initial,
  demo,
  onLoggedIn,
  onSignUp,
  onForgotPassword,
}: {
  initial?: Partial<LogInState>;
  demo?: boolean;
  onLoggedIn: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}) {
  const [s, setS] = useState<LogInState>({ ...EMPTY, ...initial });
  const [toast, showToast] = useToast();
  const [lockLeft] = useCountdown(s.lockedSeconds);
  const locked = lockLeft > 0;

  // Keep the "Try again in 04:59 mins" message ticking, and clear it when the lock ends.
  useEffect(() => {
    if (s.lockedSeconds === 0) return;
    setS((p) => ({
      ...p,
      errors: lockLeft > 0 ? { ...p.errors, ...customerLoginFailureErrors('locked', lockLeft) } : { ...p.errors, password: undefined },
    }));
  }, [lockLeft, s.lockedSeconds]);

  const set = (field: Field) => (value: string) =>
    setS((p) => ({ ...p, [field]: value, errors: locked ? p.errors : { ...p.errors, [field]: undefined } }));

  const submit = async () => {
    const errors = validateCustomerLogin(s);
    if (hasErrors(errors)) return setS((p) => ({ ...p, errors }));
    if (demo) return;
    setS((p) => ({ ...p, loading: true, errors: {} }));
    const res = await logIn(s.identifier, s.password);
    if (res.ok) return onLoggedIn();
    if (isLogInFailure(res.reason)) {
      setS((p) => ({
        ...p,
        loading: false,
        lockedSeconds: res.lockedSeconds ?? 0,
        errors: customerLoginFailureErrors(res.reason as never, res.lockedSeconds ?? 0),
      }));
    } else {
      setS((p) => ({ ...p, loading: false }));
      showToast(res.reason);
    }
  };

  return (
    <AuthScreen
      toast={toast}
      footer={<FooterPrompt prompt="Don’t have an account yet?" action="Sign up" onPress={onSignUp} />}
    >
      <AuthHeader title="Welcome back" subtitle="It’s great to see you again!" />
      <SegmentTabs active="sign_in" onChange={onSignUp} />
      <View style={authStyles.fields}>
        <TextField
          label="Email or phone number"
          required
          info
          placeholder="you@example.com"
          value={s.identifier}
          onChangeText={set('identifier')}
          helperText="The email or phone number linked to your account"
          errorText={s.errors.identifier}
          keyboard="email"
          autoComplete="username"
        />
        <TextField
          label="Password"
          required
          info
          placeholder="Enter your password"
          value={s.password}
          onChangeText={set('password')}
          errorText={s.errors.password}
          secure
          autoComplete="current-password"
          onSubmitEditing={submit}
        />
        <View style={authStyles.right}>
          <Button label="Forgot password?" variant="text" size="small" onPress={onForgotPassword} />
        </View>
      </View>
      <Button
        label="Sign In"
        loadingLabel="Signing in…"
        fullWidth
        loading={s.loading}
        disabled={locked}
        onPress={submit}
      />
      <SocialSignIn onPress={(p) => showToast(socialComingSoon(p), 'info')} />
    </AuthScreen>
  );
}
