import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, requiredContrast } from '../src/contrast.ts';
import { themes } from '../src/theme.ts';
import type { ColorScheme, ThemeColors } from '../src/theme.ts';
import { mobileText, webText, componentText } from '../src/tokens/typography.ts';

type Pair = { name: string; fg: string; bg: string; size: number; weight?: number };

/** Every text colour a component draws, on every background it sits on. */
function pairsFor(c: ThemeColors): Pair[] {
  const pageSurfaces = { page: c.surface.default, raised: c.surface.raised, muted: c.surface.muted };
  const pairs: Pair[] = [];
  const onSurfaces = (name: string, fg: string, size: number, weight = 400, surfaces: Record<string, string> = pageSurfaces) => {
    for (const [s, bg] of Object.entries(surfaces)) pairs.push({ name: `${name} on ${s}`, fg, bg, size, weight });
  };

  // Body copy, headings and links on every surface. Sizes are the smallest each token is used at.
  onSurfaces('text.primary', c.text.primary, 11);
  onSurfaces('text.heading', c.text.heading, 11);
  onSurfaces('text.body', c.text.body, 11);
  onSurfaces('text.secondary', c.text.secondary, 11);
  onSurfaces('text.tertiary', c.text.tertiary, 11);
  // Brand text is 4.4:1 on the muted panel (#EFF4F8), so Figma only uses it
  // there at 40px (insight card number). Keep small brand text off muted panels.
  const brandSurfaces = { page: c.surface.default, raised: c.surface.raised };
  onSurfaces('text.brand', c.text.brand, 12, 500, brandSurfaces);
  pairs.push({ name: 'insight number (pressed)', fg: c.text.brand, bg: c.surface.muted, size: 40, weight: 600 });
  onSurfaces('text.success', c.text.success, 14);
  onSurfaces('text.error', c.text.error, 11);
  // Selected option rows and pressed list rows.
  for (const k of ['primary', 'body', 'secondary'] as const) {
    pairs.push({ name: `text.${k} on selected`, fg: c.text[k], bg: c.surface.selected, size: 15 });
    pairs.push({ name: `text.${k} on pressed`, fg: c.text[k], bg: c.surface.pressed, size: 12 });
  }

  // Sign In / Sign Up switch and the "OR CONTINUE WITH" label.
  pairs.push({ name: 'segment active', fg: c.segment.activeText, bg: c.segment.activeBg, size: 16, weight: 600 });
  pairs.push({ name: 'segment inactive', fg: c.segment.inactiveText, bg: c.segment.track, size: 16, weight: 600 });

  // Buttons (disabled states are exempt from contrast rules).
  for (const st of ['default', 'hover', 'pressed'] as const) {
    pairs.push({ name: `primary button ${st}`, fg: c.button.primaryText, bg: c.button.primaryBg[st], size: 12, weight: 600 });
    pairs.push({ name: `destructive button ${st}`, fg: c.button.primaryText, bg: c.button.destructiveBg[st], size: 12, weight: 600 });
    onSurfaces(`secondary button ${st}`, c.button.secondary[st], 12, 600, brandSurfaces);
    onSurfaces(`inline button ${st}`, c.button.inline[st], 12, 600, brandSurfaces);
    onSurfaces(`destructive outline ${st}`, c.button.destructive[st], 12, 600);
  }

  // Inputs sit on the page or on a card.
  const inputBgs = { page: c.surface.default, raised: c.surface.raised };
  onSurfaces('input.value', c.input.value, 12, 500, inputBgs);
  onSurfaces('input.placeholder', c.input.placeholder, 12, 500, inputBgs);
  onSurfaces('input.label', c.input.label, 14, 500, inputBgs);
  onSurfaces('required asterisk', c.text.required, 14, 500, inputBgs);
  onSurfaces('input.helper', c.input.helper, 11, 500, inputBgs);
  onSurfaces('input.helperError', c.input.helperError, 11, 500, inputBgs);

  // Badges, chips, nav, toast.
  for (const [tone, t] of Object.entries(c.tone)) {
    pairs.push({ name: `${tone} badge`, fg: t.text, bg: t.bg, size: 11, weight: 500 });
    onSurfaces(`${tone} outline badge`, t.outlineText, 11, 500, inputBgs);
  }
  pairs.push({ name: 'filter chip', fg: c.chip.text, bg: c.chip.bg, size: 13, weight: 500 });
  pairs.push({ name: 'nav item', fg: c.nav.itemText, bg: c.surface.raised, size: 20, weight: 500 });
  pairs.push({ name: 'nav count', fg: c.nav.countText, bg: c.surface.raised, size: 16 });
  pairs.push({ name: 'nav active item', fg: c.nav.activeText, bg: c.nav.activeBg, size: 20, weight: 500 });
  pairs.push({ name: 'nav active count', fg: c.nav.activeCountText, bg: c.nav.activeCountBg, size: 16 });
  pairs.push({ name: 'tab label', fg: c.text.body, bg: c.surface.raised, size: 12, weight: 500 });
  pairs.push({ name: 'selected tab label', fg: c.text.onBrand, bg: c.brand.default, size: 12, weight: 500 });
  pairs.push({ name: 'toast', fg: c.toast.text, bg: c.toast.bg, size: 14, weight: 500 });
  pairs.push({ name: 'callout link', fg: c.text.brand, bg: c.brandSubtle, size: 12, weight: 500 });
  pairs.push({ name: 'callout body', fg: c.text.secondary, bg: c.brandSubtle, size: 14 });
  return pairs;
}

for (const scheme of ['light', 'dark'] as ColorScheme[]) {
  test(`${scheme} theme: every text colour meets the contrast rule`, () => {
    const failures = pairsFor(themes[scheme])
      .map((p) => ({ ...p, ratio: contrastRatio(p.fg, p.bg), need: requiredContrast(p.size, p.weight) }))
      .filter((p) => p.ratio < p.need)
      .map((p) => `${p.name}: ${p.fg} on ${p.bg} = ${p.ratio.toFixed(2)} (needs ${p.need})`);
    assert.deepEqual(failures, []);
  });
}

test('light and dark themes define the same tokens', () => {
  const keys = (o: object, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
  assert.deepEqual(keys(themes.dark).sort(), keys(themes.light).sort());
});

test('text styles convert Figma line heights and letter spacing to pixels', () => {
  assert.deepEqual(mobileText.h1, { family: 'poppins', weight: 600, size: 28, lineHeight: 33.6, letterSpacing: -0.56 });
  assert.equal(mobileText.body1.lineHeight, 25.5);
  assert.equal(mobileText.button1.lineHeight, 16);
  assert.equal(webText.h1.size, 40, 'web H1 follows the real style (40px), not the Typescale label (48px)');
  assert.equal(webText.h1.weight, 600, 'H1 follows the real style (SemiBold), not the Typescale label (Bold)');
  assert.equal(webText.body3.lineHeight, 21);
  assert.equal(componentText.insightNumber.size, 40);
});

test('headings use Poppins and everything else uses Manrope', () => {
  for (const set of [mobileText, webText]) {
    for (const [name, s] of Object.entries(set)) {
      const expected = ['h1', 'h2', 'h3'].includes(name) ? 'poppins' : 'manrope';
      assert.equal(s.family, expected, name);
    }
  }
});
