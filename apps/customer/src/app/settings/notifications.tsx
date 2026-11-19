import { Toggle, Text } from '@medfind/ui/native';
import { setAccount, useAccount, type NotificationPrefs } from '../../features/demo/account';
import { LinkRow, Screen } from '../../features/demo/kit';

/** Settings – notifications (Figma 2034:20509). */
export default function NotificationSettings() {
  const account = useAccount();
  const n = account.notifications;
  const toggle = (key: keyof NotificationPrefs, title: string, subtitle: string) => (
    <LinkRow
      key={key}
      title={title}
      subtitle={subtitle}
      right={<Toggle value={n[key]} onChange={(v) => setAccount({ notifications: { ...n, [key]: v } })} accessibilityLabel={title} />}
    />
  );
  return (
    <Screen title="Notifications">
      <Text variant="label1" color="secondary">
        What we tell you about
      </Text>
      {toggle('reservations', 'Reservation updates', 'When a pharmacy accepts, declines or is ready')}
      {toggle('reminders', 'Pickup reminders', '30 minutes before your hold ends')}
      {toggle('stock', 'Back-in-stock alerts', 'When medicine you asked about is available')}
      {toggle('refills', 'Refill reminders', 'When it’s time to restock regular medicine')}
      {toggle('offers', 'Offers from pharmacies', 'Discounts from pharmacies near you')}
      <Text variant="label1" color="secondary">
        How we reach you
      </Text>
      {toggle('push', 'Push notifications', 'On this phone')}
      {toggle('email', 'Email', account.profile.email)}
      {toggle('sms', 'SMS', account.profile.maskedPhone)}
    </Screen>
  );
}
