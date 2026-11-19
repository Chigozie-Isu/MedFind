import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingScreen } from '../features/auth/StartScreens';
import { markOnboardingSeen } from '../lib/onboarding';

/** Onboarding 1 to 3, shown once per device after the Splash. Skip and Continue go on to Log in or Sign up. */
export default function Onboarding() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  return (
    <OnboardingScreen
      onDone={async () => {
        await markOnboardingSeen();
        router.replace(next === 'sign-up' ? '/auth/sign-up' : '/auth/log-in');
      }}
    />
  );
}
