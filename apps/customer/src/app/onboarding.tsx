import { router } from 'expo-router';
import { OnboardingScreen } from '../features/auth/StartScreens';
import { markOnboardingSeen } from '../lib/onboarding';

/** Onboarding 1 to 3, shown once per device. Skip and Continue both go to the Splash. */
export default function Onboarding() {
  return (
    <OnboardingScreen
      onDone={async () => {
        await markOnboardingSeen();
        router.replace('/welcome');
      }}
    />
  );
}
