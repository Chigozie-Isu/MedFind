import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, Toggle } from '@medfind/ui/native';
import { findMedicine } from '../features/demo/data';
import { setAccount, useAccount } from '../features/demo/account';
import { LinkRow, ResultBadge, Screen, kit, useFlash } from '../features/demo/kit';

/** Search – stock alert (Figma 2033:19657). */
export default function StockAlert() {
  const { medicine } = useLocalSearchParams<{ medicine?: string }>();
  const med = findMedicine(medicine ?? 'augmentin') ?? findMedicine('augmentin');
  const account = useAccount();
  const [brands, setBrands] = useState(true);
  const [sms, setSms] = useState(false);
  const [flash, showFlash] = useFlash();

  return (
    <Screen
      title="Stock alert"
      overlay={flash}
      footer={
        <>
          <Button
            label="Done"
            fullWidth
            onPress={() => {
              setAccount((a) => ({ stockAlerts: [...new Set([...a.stockAlerts, med.id])] }));
              router.back();
            }}
          />
          <Button label="Manage alerts" variant="text" size="large" onPress={() => router.push('/settings/notifications')} />
        </>
      }
    >
      <ResultBadge tone="info" icon="notification" />
      <Text variant="h2" style={kit.center}>
        We’ll tell you when it’s in stock
      </Text>
      <Text variant="body3" color="secondary" style={kit.center}>
        You’ll get a notification when a pharmacy within 10 km lists {med.name}. The alert lasts 14 days.
      </Text>
      <View style={kit.gapSm}>
        <LinkRow
          icon="discount-circle"
          title="Include other brands"
          subtitle="Same active ingredients, different brand"
          right={<Toggle value={brands} onChange={setBrands} accessibilityLabel="Include other brands" />}
        />
        <LinkRow
          icon="message"
          title="Text me as well"
          subtitle={account.profile.maskedPhone}
          right={
            <Toggle
              value={sms}
              onChange={(v) => (setSms(v), v && showFlash('We’ll text you too'))}
              accessibilityLabel="Text me as well"
            />
          }
        />
      </View>
    </Screen>
  );
}
