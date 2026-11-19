'use client';

import { useRouter } from 'next/navigation';
import { ForgotFlow } from '../../features/auth/ForgotFlow';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return <ForgotFlow onSignIn={() => router.replace('/sign-in')} />;
}
