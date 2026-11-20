'use client';

import { useRouter } from 'next/navigation';
import { Splash } from '../../features/auth/Splash';

export default function WelcomePage() {
  const router = useRouter();
  return <Splash onSignIn={() => router.push('/sign-in')} onCreateAccount={() => router.push('/sign-up?new=1')} />;
}
