import type { CSSProperties } from 'react';

export const colors = {
  bg: '#EDEAE2',
  surface: '#F3EDE1',
  card: '#FBF8F2',
  border: '#E6DECB',
  text: '#2B2620',
  muted: '#8A8272',
  rust: '#B0532B',
  green: '#6E7D66',
  gold: '#C8A84B',
  sage: '#8B9A82',
};

export const serif = "'Fraunces', serif";
export const sans = "'Inter', sans-serif";

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
  background: colors.text,
  color: colors.surface,
  cursor: 'pointer',
  border: 'none',
  width: '100%',
};
