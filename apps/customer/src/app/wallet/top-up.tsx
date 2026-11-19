import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { Button, OptionRow, Text, TextField } from '@medfind/ui/native';
import { cardLabel, defaultCard, useAccount } from '../../features/demo/account';
import { Pill, Screen, kit } from '../../features/demo/kit';
import { withdrawAccount } from '../../features/demo/data';

const MIN_KOBO = 50_000;

/** Top up – enter amount (2033:19175) and Withdraw – enter amount (2440:87059): `?mode=withdraw`. */
export default function TopUp() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const withdraw = mode === 'withdraw';
  const account = useAccount();
  const [naira, setNaira] = useState(withdraw ? '5000' : '10000');
  const [via, setVia] = useState<'card' | 'transfer'>('card');
  const kobo = (parseInt(naira.replace(/\D/g, ''), 10) || 0) * 100;
  const card = defaultCard(account);
  const error =
    kobo < MIN_KOBO ? `Minimum ${formatNaira(MIN_KOBO)}.` : withdraw && kobo > account.walletKobo ? 'That’s more than your balance.' : null;

  const go = () => {
    if (error) return;
    if (!withdraw && via === 'transfer') return router.push('/wallet/transfer');
    router.replace({ pathname: '/wallet/done', params: { mode: withdraw ? 'withdraw' : 'topup', kobo: String(kobo), from: withdraw ? withdrawAccount : cardLabel(card) } });
  };

  return (
    <Screen
      title={withdraw ? 'Withdraw' : 'Add money'}
      footer={<Button label={`${withdraw ? 'Withdraw' : 'Add'} ${formatNaira(kobo)}`} fullWidth disabled={!!error} onPress={go} />}
    >
      <View style={kit.between}>
        <Text variant="label1" color="secondary">
          Wallet balance
        </Text>
        <Text variant="h4">{formatNaira(account.walletKobo)}</Text>
      </View>
      <TextField
        label={withdraw ? 'Amount to withdraw' : 'Amount to add'}
        required
        keyboard="number"
        value={naira ? `₦${Number(naira.replace(/\D/g, '')).toLocaleString('en-NG')}` : ''}
        onChangeText={(v) => setNaira(v.replace(/\D/g, ''))}
        helperText={error ? undefined : `Minimum ${formatNaira(MIN_KOBO)}. ${withdraw ? 'Withdrawals' : 'Top-ups'} are free.`}
        errorText={error ?? undefined}
      />
      <View style={kit.wrap}>
        {(withdraw ? [1000, 2000, 5000] : [2000, 5000, 20000]).map((n) => (
          <Pill key={n} label={formatNaira(n * 100)} selected={kobo === n * 100} onPress={() => setNaira(String(n))} />
        ))}
      </View>
      <Text variant="h5">{withdraw ? 'Withdraw to' : 'Add money with'}</Text>
      {withdraw ? (
        <>
          <OptionRow title={withdrawAccount} description="Arrives in minutes" icon="store" selected />
          <OptionRow title="Another bank account" description="Add a new account in your name" icon="add" />
        </>
      ) : (
        <>
          <OptionRow title={`Card •••• ${card.last4}`} description="Lands instantly" icon="card" selected={via === 'card'} onPress={() => setVia('card')} />
          <OptionRow
            title="Bank transfer"
            description="Send money to your own wallet account number"
            icon="store"
            selected={via === 'transfer'}
            onPress={() => setVia('transfer')}
          />
        </>
      )}
    </Screen>
  );
}
