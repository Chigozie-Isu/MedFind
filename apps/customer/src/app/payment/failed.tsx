import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text } from '@medfind/ui/native';
import { placeFromCheckout } from '../../features/demo/checkout';
import { ResultBadge, Screen, kit } from '../../features/demo/kit';
import { setAccount } from '../../features/demo/account';

/** Payment – failed (Figma 517:22958): try again, another method, or pay at the pharmacy instead. */
export default function PaymentFailed() {
  const { last4 } = useLocalSearchParams<{ last4?: string }>();
  return (
    <Screen
      title="Payment"
      onBack={() => router.replace('/payment')}
      footer={
        <>
          <Button label="Try again" fullWidth onPress={() => router.replace('/payment/verify')} />
          <Button
            label="Try another method"
            variant="secondary"
            fullWidth
            onPress={() => (setAccount({ method: 'transfer' }), router.replace('/payment'))}
          />
          <Button
            label="Pay at pharmacy instead"
            variant="text"
            size="large"
            onPress={() => {
              const r = placeFromCheckout('pharmacy');
              if (r) router.replace(r.fulfilment === 'delivery' ? `/reservation/${r.id}` : `/reserved/${r.id}`);
            }}
          />
        </>
      }
    >
      <ResultBadge tone="error" />
      <Text variant="h2" style={kit.center}>
        Payment didn’t go through
      </Text>
      <Text variant="body3" color="secondary" style={kit.center}>
        Your bank declined the card ending {last4 ?? '1456'}. You can try again, use another method or pay at the pharmacy.
      </Text>
    </Screen>
  );
}
