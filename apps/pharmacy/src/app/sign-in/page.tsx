'use client';

import { useRouter } from 'next/navigation';
import { SignInFlow } from '../../features/auth/SignInFlow';
import { supabase } from '../../lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  return (
    <SignInFlow
      onSignedIn={(outcome) => router.replace(outcome === 'resume_sign_up' ? '/sign-up' : supabase ? '/' : '/dashboard')}
      onForgotPassword={() => router.push('/forgot-password')}
    />
  );
}
