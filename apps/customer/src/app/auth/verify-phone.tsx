import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { formatPhoneInternational } from '@medfind/core';
import { VerifyPhoneFlow } from '../../features/auth/VerifyPhoneFlow';
import { signedUpEmail } from '../../features/auth/authApi';
import { hrefAfterAuth } from '../../lib/afterAuth';

/** Sign up step 2: /auth/verify-phone?phone=+234… */
export default function VerifyPhone() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  if (!phone) {
    return <Redirect href="/auth/sign-up" />;
  }
  return (
    <VerifyPhoneFlow
      phone={phone}
      onEditNumber={async () => {
        const email = (await signedUpEmail()) ?? '';
        const local = formatPhoneInternational(phone).replace(/^\+234\s?/, '0');
        if (router.canGoBack()) router.back();
        else router.replace({ pathname: '/auth/sign-up', params: { email, phone: local } });
      }}
      onVerified={async () => router.replace(await hrefAfterAuth('sign_up'))}
    />
  );
}
