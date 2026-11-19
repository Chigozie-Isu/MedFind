import { buttonColors, buttonVariants, isOutlined } from '../buttonColors.ts';
import { themes, type ThemeColors } from '../theme.ts';
import { boxShadow, radii, sizes, space } from '../tokens/layout.ts';
import { componentText, mobileText, webFontStacks, webText, type TextStyleToken } from '../tokens/typography.ts';
import type { InteractionState } from '../types.ts';

/*
 * The pharmacy app styles components with CSS classes that read CSS
 * variables. The variables are generated from the same ThemeColors object
 * the native components use, so both apps share one set of tokens.
 * `[data-theme="dark"]` on <html> (or any wrapper) switches the subtree.
 */

type Tree = { [k: string]: string | number | Tree };

function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function flatten(tree: Tree, prefix: string, out: Record<string, string>): Record<string, string> {
  for (const [k, v] of Object.entries(tree)) {
    const name = `${prefix}-${kebab(k)}`;
    if (typeof v === 'object') flatten(v, name, out);
    else out[name] = String(v);
  }
  return out;
}

function mapLeaves(tree: Tree, prefix: string): Tree {
  const out: Tree = {};
  for (const [k, v] of Object.entries(tree)) {
    const name = `${prefix}-${kebab(k)}`;
    out[k] = typeof v === 'object' ? mapLeaves(v, name) : `var(${name})`;
  }
  return out;
}

/** CSS custom properties for one colour scheme. */
export function cssVariables(colors: ThemeColors): Record<string, string> {
  return flatten(colors as unknown as Tree, '--mf', {});
}

/** A ThemeColors-shaped object whose values are `var(--mf-...)` references. */
export const v = mapLeaves(themes.light as unknown as Tree, '--mf') as unknown as ThemeColors;

function block(selector: string, vars: Record<string, string>, extra = ''): string {
  return `${selector}{${Object.entries(vars)
    .map(([k, val]) => `${k}:${val};`)
    .join('')}${extra}}`;
}

function font(t: TextStyleToken): string {
  return `font-family:${webFontStacks[t.family]};font-weight:${t.weight};font-size:${t.size}px;line-height:${t.lineHeight}px;letter-spacing:${t.letterSpacing}px;`;
}

/** `.mf-t-*` are the Web text styles; `.mf-tm-*` are the Mobile ones (some components only exist as mobile frames). */
const textClasses =
  Object.entries(webText)
    .map(([name, t]) => `.mf-t-${name}{${font(t)}}`)
    .join('') +
  Object.entries(mobileText)
    .map(([name, t]) => `.mf-tm-${name}{${font(t)}}`)
    .join('');

function buttonCss(): string {
  const states: InteractionState[] = ['default', 'hover', 'pressed', 'disabled'];
  const sel: Record<InteractionState, string> = {
    default: '',
    hover: ':hover:not(:disabled),[data-state="hover"]',
    pressed: ':active:not(:disabled),[data-state="pressed"]',
    disabled: ':disabled:not([aria-busy]),[data-state="disabled"]',
  };
  let css = '';
  for (const variant of buttonVariants) {
    for (const st of states) {
      const c = buttonColors(v, variant, st);
      const selectors = sel[st]
        ? sel[st].split(',').map((s) => `.mf-btn[data-variant="${variant}"]${s}`).join(',')
        : `.mf-btn[data-variant="${variant}"]`;
      css += `${selectors}{background:${c.background};color:${c.text};border-color:${c.border};}`;
    }
    if (isOutlined(variant)) css += `.mf-btn[data-variant="${variant}"]{border-width:${sizes.border.hairline}px;}`;
  }
  for (const [size, d] of Object.entries(sizes.button)) {
    const t = size === 'large' ? webText.button1 : size === 'medium' ? webText.button2 : webText.button3;
    css += `.mf-btn[data-size="${size}"]{padding:${d.paddingY}px ${d.paddingX}px;${font(t)}}`;
    css += `.mf-btn[data-size="${size}"][data-icon-only]{padding:${(d.iconOnly - d.iconOnlyIcon) / 2}px;width:${d.iconOnly}px;height:${d.iconOnly}px;border-radius:50%;}`;
  }
  css += `.mf-btn[data-variant="text"]{padding:0;}`;
  return css;
}

const componentCss = `
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;background:${v.surface.default};color:${v.text.primary};${font(webText.body2)}}
.mf-root{background:${v.surface.default};color:${v.text.primary};}
.mf-icon{display:inline-block;flex:none;vertical-align:middle;}
.mf-focusable:focus-visible{outline:2px solid ${v.brand.default};outline-offset:2px;}

.mf-btn{display:inline-flex;align-items:center;justify-content:center;gap:${space.xs}px;border:0 solid transparent;border-radius:${radii.xl}px;cursor:pointer;white-space:nowrap;text-decoration:none;transition:background-color .12s,color .12s,border-color .12s;}
.mf-btn:disabled,.mf-btn[data-state="disabled"]{cursor:not-allowed;}.mf-btn[aria-busy]{cursor:progress;}
.mf-btn[data-full-width]{display:flex;width:100%;}
${buttonCss()}
.mf-btn{position:relative;}.mf-btn-content{display:inline-flex;align-items:center;gap:inherit;}.mf-btn-content[data-hidden]{visibility:hidden;}.mf-btn>.mf-spinner{position:absolute;top:50%;left:50%;margin:-8px 0 0 -8px;}
.mf-spinner{width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:mf-spin .7s linear infinite;}
@keyframes mf-spin{to{transform:rotate(360deg);}}

.mf-field{display:flex;flex-direction:column;gap:${space.xs}px;}
.mf-field-label{display:flex;align-items:center;gap:${space.xs}px;color:${v.input.label};}
.mf-field-required{color:${v.text.required};${font(webText.body2)}}
.mf-field-box{position:relative;display:flex;align-items:center;gap:${space.xs}px;padding:${space.xs}px ${space.md}px;border-radius:${radii.lg}px;background:${v.input.background};}
.mf-field-box[data-size="web"]{padding:${space.md}px;}
.mf-field-box::before{content:"";position:absolute;inset:0;border-radius:inherit;border:${sizes.border.hairline}px solid var(--mf-field-border);opacity:${themes.light.input.borderOpacity};pointer-events:none;}
.mf-field-box{--mf-field-border:${v.input.border};}
.mf-field-box[data-state="filled"]{--mf-field-border:${v.input.borderFilled};}
.mf-field-box[data-state="focus"],.mf-field-box:focus-within{--mf-field-border:${v.input.borderFocus};}
.mf-field-box[data-state="error"]{--mf-field-border:${v.input.borderError};}
.mf-field-box[data-state="disabled"]{--mf-field-border:${v.input.borderDisabled};}
.mf-input{flex:1;min-width:0;border:0;outline:0;padding:0;margin:0;background:transparent;color:${v.input.value};${font(webText.caption1)}}
.mf-input::placeholder{color:${v.input.placeholder};opacity:1;}
.mf-input:disabled{color:${v.text.disabled};}
.mf-field-helper{display:flex;align-items:center;gap:${space.xs}px;color:${v.input.helper};}
.mf-field-helper[data-error]{color:${v.input.helperError};}
.mf-icon-btn{display:inline-flex;border:0;background:none;padding:0;cursor:pointer;color:inherit;}

.mf-search{display:flex;align-items:center;gap:${space.md}px;height:42px;padding:${space.xs}px ${space.md}px;border:${sizes.border.hairline}px solid ${v.search.border};border-radius:${radii.lg}px;color:${v.icon.default};}
.mf-search[data-state="filled"]{border-color:${v.search.borderFilled};}
.mf-search[data-state="focus"],.mf-search:focus-within{border-color:${v.search.borderFocus};}
.mf-search .mf-input{${font(webText.body3)}}

.mf-code{display:inline-flex;align-items:center;gap:${space.md}px;position:relative;cursor:text;}
.mf-code-group{display:inline-flex;gap:${space.md}px;}
.mf-code-sep{color:${v.text.heading};${font(componentText.codeSeparator)}}
.mf-code-box{display:inline-flex;align-items:center;justify-content:center;width:${sizes.codeBox.width}px;height:${sizes.codeBox.height}px;border:${sizes.border.strong}px solid ${v.input.border};border-radius:${radii.sm}px;color:${v.text.heading};${font(componentText.codeDigit)}}
.mf-code-box[data-empty]{color:${v.text.tertiary};}
.mf-code[data-error] .mf-code-box{border-color:${v.input.borderError};}
.mf-code:focus-within .mf-code-box[data-current]{border-color:${v.input.borderFocus};}
.mf-code-input{position:absolute;inset:0;opacity:0;border:0;}

.mf-radio{display:inline-flex;align-items:center;justify-content:center;width:${sizes.radio}px;height:${sizes.radio}px;flex:none;}
.mf-radio::before{content:"";width:19px;height:19px;border-radius:50%;border:1.5px solid ${v.control.off};box-sizing:border-box;}
.mf-radio[data-selected]::before{width:18px;height:18px;border:2px solid ${v.control.on};background:radial-gradient(circle,${v.control.on} 0 5px,transparent 5.5px);}
.mf-checkbox{display:inline-flex;align-items:center;justify-content:center;width:${sizes.checkbox}px;height:${sizes.checkbox}px;flex:none;border-radius:${radii.sm}px;border:${sizes.border.hairline}px solid ${v.control.on};background:transparent;color:${v.text.onBrand};padding:0;cursor:pointer;}
.mf-checkbox[aria-checked="true"]{background:${v.control.on};}
.mf-option{display:flex;align-items:flex-start;gap:${space.md}px;padding:${space.md}px;border-radius:${radii.xl}px;border:${sizes.border.hairline}px solid ${v.control.optionBorder};background:${v.surface.raised};text-align:left;width:100%;cursor:pointer;color:inherit;font:inherit;}
.mf-option[aria-checked="true"]{background:${v.surface.selected};border-color:${v.control.optionBorderSelected};}
.mf-option-content{flex:1;display:flex;flex-direction:column;gap:${space.xs}px;}
.mf-option-title{display:flex;align-items:center;gap:${space.xs}px;color:${v.text.primary};}
.mf-option-desc{color:${v.text.secondary};}
.mf-option[aria-checked="true"] .mf-option-desc{color:${v.control.optionSelectedText};}
.mf-option-action{border:0;background:none;padding:0;cursor:pointer;color:${v.text.brand};}
.mf-option[aria-checked="true"] .mf-option-action{color:${v.control.optionSelectedAction};}
.mf-stack{display:flex;flex-direction:column;gap:${space.md}px;}
.mf-checklist{display:flex;align-items:flex-start;gap:${space.lg}px;padding:${space.md}px;border-radius:${radii.xl}px;background:${v.surface.raised};cursor:pointer;}
.mf-checklist-content{display:flex;flex-direction:column;gap:${space.md}px;}
.mf-list-row{display:flex;gap:${space.md}px;padding:${space.md}px;border-radius:${radii.xl}px;background:${v.surface.raised};}
.mf-list-row:active,.mf-list-row[data-pressed]{background:${v.surface.pressed};}
.mf-thumb{width:42px;height:42px;border-radius:${radii.lg}px;background:${v.surface.muted};object-fit:cover;flex:none;}
.mf-toggle{position:relative;width:${sizes.toggle.width}px;height:${sizes.toggle.height}px;border-radius:999px;border:0;padding:0;cursor:pointer;background:${v.control.toggleOff};flex:none;}
.mf-toggle[aria-checked="true"]{background:${v.control.toggleOn};}
.mf-toggle::after{content:"";position:absolute;top:1.83px;left:2.75px;width:${sizes.toggle.knob}px;height:${sizes.toggle.knob}px;border-radius:50%;background:${v.control.toggleKnob};transition:left .15s;}
.mf-toggle[aria-checked="true"]::after{left:22px;}
.mf-toggle:disabled{opacity:.4;cursor:not-allowed;}

.mf-badge{display:inline-flex;align-items:center;gap:${space.xs}px;padding:${space.xxs}px ${space.xs}px;border-radius:${radii.lg}px;${font(webText.caption2)}}
.mf-badge[data-appearance="outline"]{border:${sizes.border.hairline}px solid;}
.mf-dot{width:${sizes.badgeDot}px;height:${sizes.badgeDot}px;border-radius:50%;flex:none;}
.mf-status{display:inline-block;width:${sizes.statusDot}px;height:${sizes.statusDot}px;border-radius:50%;}
${(['neutral', 'success', 'info', 'warning', 'error'] as const)
  .map(
    (t) =>
      `.mf-badge[data-tone="${t}"]{background:${v.tone[t].bg};color:${v.tone[t].text};}` +
      `.mf-badge[data-tone="${t}"][data-appearance="outline"]{background:transparent;border-color:${v.tone[t].border};color:${v.tone[t].outlineText};}` +
      `.mf-badge[data-tone="${t}"] .mf-dot{background:${v.tone[t].dot};}` +
      `.mf-status[data-tone="${t}"]{background:${v.tone[t].status};}`,
  )
  .join('')}
.mf-chip{display:inline-flex;align-items:center;padding:${space.xxs}px ${space.xs}px;border-radius:${radii.xl}px;border:0;background:${v.chip.bg};color:${v.chip.text};cursor:pointer;${font(webText.label2)}}
.mf-tag{display:inline-flex;align-items:center;gap:${space.xs}px;padding:${space.xs}px ${space.md}px;border-radius:${radii.xl}px;border:${sizes.border.hairline}px solid transparent;background:none;cursor:pointer;color:${v.text.body};}
.mf-tag[aria-selected="true"]{border-color:${v.input.border};}
.mf-tag-count{color:${v.text.secondary};${font(webText.body3)}}

.mf-card{display:flex;flex-direction:column;gap:${space.xs}px;text-align:left;border-radius:${radii.xl}px;background:${v.surface.raised};}
.mf-card[data-padded]{padding:${space.md}px;}
.mf-card[data-elevated]{box-shadow:${boxShadow('card')};}
.mf-img{background:${v.surface.muted};object-fit:cover;display:block;}
.mf-drug{display:flex;gap:${space.md}px;padding:${space.md}px;border-radius:${radii.xl}px;background:${v.surface.raised};}
.mf-drug-img{width:42px;height:68px;border-radius:${radii.xl}px;flex:none;}
.mf-drug-content{flex:1;display:flex;flex-direction:column;gap:${space.xs}px;min-width:0;}
.mf-med{position:relative;width:164px;height:168px;border-radius:${radii.xl}px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;background:${v.surface.muted};}
.mf-med-img{position:absolute;inset:0;width:100%;height:100%;}
.mf-med-details{position:relative;display:flex;align-items:center;gap:${space.sm}px;padding:${space.md}px;background:${v.surface.muted};}
.mf-photo{width:234px;display:flex;flex-direction:column;gap:${space.md}px;padding:${space.md}px;border-radius:${radii.xl}px;background:${v.surface.raised};}
.mf-photo-img{height:180px;border-radius:${radii.xl}px;width:100%;}
.mf-callout{display:flex;flex-direction:column;gap:23px;padding:${space.md}px;border-radius:${radii.xl}px;background:${v.brandSubtle};}
.mf-callout-body{white-space:pre-line;}
.mf-callout-icon{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:${v.surface.raised};color:${v.text.brand};}
.mf-callout-link{display:inline-flex;align-items:center;gap:${space.md}px;color:${v.text.brand};text-decoration:none;}
.mf-insight{display:flex;flex-direction:column;gap:${space.lg}px;padding:${space.md}px;border-radius:${radii.xl}px;background:${v.surface.muted};}
.mf-insight-value{color:${v.text.heading};${font(componentText.insightNumber)}}
.mf-insight:active .mf-insight-value,.mf-insight[data-pressed] .mf-insight-value{color:${v.text.brand};}
.mf-toast{display:flex;align-items:center;gap:${space.sm}px;padding:14px ${space.md}px;border-radius:${radii.md}px;background:${v.toast.bg};color:${v.toast.text};box-shadow:${boxShadow('toast')};${font(webText.label1)}}

.mf-sidenav{display:flex;flex-direction:column;justify-content:space-between;gap:${space.xl}px;width:${sizes.sideNav.width}px;min-height:100vh;padding:${space.lg}px;background:${v.surface.raised};}
.mf-sidenav-items{display:flex;flex-direction:column;gap:${space.lg}px;}
.mf-nav-item{display:flex;align-items:center;gap:${space.md}px;height:${sizes.sideNav.item}px;padding:${space.xs}px ${space.md}px;border-radius:${radii.xl}px;color:${v.nav.itemText};text-decoration:none;border:0;background:none;width:100%;cursor:pointer;text-align:left;}
.mf-nav-item .mf-icon{color:${v.nav.itemIcon};}
.mf-nav-item:hover{background:${v.surface.hover};}
.mf-nav-item[aria-current="page"]{background:${v.nav.activeBg};color:${v.nav.activeText};}
.mf-nav-item[aria-current="page"] .mf-icon{color:${v.nav.activeText};}
.mf-nav-label{flex:1;${font(webText.h5)}}
.mf-nav-count{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:40px;padding:${space.xs}px;border-radius:${radii.xl}px;color:${v.nav.countText};${font(webText.body2)}}
.mf-nav-item[aria-current="page"] .mf-nav-count{background:${v.nav.activeCountBg};color:${v.nav.activeCountText};}
.mf-live{display:flex;align-items:center;justify-content:space-between;gap:${space.lg}px;height:38px;padding:0 ${space.md}px;border-radius:${radii.xl}px;background:${v.surface.default};}
.mf-live-toggle{display:flex;align-items:center;gap:${space.xs}px;color:${v.text.tertiary};${font(webText.body3)}}
.mf-theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;border:${sizes.border.hairline}px solid ${v.surface.border};background:${v.surface.raised};color:${v.icon.default};cursor:pointer;}
.mf-theme-toggle:hover{background:${v.surface.hover};}
`;

/** All CSS for the web components: theme variables, text classes and component classes. */
export function themeCss(): string {
  return [
    block(':root,[data-theme="light"]', cssVariables(themes.light), 'color-scheme:light;'),
    block('[data-theme="dark"]', cssVariables(themes.dark), 'color-scheme:dark;'),
    textClasses,
    componentCss.replace(/\n/g, ''),
  ].join('\n');
}
