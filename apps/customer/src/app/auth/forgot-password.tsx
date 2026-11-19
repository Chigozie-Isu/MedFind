import { router } from 'expo-router';
import { ForgotPasswordFlow } from '../../features/auth/ForgotPasswordFlow';

export default function ForgotPassword() {
  return <ForgotPasswordFlow onSignIn={() => router.replace('/auth/log-in')} />;
}
