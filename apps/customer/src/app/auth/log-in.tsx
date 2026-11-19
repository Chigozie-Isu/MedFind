import { router } from 'expo-router';
import { LogInFlow } from '../../features/auth/LogInFlow';
import { hrefAfterAuth } from '../../lib/afterAuth';

export default function LogIn() {
  return (
    <LogInFlow
      onLoggedIn={async () => router.replace(await hrefAfterAuth('log_in'))}
      onSignUp={() => router.replace('/auth/sign-up')}
      onForgotPassword={() => router.push('/auth/forgot-password')}
    />
  );
}
