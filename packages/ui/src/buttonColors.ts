import type { ThemeColors } from './theme.ts';
import type { ButtonVariant, InteractionState } from './types.ts';

export interface ButtonColors {
  background: string;
  border: string;
  text: string;
}

const transparent = 'transparent';

/**
 * Colours for every button variant and state, from the Buttons frame
 * (43:16130). Shared by the native and web buttons.
 */
export function buttonColors(c: ThemeColors, variant: ButtonVariant, state: InteractionState): ButtonColors {
  const b = c.button;
  switch (variant) {
    case 'primary':
      return { background: b.primaryBg[state], border: transparent, text: b.primaryText };
    case 'destructive-primary':
      return { background: b.destructiveBg[state], border: transparent, text: b.primaryText };
    case 'secondary':
      return { background: transparent, border: b.secondary[state], text: b.secondary[state] };
    case 'destructive-secondary':
      return { background: transparent, border: b.destructive[state], text: b.destructive[state] };
    case 'inline':
    case 'text':
      return { background: transparent, border: transparent, text: b.inline[state] };
    case 'destructive-inline':
      return { background: transparent, border: transparent, text: b.destructive[state] };
  }
}

export const buttonVariants: ButtonVariant[] = [
  'primary',
  'secondary',
  'inline',
  'text',
  'destructive-primary',
  'destructive-secondary',
  'destructive-inline',
];

export function isOutlined(v: ButtonVariant): boolean {
  return v === 'secondary' || v === 'destructive-secondary';
}
