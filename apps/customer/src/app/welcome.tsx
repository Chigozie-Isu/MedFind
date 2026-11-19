import { router } from 'expo-router';
import { WelcomeScreen } from '../features/auth/StartScreens';

/** Splash: where signed-out customers land after onboarding. */
export default function Welcome() {
  return (
    <WelcomeScreen
      onSignIn={() => router.push('/auth/log-in')}
      onCreateAccount={() => router.push('/auth/sign-up')}
    />
  );
}
