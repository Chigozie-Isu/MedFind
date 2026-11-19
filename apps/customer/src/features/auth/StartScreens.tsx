import { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, space } from '@medfind/ui';
import { Button, Logo, Text, useTheme } from '@medfind/ui/native';

const SLIDES = [
  {
    image: require('../../../assets/auth/onboarding-1.png'),
    title: 'Find your medication, fast',
    body: 'Search any medicine and see which nearby pharmacies have it in stock right now.',
  },
  {
    image: require('../../../assets/auth/onboarding-2.png'),
    title: 'See who is open near you',
    body: 'Compare distance, price and opening hours on a list or a map, even late at night.',
  },
  {
    image: require('../../../assets/auth/onboarding-3.png'),
    title: 'Reserve it. Then collect.',
    // Figma repeats slide 2's sentence first; only the slide 3 sentence is kept (docs/design-deviations.md).
    body: 'Hold your medication for two hours with a pickup code. Your pharmacist answers any questions.',
  },
] as const;

/** Splash (Figma 2248:35995): the photo, the logo, Sign In and Create account. */
export function WelcomeScreen({ onSignIn, onCreateAccount }: { onSignIn: () => void; onCreateAccount: () => void }) {
  return (
    <ImageBackground source={require('../../../assets/auth/splash.png')} style={styles.flex} resizeMode="cover">
      <SafeAreaView style={styles.welcome} edges={['top', 'bottom']}>
        <View style={styles.logo}>
          <Logo height={40} tone="reversed" />
        </View>
        <View style={styles.flex} />
        <View style={styles.welcomeButtons}>
          <Button label="Sign In" fullWidth onPress={onSignIn} />
          <WhiteButton label="Create account" onPress={onCreateAccount} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

/** The white "Create account" pill on the photo (white in both themes, as in Figma). */
function WhiteButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.white, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text variant="button1" style={{ color: '#0077B6' }}>{label}</Text>
    </Pressable>
  );
}

/** Onboarding 1 to 3 (Figma 251:5188, 351:5551, 351:5664). */
export function OnboardingScreen({ initialSlide = 0, onDone }: { initialSlide?: number; onDone: () => void }) {
  const { colors } = useTheme();
  const [i, setI] = useState(initialSlide);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        {last ? (
          <Button label="Skip" variant="text" size="medium" onPress={onDone} />
        ) : (
          <Button label="Skip" variant="text" size="medium" icon="chevron-right" onPress={onDone} />
        )}
      </View>
      <View style={styles.illustration}>
        <Image source={slide.image} style={styles.image} accessibilityIgnoresInvertColors />
      </View>
      <View style={styles.copy}>
        <Text variant="h1" accessibilityRole="header">{slide.title}</Text>
        <Text variant="body3" color="secondary">{slide.body}</Text>
      </View>
      <View style={styles.dots} accessibilityLabel={`Page ${i + 1} of ${SLIDES.length}`}>
        {SLIDES.map((_, d) => (
          <View
            key={d}
            style={[styles.dot, d === i && styles.dotActive, { backgroundColor: colors.text.heading }]}
          />
        ))}
      </View>
      <View style={styles.flex} />
      <View style={styles.next}>
        <Button
          label={last ? 'Continue' : 'Next'}
          icon="chevron-right"
          onPress={() => (last ? onDone() : setI(i + 1))}
        />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  welcome: { flex: 1, paddingHorizontal: space.md },
  logo: { paddingTop: space.md },
  welcomeButtons: { gap: space.lg, paddingBottom: space.xxl * 2 },
  white: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.md, paddingTop: space.md, height: 64 },
  illustration: { alignItems: 'center', paddingTop: space.lg },
  image: { width: 300, height: 300 },
  copy: { paddingHorizontal: space.md, paddingTop: space.xxl, gap: space.xs },
  dots: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.xxl },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 14 },
  next: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.md, paddingBottom: space.md },
});
