import type { CSSProperties } from 'react';

export const colors = {
  bg: '#EDEAE2',
  surface: '#F3EDE1',
  card: '#FBF8F2',
  border: '#E6DECB',
  text: '#2B2620',
  muted: '#8A8272',
  // Kept for now, even though it's leaving the design system — still used by
  // several screens outside this redesign round's scope (HRV, Ritual,
  // Fortschritt, LessonDetail, Settings). Removed once those get their own
  // pass and stop referencing it. Paywall already had its pass — its one
  // remaining reference is a deliberate error-state color, not a leftover.
  rust: '#B0532B',
  green: '#6E7D66',
  gold: '#C8A84B',
  sage: '#8B9A82',
  // New primary accent (buttons, active nav states, chart bars). Round-1
  // estimate (#3B5A78) read too flat/gray on a real device against the
  // mockups' softer, warmer navy — nudged warmer/lighter here; still a
  // visual estimate, not a measured value.
  blue: '#41607E',
  // Bottom stop of the new cream-to-blue background gradient (see bgGradient
  // below). Same round-1-too-gray issue as `blue` — lightened and warmed.
  blueMist: '#DDE7ED',
};

export const serif = "'Instrument Serif', serif";
export const sans = "'Instrument Sans', sans-serif";

// Replaces the flat colors.surface background on the app shell. Stays flat
// cream through the upper half (mockups keep the blue mist confined to
// roughly the bottom third, not a straight top-to-bottom blend) and only
// eases into blueMist over the lower half, for a softer, later transition.
export const bgGradient = `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surface} 52%, ${colors.blueMist} 100%)`;

export const iconBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 9999,
  background: colors.card,
  border: `1px solid ${colors.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  flexShrink: 0,
};

export const cardStyle: CSSProperties = {
  borderRadius: 16,
  padding: '14px 16px',
  background: colors.card,
  border: `1px solid ${colors.border}`,
};

export const primaryBtnStyle: CSSProperties = {
  padding: '15px',
  borderRadius: 9999,
  fontSize: 15,
  fontWeight: 500,
  background: colors.blue,
  color: colors.surface,
  cursor: 'pointer',
  border: 'none',
  width: '100%',
};
