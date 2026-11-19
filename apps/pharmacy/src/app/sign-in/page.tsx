'use client';

import { useRouter } from 'next/navigation';
import { SignInFlow } from '../../features/auth/SignInFlow';

export default function SignInPage() {
  const router = useRouter();
  return (
    <SignInFlow
      onSignedIn={(outcome) => router.replace(outcome === 'resume_sign_up' ? '/sign-up' : '/')}
      onForgotPassword={() => router.push('/forgot-password')}
    />
  );
}
