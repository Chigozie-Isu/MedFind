import { useLocalSearchParams, router } from 'expo-router';
import type { ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  customerLoginFailureErrors,
  EMAIL_IN_USE_MESSAGE,
  validateCustomerLogin,
  validateCustomerSignUp,
  wrongCodeMessage,
} from '@medfind/core';
import { space } from '@medfind/ui';
import { Button, Text } from '@medfind/ui/native';
import { ForgotPasswordFlow } from '../../features/auth/ForgotPasswordFlow';
import { LogInFlow } from '../../features/auth/LogInFlow';
import { SignUpFlow } from '../../features/auth/SignUpFlow';
import { OnboardingScreen, WelcomeScreen } from '../../features/auth/StartScreens';
import { VerifyPhoneFlow } from '../../features/auth/VerifyPhoneFlow';

const noop = () => {};
const PHONE = '+2348030000000';
const filledLogIn = { identifier: 'gracegary@gmail.com', password: 'Grace2026pass!long' };
const filledSignUp = { email: 'gracegary@gmail.com', phone: '0803 000 2291', password: 'Grace2026x' };

const login = (initial: Parameters<typeof LogInFlow>[0]['initial']) => (
  <LogInFlow demo initial={initial} onLoggedIn={noop} onSignUp={noop} onForgotPassword={noop} />
);
const signup = (initial: Parameters<typeof SignUpFlow>[0]['initial']) => (
  <SignUpFlow demo initial={initial} onCodeSent={noop} onSignIn={noop} />
);
const verify = (initial: Parameters<typeof VerifyPhoneFlow>[0]['initial']) => (
  <VerifyPhoneFlow demo phone={PHONE} initial={initial} onEditNumber={noop} onVerified={noop} />
);
const forgot = (initial: Parameters<typeof ForgotPasswordFlow>[0]['initial']) => (
  <ForgotPasswordFlow demo initial={initial} onSignIn={noop} />
);

/** Every Figma state in the customer Start and Log in and sign up sections. */
export const AUTH_PREVIEWS: Record<string, () => ReactElement> = {
  splash: () => <WelcomeScreen onSignIn={noop} onCreateAccount={noop} />,
  'onboarding-1': () => <OnboardingScreen initialSlide={0} onDone={noop} />,
  'onboarding-2': () => <OnboardingScreen initialSlide={1} onDone={noop} />,
  'onboarding-3': () => <OnboardingScreen initialSlide={2} onDone={noop} />,
  'login-default': () => login({}),
  'login-filled': () => login(filledLogIn),
  'login-typing-email': () => login({ identifier: 'gracegary@gm' }),
  'login-wrong-password': () => login({ ...filledLogIn, errors: customerLoginFailureErrors('wrong_password') }),
  'login-email-not-found': () => login({ ...filledLogIn, errors: customerLoginFailureErrors('email_not_found') }),
  'login-required': () => login({ errors: validateCustomerLogin({ identifier: '', password: '' }) }),
  'login-invalid-email': () => {
    const v = { identifier: 'gracegary@gmail', password: filledLogIn.password };
    return login({ ...v, errors: validateCustomerLogin(v) });
  },
  'login-both-wrong': () => login({ ...filledLogIn, errors: customerLoginFailureErrors('phone_not_found') }),
  'login-loading': () => login({ ...filledLogIn, loading: true }),
  'login-locked': () => login({ ...filledLogIn, lockedSeconds: 299, errors: customerLoginFailureErrors('locked', 299) }),
  'signup-empty': () => signup({}),
  'signup-filled': () => signup(filledSignUp),
  'signup-required': () => signup({ errors: validateCustomerSignUp({ email: '', phone: '', password: '' }) }),
  'signup-email-in-use': () => signup({ ...filledSignUp, errors: { email: EMAIL_IN_USE_MESSAGE } }),
  'signup-invalid': () => {
    const v = { email: 'gracegary@gmail', phone: '0803 000', password: filledSignUp.password };
    return signup({ ...v, errors: validateCustomerSignUp(v) });
  },
  'signup-weak-password': () => {
    const v = { ...filledSignUp, password: 'grace' };
    return signup({ ...v, errors: validateCustomerSignUp(v) });
  },
  'signup-loading': () => signup({ ...filledSignUp, loading: true }),
  'verify-enter': () => verify({ resendIn: 45 }),
  'verify-code-entered': () => verify({ code: '482931' }),
  'verify-verifying': () => verify({ code: '482931', verifying: true }),
  'verify-wrong': () => verify({ triesUsed: 1, error: wrongCodeMessage(1) }),
  'verify-resend': () => verify({ resendIn: 0 }),
  'verify-email': () => verify({ channel: 'email', email: 'gracegary@gmail.com' }),
  'verify-verified': () => verify({ verified: true }),
  'forgot-enter': () => forgot({ identifier: 'gracegary@gmail.com' }),
  'forgot-code': () => forgot({ step: 'code', identifier: 'gracegary@gmail.com' }),
  'forgot-wrong': () => forgot({ step: 'code', identifier: 'gracegary@gmail.com', code: '000000', triesUsed: 1, codeError: wrongCodeMessage(1) }),
  'forgot-new': () => forgot({ step: 'new', password: 'Grace2026x', confirm: 'Grace2026x' }),
  'forgot-done': () => forgot({ step: 'done' }),
};

/** Hidden /dev/auth screen. /dev/auth?state=login-locked shows one state full screen. */
export default function DevAuth() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const render = state ? AUTH_PREVIEWS[state] : undefined;
  if (render) return render();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h2">Log in and sign up</Text>
        <Text variant="body3" color="secondary">Each Figma state, without calling Supabase.</Text>
        <View style={styles.grid}>
          {Object.keys(AUTH_PREVIEWS).map((k) => (
            <Button key={k} label={k} variant="inline" size="small" onPress={() => router.setParams({ state: k })} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: space.md, gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
