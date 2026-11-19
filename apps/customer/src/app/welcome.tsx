import { router } from 'expo-router';
import { WelcomeScreen } from '../features/auth/StartScreens';
import { hasSeenOnboarding } from '../lib/onboarding';

/**
 * Splash (Figma "Start": Splash, then Onboarding 1 to 3, then Log in or Sign up).
 * The first time, either button goes through onboarding before the chosen screen.
 */
export default function Welcome() {
  const go = async (next: 'log-in' | 'sign-up') =>
    (await hasSeenOnboarding()) ? router.push(`/auth/${next}`) : router.push({ pathname: '/onboarding', params: { next } });
  return <WelcomeScreen onSignIn={() => go('log-in')} onCreateAccount={() => go('sign-up')} />;
}
