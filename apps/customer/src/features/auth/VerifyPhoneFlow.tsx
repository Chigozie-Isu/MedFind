import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  formatPhoneInternational,
  isCompleteCode,
  maskEmail,
  OTP_LENGTH,
  OTP_MAX_TRIES,
  OTP_RESEND_SECONDS,
  wrongCodeMessage,
} from '@medfind/core';
import { sizes, space } from '@medfind/ui';
import { Button, CodeInput, Icon, Text, useTheme } from '@medfind/ui/native';
import { sendEmailCode, sendPhoneCode, signedUpEmail, verifyEmailCode, verifyPhoneCode } from './authApi';
import { AuthHeader, AuthScreen, authStyles, BackButton, CodeError, StepBar, TimerPill, UnderlineLink, useCountdown, useToast } from './parts';

export interface VerifyState {
  /** Where the code went: the phone number, or the sign-up email after "Send code to email instead". */
  channel: 'phone' | 'email';
  email: string | null;
  code: string;
  triesUsed: number;
  error: string | null;
  verifying: boolean;
  verified: boolean;
  /** Seconds until "Resend code" works. */
  resendIn: number;
}

/**
 * Sign up step 2 of 2 (Figma "Verify phone – …" frames): enter the 6-digit code, wrong code,
 * resend, verifying, verified, and "Send code to email instead".
 */
export function VerifyPhoneFlow({
  phone,
  initial,
  demo,
  onEditNumber,
  onVerified,
}: {
  /** +234 form. */
  phone: string;
  initial?: Partial<VerifyState>;
  demo?: boolean;
  onEditNumber: () => void;
  onVerified: () => void;
}) {
  const { colors } = useTheme();
  const [s, setS] = useState<VerifyState>({
    channel: 'phone',
    email: null,
    code: '',
    triesUsed: 0,
    error: null,
    verifying: false,
    verified: false,
    resendIn: OTP_RESEND_SECONDS,
    ...initial,
  });
  const [resendLeft, restartResend] = useCountdown(s.resendIn);
  const [toast, showToast] = useToast();
  const outOfTries = s.triesUsed >= OTP_MAX_TRIES;
  const destination = s.channel === 'email' && s.email ? maskEmail(s.email) : formatPhoneInternational(phone);

  const verify = async () => {
    if (!isCompleteCode(s.code) || outOfTries || demo) return;
    setS((p) => ({ ...p, verifying: true, error: null }));
    const res =
      s.channel === 'email' && s.email ? await verifyEmailCode(s.email, s.code) : await verifyPhoneCode(phone, s.code);
    if (res.ok) return setS((p) => ({ ...p, verifying: false, verified: true }));
    if (res.reason === 'bad_code') {
      const triesUsed = s.triesUsed + 1;
      return setS((p) => ({ ...p, verifying: false, triesUsed, error: wrongCodeMessage(triesUsed), code: '' }));
    }
    setS((p) => ({ ...p, verifying: false }));
    showToast(res.reason);
  };

  const resend = async (channel: 'phone' | 'email' = s.channel) => {
    if (demo) return;
    let email = s.email;
    if (channel === 'email') {
      email = email ?? (await signedUpEmail());
      if (!email) return showToast('We couldn’t find your email. Go back and check it.');
    }
    const res = channel === 'email' ? await sendEmailCode(email!) : await sendPhoneCode(phone);
    if (!res.ok) return showToast(res.reason);
    setS((p) => ({ ...p, channel, email, code: '', triesUsed: 0, error: null, resendIn: OTP_RESEND_SECONDS }));
    restartResend();
    showToast(channel === 'email' ? `We sent a new code to ${maskEmail(email!)}` : 'We sent you a new code', 'success');
  };

  if (s.verified) {
    return (
      <AuthScreen topGap={space.md} footer={<View style={authStyles.bottom}><Button label="Continue" fullWidth onPress={onVerified} /></View>}>
        <BackButton onPress={onEditNumber} />
        <StepBar step={2} />
        <AuthHeader
          muted
          title={s.channel === 'email' ? 'Email verified' : 'Phone number verified'}
          subtitle={
            <View style={authStyles.row}>
              <Text variant="caption1" color="secondary">{s.channel === 'email' ? 'Verified email' : 'Verified number'}</Text>
              <Text variant="caption1" color="secondary">{destination}</Text>
            </View>
          }
        />
        <View style={styles.tick}>
          <Icon name="tick-circle" size={80} color={colors.text.success} accessibilityLabel="Verified" />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      topGap={space.md}
      toast={toast}
      footer={
        <View style={authStyles.bottom}>
          <Button
            label={isCompleteCode(s.code) ? 'Continue' : 'Verify'}
            loadingLabel="Verifying…"
            fullWidth
            loading={s.verifying}
            disabled={outOfTries}
            onPress={verify}
          />
          <View style={authStyles.center}>
            {s.channel === 'phone' ? (
              <UnderlineLink label="Send code to email instead" onPress={() => resend('email')} />
            ) : (
              <UnderlineLink label="Send code to my phone instead" onPress={() => resend('phone')} />
            )}
          </View>
        </View>
      }
    >
      <BackButton onPress={onEditNumber} />
      <StepBar step={2} />
      <AuthHeader
        muted
        title="Verify it’s you"
        subtitle={
          <View style={styles.subtitle}>
            <View style={authStyles.row}>
              <Text variant="caption1" color="secondary">{`Enter the ${OTP_LENGTH} digit we sent to`}</Text>
              <Text variant="caption1" color="secondary">{destination}</Text>
            </View>
            {s.channel === 'phone' && (
              <View style={authStyles.row}>
                <Text variant="caption1" color="secondary">If it is wrong</Text>
                <Button label="Edit" variant="text" size="small" onPress={onEditNumber} accessibilityLabel="Edit phone number" />
              </View>
            )}
          </View>
        }
      />
      <View style={styles.code}>
        <CodeInput
          autoFocus
          length={OTP_LENGTH}
          value={s.code}
          onChangeText={(code) => setS((p) => ({ ...p, code, error: outOfTries ? p.error : null }))}
          error={!!s.error}
          accessibilityLabel="6-digit code"
        />
        {s.error && <CodeError message={s.error} />}
        <View style={authStyles.row}>
          <UnderlineLink
            label="Resend code"
            disabled={resendLeft > 0 && !outOfTries}
            emphasis={resendLeft === 0 || outOfTries}
            onPress={() => resend()}
          />
          {resendLeft > 0 && !outOfTries && <TimerPill seconds={resendLeft} />}
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: { gap: space.xs },
  code: { gap: space.md },
  tick: { alignItems: 'center', paddingVertical: space.xxl, height: sizes.icon.xl * 4 },
});
