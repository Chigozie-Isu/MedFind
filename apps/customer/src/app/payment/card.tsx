import { router } from 'expo-router';
import { useState } from 'react';
import { Button, OptionRow, Text } from '@medfind/ui/native';
import { cardLabel, setAccount, useAccount } from '../../features/demo/account';
import { goBack, Screen } from '../../features/demo/kit';

/** Card – choose a card (Figma 2031:18822). */
export default function ChooseCard() {
  const account = useAccount();
  const [picked, setPicked] = useState(account.defaultCardId);
  return (
    <Screen
      title="Choose a card"
      footer={
        <Button
          label="Use this card"
          fullWidth
          onPress={() => {
            setAccount({ defaultCardId: picked, method: 'card' });
            goBack('/payment');
          }}
        />
      }
    >
      <Text variant="h5">Saved cards</Text>
      {account.cards.map((c) => (
        <OptionRow
          key={c.id}
          title={cardLabel(c)}
          description={
            c.expired
              ? `Expired ${c.expiry}. Remove it or add the new card`
              : `Expires ${c.expiry}${c.id === account.defaultCardId ? ' · Default card' : ''}`
          }
          icon="card"
          selected={picked === c.id}
          onPress={c.expired ? undefined : () => setPicked(c.id)}
          actionLabel={c.expired ? 'Remove' : undefined}
          onAction={c.expired ? () => setAccount((a) => ({ cards: a.cards.filter((x) => x.id !== c.id) })) : undefined}
        />
      ))}
      <Button label="Add a new card" variant="secondary" iconLeft="add" fullWidth onPress={() => router.push('/settings/add-card')} />
    </Screen>
  );
}
