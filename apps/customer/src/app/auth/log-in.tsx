import { router } from 'expo-router';
import { LogInFlow } from '../../features/auth/LogInFlow';
import { hrefAfterAuth } from '../../lib/afterAuth';
import { demoAuth, setDemoSignedIn } from '../../lib/supabase';
import { startReturningCustomer } from '../../features/demo/returning';

export default function LogIn() {
  return (
    <LogInFlow
      onLoggedIn={async (identifier) => (startReturningCustomer(identifier), router.replace(await hrefAfterAuth('log_in')))}
      onSocial={demoAuth ? async () => (startReturningCustomer(), await setDemoSignedIn(true), router.replace(await hrefAfterAuth('log_in'))) : undefined}
      onSignUp={() => router.replace('/auth/sign-up')}
      onForgotPassword={() => router.push('/auth/forgot-password')}
    />
  );
}
