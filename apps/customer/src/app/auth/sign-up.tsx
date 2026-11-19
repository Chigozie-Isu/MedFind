import { router, useLocalSearchParams } from 'expo-router';
import { SignUpFlow } from '../../features/auth/SignUpFlow';
import { hrefAfterAuth } from '../../lib/afterAuth';
import { demoAuth, setDemoSignedIn } from '../../lib/supabase';

/** Sign up step 1. `?email=&phone=` refills the form when the customer taps Edit on step 2. */
export default function SignUp() {
  const { email, phone } = useLocalSearchParams<{ email?: string; phone?: string }>();
  return (
    <SignUpFlow
      initial={{ email: email ?? '', phone: phone ?? '' }}
      onCodeSent={(p) => router.push({ pathname: '/auth/verify-phone', params: { phone: p } })}
      onSignIn={() => router.replace('/auth/log-in')}
      onSocial={demoAuth ? async () => (await setDemoSignedIn(true), router.replace(await hrefAfterAuth('sign_up'))) : undefined}
    />
  );
}
