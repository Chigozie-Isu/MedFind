import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  buttonVariants,
  iconNames,
  mobileText,
  radii,
  space,
  type ButtonSize,
  type CustomerTab,
  type InteractionState,
  type StatusTone,
} from '@medfind/ui';
import {
  Badge,
  Button,
  CalloutCard,
  Card,
  Checkbox,
  ChecklistItem,
  CodeInput,
  DrugCard,
  FilterChip,
  Icon,
  InsightCard,
  ListRow,
  MedicationCard,
  OptionList,
  OptionRow,
  PhotoCard,
  Radio,
  SearchField,
  StatusDot,
  TabBar,
  Tag,
  Text,
  TextField,
  Toast,
  Toggle,
  useTheme,
} from '@medfind/ui/native';

const tones: StatusTone[] = ['neutral', 'success', 'info', 'warning', 'error'];
const states: InteractionState[] = ['default', 'hover', 'pressed', 'disabled'];
const buttonSizes: ButtonSize[] = ['large', 'medium', 'small'];

function Section({ title, figma, children }: { title: string; figma: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { borderColor: colors.surface.border }]}>
      <View style={styles.sectionHeader}>
        <Text variant="h3">{title}</Text>
        <Text variant="caption1" color="tertiary">
          Figma {figma}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Row({ children, wrap = true }: { children: ReactNode; wrap?: boolean }) {
  return <View style={[styles.row, wrap && { flexWrap: 'wrap' }]}>{children}</View>;
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption2" color="tertiary">
      {children}
    </Text>
  );
}

function Swatch({ name, color }: { name: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchChip, { backgroundColor: color, borderColor: colors.surface.border }]} />
      <Caption>{name}</Caption>
      <Text variant="caption2" color="secondary">
        {color}
      </Text>
    </View>
  );
}

/** Every shared component, in one colour scheme. Rendered once per scheme. */
export function Showcase() {
  const { colors, scheme } = useTheme();
  const [option, setOption] = useState('online');
  const [checks, setChecks] = useState([true, false]);
  const [toggle, setToggle] = useState(true);
  const [code, setCode] = useState('482');
  const [tab, setTab] = useState<CustomerTab>('home');
  const [text, setText] = useState('');

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface.default }]}>
      <Text variant="h2">{scheme === 'dark' ? 'Dark' : 'Light'}</Text>

      <Section title="Colours" figma="31:55">
        <Row>
          <Swatch name="Surface" color={colors.surface.default} />
          <Swatch name="Raised" color={colors.surface.raised} />
          <Swatch name="Muted" color={colors.surface.muted} />
          <Swatch name="Pressed" color={colors.surface.pressed} />
          <Swatch name="Border" color={colors.surface.border} />
          <Swatch name="Brand" color={colors.brand.default} />
          <Swatch name="Accent" color={colors.accent} />
        </Row>
        <Row>
          <Swatch name="Font 1" color={colors.text.primary} />
          <Swatch name="Font 2" color={colors.text.heading} />
          <Swatch name="Font 3" color={colors.text.body} />
          <Swatch name="Secondary" color={colors.text.secondary} />
          <Swatch name="Tertiary" color={colors.text.tertiary} />
          <Swatch name="Brand text" color={colors.text.brand} />
        </Row>
      </Section>

      <Section title="Text styles" figma="Mobile styles">
        {(Object.keys(mobileText) as Array<keyof typeof mobileText>).map((k) => (
          <View key={k} style={styles.textRow}>
            <Caption>
              {k} · {mobileText[k].size}/{mobileText[k].lineHeight}
            </Caption>
            <Text variant={k}>Find your medicine</Text>
          </View>
        ))}
      </Section>

      <Section title="Buttons" figma="43:16130">
        {buttonVariants.map((variant) => (
          <View key={variant} style={styles.block}>
            <Caption>{variant}</Caption>
            <Row>
              {states.map((st) => (
                <Button key={st} label={st[0].toUpperCase() + st.slice(1)} variant={variant} forceState={st} disabled={st === 'disabled'} />
              ))}
            </Row>
          </View>
        ))}
        <Caption>Sizes: large, medium, small</Caption>
        <Row>
          {buttonSizes.map((s) => (
            <Button key={s} label="Reserve" size={s} />
          ))}
        </Row>
        <Caption>With icon, icon left, just icon, loading</Caption>
        {buttonSizes.map((s) => (
          <Row key={s}>
            <Button label="Next" icon="chevron-right" size={s} />
            <Button label="Back" iconLeft="chevron-left" size={s} variant="secondary" />
            <Button icon="add" size={s} accessibilityLabel="Add" />
            <Button label="Paying" loading size={s} />
          </Row>
        ))}
      </Section>

      <Section title="Inputs" figma="199:4251, 195:3096, 277:6284">
        <TextField label="Full name" required info placeholder="Placeholder text..." helperText="Text user may need" value={text} onChangeText={setText} />
        <TextField label="Focus" placeholder="Placeholder text..." helperText="Text user may need" forceState="focus" />
        <TextField label="Filled" value="Amaka Obi" helperText="Text user may need" forceState="filled" />
        <TextField label="Error" value="amaka@" errorText="Enter a valid email address" />
        <TextField label="Disabled" placeholder="Placeholder text..." disabled />
        <TextField label="Password" required placeholder="Enter your password" secure value="medfind123" />
        <TextField label="Web size" placeholder="Placeholder text..." size="web" helperText="51px box, from the Web variant" />
        <SearchField placeholder="Search for a medicine" />
        <SearchField placeholder="Search for a medicine" forceState="focus" />
        <SearchField value="Amoxicillin" forceState="filled" />
        <Caption>Pickup code (6 digits) and error</Caption>
        <CodeInput value={code} onChangeText={setCode} />
        <CodeInput value="482913" error />
        <Caption>Staff passcode (5 digits, masked)</Caption>
        <CodeInput length={5} groupSize={0} value="123" secure />
      </Section>

      <Section title="Option lists" figma="505:16232, 505:16205, 456:14308, 535:18772">
        <OptionList
          value={option}
          onChange={setOption}
          options={[
            {
              value: 'online',
              title: 'Pay online now',
              icon: 'card',
              description: 'Card, wallet, bank transfer or USSD. Only charged if the pharmacy approves.',
            },
            { value: 'wallet', title: 'MedFind wallet', icon: 'wallet', description: '₦5,050 available', actionLabel: 'Top up' },
            { value: 'pharmacy', title: 'Pay at the pharmacy', description: 'Pay when you pick it up' },
          ]}
        />
        <Caption>Collapsed, default and selected</Caption>
        <OptionRow title="MedFind wallet" description="₦5,050 available" actionLabel="Top up" />
        <OptionRow title="MedFind wallet" description="₦5,050 available" actionLabel="Top up" selected />
        <Row>
          <Radio />
          <Radio selected />
          <Checkbox />
          <Checkbox checked />
          <Toggle value={toggle} onChange={setToggle} accessibilityLabel="Toggle" />
          <Toggle value={!toggle} onChange={(v) => setToggle(!v)} accessibilityLabel="Toggle off" />
        </Row>
        {checks.map((c, i) => (
          <ChecklistItem
            key={i}
            title="Medicine name and dosage"
            subtitle="Augmentin suspension 228 mg/5 ml × 1"
            checked={c}
            onChange={(v) => setChecks((prev) => prev.map((p, j) => (j === i ? v : p)))}
          />
        ))}
        <ListRow title="Fuasi Pharmacy" subtitle="Open until 21:00" meta="1.8 km away" actionLabel="Add" />
        <ListRow title="Fuasi Pharmacy" subtitle="Pressed" meta="1.8 km away" actionLabel="Add" forcePressed />
      </Section>

      <Section title="Badges and tags" figma="327:6702, 2105:26425, 394:3814">
        <Caption>Filled</Caption>
        <Row>
          {tones.map((t) => (
            <Badge key={t} label={t} tone={t} />
          ))}
        </Row>
        <Caption>Not filled</Caption>
        <Row>
          {tones.map((t) => (
            <Badge key={t} label={t} tone={t} appearance="outline" />
          ))}
        </Row>
        <Caption>Dot left and right</Caption>
        <Row>
          {tones.map((t) => (
            <Badge key={t} label={t} tone={t} dot="left" />
          ))}
        </Row>
        <Row>
          {tones.map((t) => (
            <Badge key={t} label={t} tone={t} dot="right" />
          ))}
        </Row>
        <Caption>Status</Caption>
        <Row>
          {tones.map((t) => (
            <StatusDot key={t} tone={t} accessibilityLabel={t} />
          ))}
        </Row>
        <Row>
          <FilterChip label="Prescriptions" />
          <FilterChip label="Open now" />
          <FilterChip label="Delivery" />
        </Row>
        <Row>
          <Tag label="All" count={550} active />
          <Tag label="Pending" count={12} />
        </Row>
      </Section>

      <Section title="Cards" figma="529:23194, 2105:26289">
        <Card>
          <Text variant="h5">Card</Text>
          <Text variant="body3" color="secondary">
            Raised surface, 24px radius, cards shadow.
          </Text>
        </Card>
        <DrugCard name="Augmentin suspension 228 mg/5 ml" pharmacy="Fuasi Pharmacy" distance="1.8 km" priceKobo={345000} />
        <Row>
          <MedicationCard title="Medication" subtitle="120 searches" />
          <PhotoCard title="delivery-01-11-26.jpg" subtitle="1 medicine found" />
        </Row>
        <CalloutCard
          title="Need a hand?"
          body={'Our pharmacy team can help you get set up,\n08:00 to 20:00 every day.'}
          linkLabel="Chat with us from 08:00 to 22:00"
        />
        <CalloutCard title="Need a hand?" body="Add another pharmacist so someone can always approve orders." buttonLabel="Add another" />
        <InsightCard title="Reservations" value="24" insight="+12% this week" trend="up" onDismiss={() => {}} />
        <InsightCard title="Reservations" value="24" insight="-4% this week" trend="down" forcePressed />
      </Section>

      <Section title="Toasts" figma="2457:85043">
        <Toast message="Pickup code copied" />
        <Toast message="Payment failed. Try again." tone="error" />
        <Toast message="Your reservation expires in 15 minutes" tone="info" />
      </Section>

      <Section title="Tab bar" figma="2105:26351">
        <TabBar active={tab} onChange={setTab} />
        <TabBar active="reservation" />
        <TabBar active="saved" />
      </Section>

      <Section title="Icons" figma="34:577, 2108:25174">
        <Row>
          {iconNames.map((n) => (
            <View key={n} style={styles.iconCell}>
              <Icon name={n} size={24} />
              <Caption>{n}</Caption>
            </View>
          ))}
        </Row>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, padding: space.md, gap: space.lg, minWidth: 343 },
  section: { gap: space.md, paddingTop: space.md, borderTopWidth: 1 },
  sectionHeader: { gap: space.xxs },
  block: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  textRow: { gap: 2 },
  swatch: { width: 72, gap: 2 },
  swatchChip: { width: 40, height: 40, borderRadius: radii.sm, borderWidth: 1 },
  iconCell: { width: 76, alignItems: 'center', gap: space.xxs },
});
