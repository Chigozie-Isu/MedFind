'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  buttonVariants,
  iconNames,
  themes,
  webText,
  type ButtonSize,
  type ColorScheme,
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
  SideNav,
  StatusDot,
  Tag,
  TakingReservations,
  Text,
  TextField,
  ThemeToggle,
  Toast,
  Toggle,
  pharmacyNavItems,
  type TextVariantName,
} from '@medfind/ui/web';

const tones: StatusTone[] = ['neutral', 'success', 'info', 'warning', 'error'];
const states: InteractionState[] = ['default', 'hover', 'pressed', 'disabled'];
const buttonSizes: ButtonSize[] = ['large', 'medium', 'small'];
type Mode = 'both' | ColorScheme;

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 };
const stack: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };

function Section({ title, figma, children }: { title: string; figma: string; children: ReactNode }) {
  return (
    <section style={{ ...stack, paddingTop: 16, borderTop: '1px solid var(--mf-surface-border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Text variant="h4" as="h3">
          {title}
        </Text>
        <Text variant="caption1" color="var(--mf-text-tertiary)">
          Figma {figma}
        </Text>
      </div>
      {children}
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption2" color="var(--mf-text-tertiary)">
      {children}
    </Text>
  );
}

function Swatch({ name, color }: { name: string; color: string }) {
  return (
    <div style={{ width: 84, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: color, border: '1px solid var(--mf-surface-border)' }} />
      <Caption>{name}</Caption>
      <Text variant="caption2" color="var(--mf-text-secondary)">
        {color}
      </Text>
    </div>
  );
}

function Panel({ scheme }: { scheme: ColorScheme }) {
  const c = themes[scheme];
  const [option, setOption] = useState('online');
  const [checks, setChecks] = useState([true, false]);
  const [toggle, setToggle] = useState(true);
  const [live, setLive] = useState(true);
  const [code, setCode] = useState('482');
  const [text, setText] = useState('');
  const [nav, setNav] = useState('dashboard');

  return (
    <div
      data-theme={scheme}
      style={{ ...stack, gap: 24, flex: 1, minWidth: 360, padding: 24, background: 'var(--mf-surface-default)', color: 'var(--mf-text-primary)' }}
    >
      <Text variant="h2" as="h2">
        {scheme === 'dark' ? 'Dark' : 'Light'}
      </Text>

      <Section title="Colours" figma="31:55">
        <div style={row}>
          <Swatch name="Surface" color={c.surface.default} />
          <Swatch name="Raised" color={c.surface.raised} />
          <Swatch name="Muted" color={c.surface.muted} />
          <Swatch name="Pressed" color={c.surface.pressed} />
          <Swatch name="Border" color={c.surface.border} />
          <Swatch name="Brand" color={c.brand.default} />
          <Swatch name="Accent" color={c.accent} />
        </div>
        <div style={row}>
          <Swatch name="Font 1" color={c.text.primary} />
          <Swatch name="Font 2" color={c.text.heading} />
          <Swatch name="Font 3" color={c.text.body} />
          <Swatch name="Secondary" color={c.text.secondary} />
          <Swatch name="Tertiary" color={c.text.tertiary} />
          <Swatch name="Brand text" color={c.text.brand} />
        </div>
      </Section>

      <Section title="Text styles" figma="Web styles">
        {(Object.keys(webText) as TextVariantName[]).map((k) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Caption>
              {k} · {webText[k].size}/{webText[k].lineHeight}
            </Caption>
            <Text variant={k}>Find your medicine</Text>
          </div>
        ))}
      </Section>

      <Section title="Buttons" figma="43:16130">
        {buttonVariants.map((variant) => (
          <div key={variant} style={{ ...stack, gap: 8 }}>
            <Caption>{variant}</Caption>
            <div style={row}>
              {states.map((st) => (
                <Button key={st} label={st[0].toUpperCase() + st.slice(1)} variant={variant} forceState={st} disabled={st === 'disabled'} />
              ))}
            </div>
          </div>
        ))}
        <Caption>Sizes: large, medium, small</Caption>
        <div style={row}>
          {buttonSizes.map((s) => (
            <Button key={s} label="Reserve" size={s} />
          ))}
        </div>
        <Caption>With icon, icon left, just icon, loading</Caption>
        {buttonSizes.map((s) => (
          <div key={s} style={row}>
            <Button label="Next" icon="chevron-right" size={s} />
            <Button label="Back" iconLeft="chevron-left" size={s} variant="secondary" />
            <Button icon="add" size={s} accessibilityLabel="Add" />
            <Button label="Paying" loading size={s} />
          </div>
        ))}
      </Section>

      <Section title="Inputs" figma="199:4251, 195:3096, 277:6284">
        <TextField label="Full name" required info placeholder="Placeholder text..." helperText="Text user may need" value={text} onChangeText={setText} size="web" />
        <TextField label="Focus" placeholder="Placeholder text..." helperText="Text user may need" forceState="focus" size="web" />
        <TextField label="Filled" value="Amaka Obi" helperText="Text user may need" forceState="filled" size="web" />
        <TextField label="Error" value="amaka@" errorText="Enter a valid email address" size="web" />
        <TextField label="Disabled" placeholder="Placeholder text..." disabled size="web" />
        <TextField label="Password" required placeholder="Enter your password" secure value="medfind123" size="web" />
        <TextField label="Mobile size" placeholder="Placeholder text..." helperText="The smaller mobile box" />
        <SearchField placeholder="Search inventory" size="web" />
        <SearchField placeholder="Search inventory" forceState="focus" size="web" />
        <SearchField value="Amoxicillin" forceState="filled" size="web" />
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
            { value: 'online', title: 'Pay online now', icon: 'card', description: 'Card, wallet, bank transfer or USSD. Only charged if the pharmacy approves.' },
            { value: 'wallet', title: 'MedFind wallet', icon: 'wallet', description: '₦5,050 available', actionLabel: 'Top up' },
            { value: 'pharmacy', title: 'Pay at the pharmacy', description: 'Pay when you pick it up' },
          ]}
        />
        <Caption>Collapsed, default and selected</Caption>
        <OptionRow title="MedFind wallet" description="₦5,050 available" actionLabel="Top up" />
        <OptionRow title="MedFind wallet" description="₦5,050 available" actionLabel="Top up" selected />
        <div style={row}>
          <Radio />
          <Radio selected />
          <Checkbox accessibilityLabel="Off" />
          <Checkbox checked accessibilityLabel="On" />
          <Toggle value={toggle} onChange={setToggle} accessibilityLabel="Toggle" />
          <Toggle value={!toggle} onChange={(x) => setToggle(!x)} accessibilityLabel="Toggle off" />
        </div>
        {checks.map((on, i) => (
          <ChecklistItem
            key={i}
            title="Medicine name and dosage"
            subtitle="Augmentin suspension 228 mg/5 ml × 1"
            checked={on}
            onChange={(x) => setChecks((prev) => prev.map((p, j) => (j === i ? x : p)))}
          />
        ))}
        <ListRow title="Fuasi Pharmacy" subtitle="Open until 21:00" meta="1.8 km away" actionLabel="Add" />
        <ListRow title="Fuasi Pharmacy" subtitle="Pressed" meta="1.8 km away" actionLabel="Add" forcePressed />
      </Section>

      <Section title="Side nav" figma="169:8189, 597:13394">
        <div style={{ border: '1px solid var(--mf-surface-border)', borderRadius: 16, overflow: 'hidden', alignSelf: 'flex-start' }}>
          <SideNav
            items={pharmacyNavItems.map((it) => (it.key === 'reservations' ? { ...it, count: 4 } : it.key === 'inventory' ? { ...it, count: 12 } : it))}
            activeKey={nav}
            onNavigate={setNav}
            takingReservations={live}
            onTakingReservationsChange={setLive}
            header={<Text variant="h3">MedFind</Text>}
          />
        </div>
        <Caption>Taking reservations, offline</Caption>
        <div style={{ alignSelf: 'flex-start' }}>
          <TakingReservations live={false} />
        </div>
        <Caption>Sun/moon toggle (switches the whole app)</Caption>
        <ThemeToggle />
      </Section>

      <Section title="Badges and tags" figma="327:6702, 2105:26425, 394:3814">
        <Caption>Filled</Caption>
        <div style={row}>{tones.map((t) => <Badge key={t} label={t} tone={t} />)}</div>
        <Caption>Not filled</Caption>
        <div style={row}>{tones.map((t) => <Badge key={t} label={t} tone={t} appearance="outline" />)}</div>
        <Caption>Dot left and right</Caption>
        <div style={row}>{tones.map((t) => <Badge key={t} label={t} tone={t} dot="left" />)}</div>
        <div style={row}>{tones.map((t) => <Badge key={t} label={t} tone={t} dot="right" />)}</div>
        <Caption>Status</Caption>
        <div style={row}>{tones.map((t) => <StatusDot key={t} tone={t} accessibilityLabel={t} />)}</div>
        <div style={row}>
          <FilterChip label="Prescriptions" />
          <FilterChip label="Open now" />
          <FilterChip label="Delivery" />
        </div>
        <div style={row}>
          <Tag label="All" count={550} active />
          <Tag label="Pending" count={12} />
        </div>
      </Section>

      <Section title="Cards" figma="529:23194, 2105:26289">
        <Card>
          <Text variant="h5">Card</Text>
          <Text variant="body3" color="var(--mf-text-secondary)">
            Raised surface, 24px radius, cards shadow.
          </Text>
        </Card>
        <DrugCard name="Augmentin suspension 228 mg/5 ml" pharmacy="Fuasi Pharmacy" distance="1.8 km" priceKobo={345000} />
        <div style={row}>
          <MedicationCard title="Medication" subtitle="120 searches" />
          <PhotoCard title="delivery-01-11-26.jpg" subtitle="1 medicine found" />
        </div>
        <CalloutCard title="Need a hand?" body={'Our pharmacy team can help you get set up,\n08:00 to 20:00 every day.'} linkLabel="Chat with us from 08:00 to 22:00" />
        <CalloutCard title="Need a hand?" body="Add another pharmacist so someone can always approve orders." buttonLabel="Add another" />
        <InsightCard title="Reservations" value="24" insight="+12% this week" trend="up" onDismiss={() => {}} />
        <InsightCard title="Reservations" value="24" insight="-4% this week" trend="down" forcePressed />
      </Section>

      <Section title="Toasts" figma="2457:85043">
        <Toast message="Pickup code copied" />
        <Toast message="Payment failed. Try again." tone="error" />
        <Toast message="Your reservation expires in 15 minutes" tone="info" />
      </Section>

      <Section title="Icons" figma="34:577, 2108:25174">
        <div style={row}>
          {iconNames.map((n) => (
            <div key={n} style={{ width: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Icon name={n} size={24} />
              <Caption>{n}</Caption>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function ComponentsShowcase() {
  const [mode, setMode] = useState<Mode>('both');
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ ...row, justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--mf-surface-border)' }}>
        <Text variant="h3" as="h1">
          Components
        </Text>
        <div style={row}>
          <Tag label="Light + dark" active={mode === 'both'} onPress={() => setMode('both')} />
          <Tag label="Light" active={mode === 'light'} onPress={() => setMode('light')} />
          <Tag label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} />
        </div>
      </header>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {mode !== 'dark' && <Panel scheme="light" />}
        {mode !== 'light' && <Panel scheme="dark" />}
      </div>
    </div>
  );
}
