// Kompatibilitätsschicht: alle alten Exporte zeigen auf die Himmel-Werte aus
// himmel.ts, damit nichts bricht. Neuer Code importiert direkt aus himmel.ts.
import type { CSSProperties } from 'react';
import { fonts, gearButton, glassCard, palette, primaryButton, skyBackground, white } from './himmel';

export const colors = {
  bg: '#F7EFE0',
  surface: white(0.45),
  card: white(0.62),
  border: white(0.7),
  text: palette.ink,
  muted: palette.tertiary,
  rust: palette.low,
  green: palette.accent,
  gold: palette.accent,
  sage: palette.accent,
  blue: palette.accent,
  blueMist: '#B8CFEA',
};

export const serif = fonts.serif;
export const sans = fonts.sans;

export const bgGradient = skyBackground;

export const iconBtnStyle: CSSProperties = { ...gearButton, width: 32, height: 32, flexShrink: 0 };

export const cardStyle: CSSProperties = glassCard();

export const primaryBtnStyle: CSSProperties = primaryButton();
