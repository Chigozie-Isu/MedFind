import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { space, radii } from '@medfind/ui';
import { Button, Text, TextField } from '@medfind/ui/native';
import { setAccount, useAccount } from '../../features/demo/account';
import { Screen, Sheet, avatarGrace, goBack, kit, useFlash } from '../../features/demo/kit';

/** Settings – edit profile (Figma 2034:19936) with the change-photo overlay. */
export default function EditProfile() {
  const account = useAccount();
  const p = account.profile;
  const [name, setName] = useState(p.fullName);
  const [email, setEmail] = useState(p.email);
  const [phone, setPhone] = useState(p.phone);
  const [d, setD] = useState(p.dob);
  const [allergies, setAllergies] = useState(p.allergies);
  const [photo, setPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, showFlash] = useFlash();

  const save = () => {
    if (!name.trim()) return setError('Enter your full name');
    setAccount({ profile: { ...p, fullName: name.trim(), displayName: name.trim(), email, phone, dob: d, allergies } });
    showFlash('Profile saved');
    setTimeout(() => goBack('/settings'), 700);
  };

  return (
    <Screen title="Edit profile" overlay={flash} footer={<Button label="Save changes" fullWidth onPress={save} />}>
      <View style={styles.head}>
        <Image source={avatarGrace} style={styles.avatar} accessibilityIgnoresInvertColors />
        <Text variant="h4">{p.displayName}</Text>
        <Text variant="caption1" color="secondary">
          {p.email}
        </Text>
        <Button label="Change photo" variant="inline" size="small" onPress={() => setPhoto(true)} />
      </View>
      <TextField label="Full name" required value={name} onChangeText={(v) => (setName(v), setError(null))} errorText={error ?? undefined} />
      <TextField label="Email" value={email} onChangeText={setEmail} keyboard="email" />
      <TextField label="Phone number" value={phone} onChangeText={setPhone} keyboard="phone" />
      <Text variant="label1" color="secondary">
        Date of birth
      </Text>
      <View style={kit.row}>
        <View style={styles.flex}>
          <TextField value={d.d} onChangeText={(v) => setD({ ...d, d: v })} keyboard="number" placeholder="DD" />
        </View>
        <View style={styles.flex}>
          <TextField value={d.m} onChangeText={(v) => setD({ ...d, m: v })} keyboard="number" placeholder="MM" />
        </View>
        <View style={styles.flex2}>
          <TextField value={d.y} onChangeText={(v) => setD({ ...d, y: v })} keyboard="number" placeholder="YYYY" />
        </View>
      </View>
      <TextField
        label="Allergies"
        value={allergies}
        onChangeText={setAllergies}
        helperText="Pharmacists see this when you reserve prescription medicine."
      />
      <Sheet visible={photo} onClose={() => setPhoto(false)}>
        <Text variant="h3">Change profile photo</Text>
        <Text variant="body3" color="secondary">
          Use a clear photo of your face so pharmacists can recognise you at pickup.
        </Text>
        <Button label="Take photo" fullWidth onPress={() => (setPhoto(false), showFlash('Photo updated'))} />
        <Button label="Choose from library" variant="secondary" fullWidth onPress={() => (setPhoto(false), showFlash('Photo updated'))} />
        <Button label="Remove photo" variant="destructive-inline" size="large" onPress={() => (setPhoto(false), showFlash('Photo removed', 'info'))} />
        <Button label="Cancel" variant="text" size="large" onPress={() => setPhoto(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 1.6 },
  head: { alignItems: 'center', gap: space.xxs },
  avatar: { width: 80, height: 80, borderRadius: radii.pill },
});
