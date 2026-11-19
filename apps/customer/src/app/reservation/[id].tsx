import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APPROVAL_WINDOW_MINUTES, PICKUP_WINDOW_MINUTES, formatNaira } from '@medfind/core';
import { boxShadow, radii, sizes, space } from '@medfind/ui';
import { Badge, Button, Icon, Text, useTheme } from '@medfind/ui/native';
import { coords, findPharmacy, rider } from '../../features/demo/data';
import { cancelReservation, deadlineOf, extendPickup, markCollected, useReservation, type DemoReservation } from '../../features/demo/store';
import { DemoMap } from '../../features/demo/DemoMap';
import { Note, Pill, Sheet, ConfirmSheet, kit, useFlash } from '../../features/demo/kit';
import { ExtraIcon } from '../../features/demo/icons';
import { walletMove } from '../../features/demo/account';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

const REASONS = ['Don’t need it now', 'Too far', 'Other', 'Got it somewhere else'];
const EXTEND_FEE_KOBO = 80_000;

function paymentNote(r: DemoReservation, ready: boolean): string {
  const total = formatNaira(r.totals.totalKobo);
  const delivery = r.fulfilment === 'delivery' ? `, including ${formatNaira(r.totals.deliveryFeeKobo)} delivery` : '';
  if (r.payment === 'pharmacy')
    return r.fulfilment === 'delivery'
      ? `Pay ${total} to the rider when it arrives${delivery}.`
      : `Pay ${total} at the pharmacy when you collect. Pick up within ${PICKUP_WINDOW_MINUTES / 60} hours of it being ready.`;
  const how = r.payment === 'wallet' ? 'from your wallet' : r.payment === 'transfer' ? 'by bank transfer' : `on card •••• ${r.cardLast4 ?? '1456'}`;
  if (!ready) return `${total}${delivery} is held ${how}. You’re only charged if ${r.pharmacyName.split(' ')[0]} confirms.`;
  return `${total} charged ${how}${delivery}. You will be refunded if you don’t make pickup in time.`;
}

/**
 * Pickup code (Figma 289:9235 waiting, 529:5852 ready, 529:5987 / 529:6082 30 and 15 min left,
 * 535:4410 cancel, 2436:86375 pay at pharmacy) and the delivery versions (2069:24034 waiting,
 * 2069:24123 rider on the way). Updates live when the pharmacy answers.
 */
export default function PickupCode() {
  const { colors } = useTheme();
  const { id, cancel } = useLocalSearchParams<{ id: string; cancel?: string }>();
  const r = useReservation(id);
  const [now, setNow] = useState(Date.now());
  const [cancelling, setCancelling] = useState(cancel === '1');
  const [reason, setReason] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);
  const [flash, showFlash] = useFlash();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!r) return <Redirect href="/reservations" />;
  if (r.status === 'collected') return <Redirect href={`/rate/${r.id}`} />;
  if (r.status !== 'waiting' && r.status !== 'ready') return <Redirect href={`/ended/${r.id}`} />;

  const pharmacy = findPharmacy(r.pharmacyId);
  const ready = r.status === 'ready';
  const delivery = r.fulfilment === 'delivery';
  const deadline = deadlineOf(r);
  const left = deadline ? deadline.getTime() - now : 0;
  const minsLeft = left / 60_000;
  const late = ready && !delivery && minsLeft <= 30;
  const riderMins = r.readyAt ? Math.max(1, 18 - Math.floor((now - r.readyAt.getTime()) / 60_000)) : 18;
  const first = pharmacy.name.split(' ')[0];

  const title = !ready ? `Waiting for ${first}` : delivery ? 'On the way' : late ? 'Running out of time' : 'Ready for Pickup';
  const copy = async () => {
    try {
      await navigator?.clipboard?.writeText(r.pickupCode);
    } catch {
      // Not available everywhere; the toast still confirms.
    }
    showFlash('Pickup code copied');
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.surface.default }]} edges={['bottom']}>
      <View>
        <DemoMap
          pharmacy={coords[r.pharmacyId] ?? coords.fuasi}
          pharmacyName={pharmacy.name}
          me={coords.grace}
          eta={delivery ? (ready ? `${riderMins} min` : '45–60 min') : '45 mins'}
          height={320}
        />
        <SafeAreaView edges={['top']} style={styles.close}>
          <Pressable
            onPress={() => router.navigate('/')}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeBtn, { backgroundColor: colors.surface.raised }]}
          >
            <Icon name="close" size={sizes.icon.md} color={colors.text.brand} />
          </Pressable>
        </SafeAreaView>
      </View>
      <ScrollView style={[styles.sheet, { backgroundColor: colors.surface.default }]} contentContainerStyle={styles.sheetContent}>
        <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} />
        <View style={kit.between}>
          <Badge
            label={!ready ? (r.rx ? 'Checking prescription' : 'Waiting') : delivery ? 'On the way' : late ? 'Running out of time' : 'Ready for Pickup'}
            tone={!ready ? 'info' : late ? 'warning' : 'success'}
            dot="left"
          />
          {ready && deadline && !delivery && (
            <Text variant="caption1" color="secondary">
              Held until {hhmm(deadline)}
            </Text>
          )}
          {ready && delivery && r.readyAt && (
            <Text variant="caption1" color="secondary">
              Left {hhmm(r.readyAt)}
            </Text>
          )}
        </View>
        <Text variant="h2" accessibilityRole="header">
          {title === 'Ready for Pickup' || title === 'Running out of time' || title === 'On the way' ? `${r.medicineName} × ${r.quantity}` : title}
        </Text>
        <Text variant="body3" color="secondary">
          {!ready
            ? `${r.medicineName} × ${r.quantity} · ${delivery ? `Delivering to ${r.addressLine?.split(',')[0] ?? 'Home'}` : `${pharmacy.name} · ${pharmacy.street}, ${pharmacy.area}`}`
            : delivery
              ? `${rider.name} · ${rider.bike}`
              : `${pharmacy.name} · ${pharmacy.street}, ${pharmacy.area}`}
        </Text>

        {!ready ? (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
              <View style={kit.row}>
                <ActivityIndicator color={colors.brand.default} />
                <View style={styles.flex}>
                  <Text variant="h5">{r.rx ? 'Checking prescription' : 'Waiting for the pharmacy'}</Text>
                  <Text variant="caption1" color="secondary">
                    {first} replies within {APPROVAL_WINDOW_MINUTES} mins
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.card, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
              <Text variant="caption1" color="secondary">
                {delivery ? 'Rider details · show once it’s on the way' : 'Pickup code · shows once confirmed'}
              </Text>
              <View style={[styles.placeholder, { backgroundColor: colors.surface.muted }]} />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.card, styles.codeCard, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
              <View style={styles.flex}>
                <Text variant="caption1" color="secondary">
                  {delivery ? 'Give this code to the rider' : 'Show this code at the counter'}
                </Text>
                <Text variant="h1" accessibilityLabel={`Pickup code ${r.pickupCode.split('').join(' ')}`}>
                  {r.pickupCode.slice(0, 3)} {r.pickupCode.slice(3)}
                </Text>
              </View>
              <Pressable
                onPress={copy}
                accessibilityRole="button"
                accessibilityLabel="Copy pickup code"
                style={[styles.copy, { borderColor: colors.brand.default }]}
              >
                <ExtraIcon name="copy" size={sizes.icon.md} color={colors.text.brand} />
              </Pressable>
            </View>
            <View style={styles.timer}>
              <Text variant="h2" color={late ? 'error' : 'secondary'}>
                {delivery ? `${riderMins} min away` : countdown(left)}{' '}
                {!delivery && (
                  <Text variant="body3" color="secondary">
                    left
                  </Text>
                )}
              </Text>
              <View style={[styles.track, { backgroundColor: colors.surface.border }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: late ? colors.text.error : colors.brand.default,
                      width: `${Math.max(0, Math.min(100, delivery ? (1 - riderMins / 18) * 100 + 10 : (left / ((PICKUP_WINDOW_MINUTES + r.extendedMinutes) * 60_000)) * 100))}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </>
        )}

        <Note icon="shield">{paymentNote(r, ready)}</Note>

        {late && <Button label={`Extend 30 mins · ${formatNaira(EXTEND_FEE_KOBO)}`} fullWidth onPress={() => setExtending(true)} />}
        {ready && delivery && (
          <Button label={`Call ${rider.short}`} iconLeft="message" fullWidth onPress={() => showFlash(`Calling ${rider.short} on ${rider.phone}`, 'info')} />
        )}
        {(!delivery || !ready) && (
          <Button
            label={ready ? 'Cancel' : 'Cancel reservation'}
            variant={late || !ready ? 'secondary' : 'primary'}
            fullWidth
            onPress={() => setCancelling(true)}
          />
        )}
        {ready && (
          <Button
            label={delivery ? 'I’ve received it' : 'I’ve collected it'}
            variant="text"
            size="large"
            onPress={() => {
              markCollected(r.id);
              router.replace(`/rate/${r.id}`);
            }}
          />
        )}
        <Button label="My reservations" variant="text" size="large" onPress={() => router.navigate('/reservations')} />
      </ScrollView>

      <Sheet visible={cancelling} onClose={() => setCancelling(false)}>
        <Text variant="h2">Cancel this reservation?</Text>
        <Text variant="body3" color="secondary">
          {first} will put the {r.medicineName} back on the shelf for someone else.
        </Text>
        <View style={kit.wrap}>
          {REASONS.map((x) => (
            <Pill key={x} label={x} selected={reason === x} onPress={() => setReason(x)} />
          ))}
        </View>
        <Button
          label="Cancel Reservation"
          variant="destructive-primary"
          fullWidth
          disabled={!reason}
          onPress={() => {
            cancelReservation(r.id, reason!);
            if (r.payment === 'wallet') walletMove(`Refund · ${r.medicineName}`, r.totals.totalKobo, 'refund');
            setCancelling(false);
            router.replace(`/ended/${r.id}`);
          }}
        />
        <Button label="Keep it" variant="secondary" fullWidth onPress={() => setCancelling(false)} />
        <Note icon="shield">
          {r.payment === 'pharmacy'
            ? 'You haven’t paid anything, so there’s nothing to refund.'
            : r.payment === 'wallet'
              ? `You won’t be charged. ${formatNaira(r.totals.totalKobo)} goes back to your wallet straight away.`
              : `You won’t be charged. The ${formatNaira(r.totals.totalKobo)} hold is released straight away.`}
        </Note>
      </Sheet>

      <ConfirmSheet
        visible={extending}
        title="Extend by 30 minutes?"
        body={`${first} keeps it for another 30 minutes. ${formatNaira(EXTEND_FEE_KOBO)} is added to what you pay.`}
        confirmLabel={`Extend · ${formatNaira(EXTEND_FEE_KOBO)}`}
        onConfirm={() => {
          extendPickup(r.id);
          setExtending(false);
          showFlash('Held for 30 more minutes');
        }}
        onClose={() => setExtending(false)}
      />
      {flash}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  close: { position: 'absolute', top: 0, left: space.md },
  closeBtn: { marginTop: space.md, width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  sheet: { flex: 1, marginTop: -space.lg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  sheetContent: { padding: space.md, gap: space.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, opacity: 0.6 },
  card: { padding: space.md, borderRadius: radii.xl, gap: space.xs },
  codeCard: { flexDirection: 'row', alignItems: 'center' },
  copy: { width: 48, height: 48, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { height: 28, width: 160, borderRadius: radii.sm, marginTop: space.xs },
  timer: { gap: space.sm },
  track: { height: 6, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: 6 },
});
