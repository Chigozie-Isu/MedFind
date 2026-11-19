import { router } from 'expo-router';
import { LogInFlow } from '../../features/auth/LogInFlow';
import { hrefAfterAuth } from '../../lib/afterAuth';
import { demoAuth, setDemoSignedIn } from '../../lib/supabase';

export default function LogIn() {
  return (
    <LogInFlow
      onLoggedIn={async () => router.replace(await hrefAfterAuth('log_in'))}
      onSocial={demoAuth ? async () => (await setDemoSignedIn(true), router.replace(await hrefAfterAuth('log_in'))) : undefined}
      onSignUp={() => router.replace('/auth/sign-up')}
      onForgotPassword={() => router.push('/auth/forgot-password')}
    />
  );
}
