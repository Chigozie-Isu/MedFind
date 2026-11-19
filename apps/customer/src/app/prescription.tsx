import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { radii, sizes, space } from '@medfind/ui';
import { Button, Icon, Text, useTheme } from '@medfind/ui/native';
import { findInventory, findPharmacy } from '../features/demo/data';
import { Note, Screen, kit } from '../features/demo/kit';
import { ExtraIcon, type ExtraIconName } from '../features/demo/icons';
import { defaultAddress, getAccount, setAccount, useAccount } from '../features/demo/account';
import { placeReservation } from '../features/demo/store';

type Upload = 'none' | 'uploading' | 'uploaded' | 'error';

/**
 * Upload prescription (Figma 140:7864, "– error", "– uploaded", and the pay-at-pharmacy versions).
 * The demo doesn't open the camera: picking a source attaches a sample photo.
 */
export default function Prescription() {
  const { colors } = useTheme();
  const account = useAccount();
  const checkout = account.checkout;
  const [state, setState] = useState<Upload>(checkout?.prescriptionAttached ? 'uploaded' : 'none');
  if (!checkout) {
    return <Redirect href="/" />;
  }
  const pharmacy = findPharmacy(findInventory(checkout.inventoryId).pharmacyId);

  const pick = (source: 'camera' | 'file' | 'gallery') => {
    setState('uploading');
    setTimeout(() => {
      // A PDF over the size limit shows Figma's "Image problem" state once, so the error can be seen.
      if (source === 'file' && state !== 'error') return setState('error');
      setState('uploaded');
      setAccount({ checkout: { ...checkout, prescriptionAttached: true } });
    }, 900);
  };

  const next = () => {
    if (checkout.payOnline) return router.push('/payment');
    const c = getAccount().checkout!;
    const addr = c.fulfilment === 'delivery' ? (getAccount().addresses.find((a) => a.id === c.addressId) ?? defaultAddress(getAccount())).line : undefined;
    const r = placeReservation(c.inventoryId, c.quantity, c.fulfilment, { payment: 'pharmacy', addressLine: addr });
    router.replace(c.fulfilment === 'delivery' ? `/reservation/${r.id}` : `/reserved/${r.id}`);
  };

  const source = (key: 'camera' | 'file' | 'gallery', label: string, icon: ExtraIconName | 'camera') => (
    <Pressable
      key={key}
      onPress={() => pick(key)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.source, { backgroundColor: pressed ? colors.surface.pressed : colors.surface.raised }]}
    >
      {icon === 'camera' ? (
        <Icon name="camera" size={sizes.icon.lg} color={colors.text.brand} />
      ) : (
        <ExtraIcon name={icon} size={sizes.icon.lg} color={colors.text.brand} />
      )}
      <Text variant="label2" color="heading">
        {label}
      </Text>
    </Pressable>
  );

  const tone = state === 'error' ? colors.tone.error : state === 'uploaded' ? colors.tone.success : null;

  return (
    <Screen
      title="Prescription"
      step={{ n: 2, of: 3 }}
      footer={
        <Button
          label={checkout.payOnline ? 'Continue to payment' : checkout.fulfilment === 'delivery' ? 'Reserve · pay on delivery' : 'Reserve · pay at pharmacy'}
          fullWidth
          disabled={state !== 'uploaded'}
          onPress={next}
        />
      }
    >
      <Text variant="h3">Add your prescription</Text>
      <Text variant="body3" color="secondary">
        The pharmacist checks it before confirming your hold, usually within 10 minutes.
      </Text>
      <View
        style={[
          styles.drop,
          { borderColor: tone ? tone.border : colors.input.border, backgroundColor: tone ? tone.bg : colors.surface.raised },
        ]}
      >
        {state === 'uploading' ? (
          <ActivityIndicator color={colors.brand.default} accessibilityLabel="Uploading" />
        ) : (
          <Icon
            name={state === 'error' ? 'danger-circle' : state === 'uploaded' ? 'tick-circle' : 'document'}
            size={sizes.icon.xl}
            color={tone ? tone.text : colors.text.secondary}
          />
        )}
        <Text variant="h5" style={[kit.center, tone && { color: tone.text }]}>
          {state === 'error'
            ? 'Image problem'
            : state === 'uploaded'
              ? 'Image uploaded successfully'
              : state === 'uploading'
                ? 'Uploading…'
                : 'No prescription added yet'}
        </Text>
        <Text variant="caption1" style={[kit.center, { color: tone ? tone.text : colors.text.secondary }]}>
          {state === 'error'
            ? 'This file is over 10 MB. Take a photo or choose a smaller file to continue.'
            : state === 'uploaded'
              ? 'Your prescription has been uploaded successfully'
              : 'Add a photo of your prescription. JPG, PNG.'}
        </Text>
      </View>
      <View style={styles.sources}>
        {source('camera', 'Camera', 'camera')}
        {source('file', 'PDF or File', 'file')}
        {source('gallery', 'Gallery', 'gallery')}
      </View>
      <Text variant="h5">For a clear photo</Text>
      {[
        'Fit the whole prescription into the frame.',
        'Hold steady until the text looks sharp',
        'Use bright, even light with no shadows',
        'Make sure all text is readable.',
      ].map((t) => (
        <Note key={t} icon="tick">
          {t}
        </Note>
      ))}
      <Note icon="shield">Only {pharmacy.name} sees this photo. You can only use this prescription once.</Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  drop: { alignItems: 'center', gap: space.xs, padding: space.lg, borderRadius: radii.xl, borderWidth: 1, borderStyle: 'dashed' },
  sources: { flexDirection: 'row', gap: space.sm },
  source: { flex: 1, alignItems: 'center', gap: space.xs, paddingVertical: space.md, borderRadius: radii.xl },
});
