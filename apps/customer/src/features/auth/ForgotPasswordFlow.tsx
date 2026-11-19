import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  formatCountdown,
  hasErrors,
  isCompleteCode,
  maskEmail,
  maskPhone,
  OTP_LENGTH,
  OTP_MAX_TRIES,
  OTP_RESEND_SECONDS,
  parseLoginIdentifier,
  validateForgotIdentifier,
  validateNewPassword,
  wrongCodeMessage,
  type FieldErrors,
  type LoginIdentifier,
} from '@medfind/core';
import { space } from '@medfind/ui';
import { Button, CodeInput, Icon, Text, TextField, useTheme } from '@medfind/ui/native';
import { saveNewPassword, sendResetCode, verifyResetCode } from './authApi';
import { AuthHeader, AuthScreen, authStyles, BackButton, CodeError, FooterPrompt, PasswordCheckList, useCountdown, useToast } from './parts';

export type ForgotStep = 'enter' | 'code' | 'new' | 'done';

export interface ForgotState {
  step: ForgotStep;
  identifier: string;
  identifierError: string | null;
  code: string;
  triesUsed: number;
  codeError: string | null;
  password: string;
  confirm: string;
  passwordErrors: FieldErrors<'password' | 'confirm'>;
  busy: boolean;
}

const EMPTY: ForgotState = {
  step: 'enter',
  identifier: '',
  identifierError: null,
  code: '',
  triesUsed: 0,
  codeError: null,
  password: '',
  confirm: '',
  passwordErrors: {},
  busy: false,
};

/**
 * Forgot password (Figma "Forgot password – …" frames): enter email or phone, enter the
 * 6-digit code (wrong code, resend), create a new password with live checks, password changed.
 */
export function ForgotPasswordFlow({
  initial,
  demo,
  onSignIn,
}: {
  initial?: Partial<ForgotState>;
  demo?: boolean;
  onSignIn: () => void;
}) {
  const { colors } = useTheme();
  const [s, setS] = useState<ForgotState>({ ...EMPTY, ...initial });
  const [resendLeft, restartResend] = useCountdown(s.step === 'code' ? OTP_RESEND_SECONDS : 0);
  const [toast, showToast] = useToast();
  const id: LoginIdentifier | null = parseLoginIdentifier(s.identifier);
  const masked = id ? (id.kind === 'email' ? maskEmail(id.value) : maskPhone(id.value)) : s.identifier;
  const outOfTries = s.triesUsed >= OTP_MAX_TRIES;
  const patch = (p: Partial<ForgotState>) => setS((prev) => ({ ...prev, ...p }));

  const sendCode = async () => {
    const error = validateForgotIdentifier(s.identifier, 'customer');
    if (error) return patch({ identifierError: error });
    if (demo) return;
    patch({ busy: true });
    const res = await sendResetCode(id!);
    patch({ busy: false });
    if (!res.ok) return showToast(res.reason);
    patch({ step: 'code', code: '', triesUsed: 0, codeError: null });
    restartResend();
  };

  const verify = async () => {
    if (!isCompleteCode(s.code) || outOfTries || demo) return;
    patch({ busy: true, codeError: null });
    const res = await verifyResetCode(id!, s.code);
    if (res.ok) return patch({ busy: false, step: 'new' });
    if (res.reason === 'bad_code') {
      const triesUsed = s.triesUsed + 1;
      return patch({ busy: false, triesUsed, codeError: wrongCodeMessage(triesUsed) });
    }
    patch({ busy: false });
    showToast(res.reason);
  };

  const save = async () => {
    const passwordErrors = validateNewPassword({ password: s.password, confirm: s.confirm });
    if (hasErrors(passwordErrors)) return patch({ passwordErrors });
    if (demo) return;
    patch({ busy: true });
    const res = await saveNewPassword(s.password);
    patch({ busy: false });
    if (res.ok) return patch({ step: 'done' });
    showToast(res.reason === 'same_password' ? 'Use a password you haven’t used on MedFind before.' : res.reason);
  };

  if (s.step === 'enter') {
    return (
      <AuthScreen
        topGap={space.md}
        toast={toast}
        footer={
          <View style={authStyles.bottom}>
            <Button label="Send code" fullWidth loading={s.busy} onPress={sendCode} />
            <FooterPrompt prompt="Remembered it?" action="Sign in" onPress={onSignIn} />
          </View>
        }
      >
        <BackButton onPress={onSignIn} />
        <AuthHeader
          title="Reset your password"
          subtitle="Enter the email or phone number on your account and we’ll send you a 6-digit code."
        />
        <TextField
          label="Email or phone number"
          required
          placeholder="you@example.com"
          value={s.identifier}
          onChangeText={(identifier) => patch({ identifier, identifierError: null })}
          errorText={s.identifierError ?? undefined}
          keyboard="email"
          autoComplete="username"
          onSubmitEditing={sendCode}
        />
      </AuthScreen>
    );
  }

  if (s.step === 'code') {
    return (
      <AuthScreen
        topGap={space.md}
        toast={toast}
        footer={
          <View style={authStyles.bottom}>
            <Button label="Verify code" fullWidth loading={s.busy} disabled={outOfTries} onPress={verify} />
            {s.codeError ? (
              <Button label="Send a new code" variant="text" size="large" onPress={sendCode} />
            ) : (
              <Button
                label="Use a different email or phone"
                variant="text"
                size="large"
                onPress={() => patch({ step: 'enter', code: '', codeError: null })}
              />
            )}
          </View>
        }
      >
        <BackButton onPress={() => patch({ step: 'enter', code: '', codeError: null })} />
        <AuthHeader
          title="Enter the code"
          subtitle={`We sent a ${OTP_LENGTH}-digit code to ${masked}. It expires in 10 minutes.`}
        />
        <View style={styles.code}>
          <CodeInput
            length={OTP_LENGTH}
            value={s.code}
            onChangeText={(code) => patch({ code, codeError: outOfTries ? s.codeError : null })}
            error={!!s.codeError}
            accessibilityLabel="6-digit code"
          />
          {s.codeError ? (
            <CodeError message={s.codeError} />
          ) : (
            <View style={authStyles.row}>
              <Text variant="caption1" color="secondary">Didn’t get it?</Text>
              <Button
                label={resendLeft > 0 ? `Resend in ${formatCountdown(resendLeft)}` : 'Resend code'}
                variant="text"
                size="small"
                disabled={resendLeft > 0}
                onPress={sendCode}
              />
            </View>
          )}
        </View>
      </AuthScreen>
    );
  }

  if (s.step === 'new') {
    return (
      <AuthScreen
        topGap={space.md}
        toast={toast}
        footer={
          <View style={authStyles.bottom}>
            <Button label="Save new password" fullWidth loading={s.busy} onPress={save} />
          </View>
        }
      >
        <BackButton onPress={onSignIn} />
        <AuthHeader title="Create a new password" subtitle="Use one you don’t use for other apps." />
        <View style={authStyles.fields}>
          <TextField
            label="New password"
            required
            placeholder="Enter a new password"
            value={s.password}
            onChangeText={(password) => patch({ password, passwordErrors: { ...s.passwordErrors, password: undefined } })}
            errorText={s.passwordErrors.password}
            secure
            autoComplete="new-password"
          />
          <TextField
            label="Confirm new password"
            required
            placeholder="Enter it again"
            value={s.confirm}
            onChangeText={(confirm) => patch({ confirm, passwordErrors: { ...s.passwordErrors, confirm: undefined } })}
            errorText={s.passwordErrors.confirm}
            secure
            autoComplete="new-password"
            onSubmitEditing={save}
          />
        </View>
        <PasswordCheckList password={s.password} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      topGap={space.md}
      footer={
        <View style={authStyles.bottom}>
          <Button label="Sign in" fullWidth onPress={onSignIn} />
        </View>
      }
    >
      <View style={styles.done}>
        <View style={[styles.badge, { backgroundColor: colors.tone.success.bg }]}>
          <Icon name="shield-tick" size={32} color={colors.text.success} />
        </View>
        <Text variant="h2" style={styles.centerText} accessibilityRole="header">Password changed</Text>
        <Text variant="caption1" color="secondary" style={styles.centerText}>
          Sign in with your new password. We’ve signed you out on your other devices.
        </Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  code: { gap: space.md },
  done: { gap: space.md, paddingTop: space.lg, alignItems: 'center' },
  badge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
});
