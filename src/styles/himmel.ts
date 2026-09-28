// Lomira Design "Himmel" — übertragen aus Lomira Nutrition (Theme.swift,
// SkyBackground.swift, NavBar.swift). Alle Maße in pt aus SwiftUI; in der
// WKWebView entspricht 1 CSS-px genau 1 iOS-pt, die Zahlen gelten also 1:1.
import type { CSSProperties } from 'react';

// ---------------------------------------------------------------- Farben
export const palette = {
  ink: '#1F2A36', // Titel, Haupttext, aktiver Reiter, Symbole
  secondary: '#4A5768', // Sekundärtext, Einheiten, Überzeilen
  tertiary: '#5A6577', // inaktive Reiter, leise Zusatzangaben
  hint: '#3B4654', // längere Hinweistexte, Wortmarke
  placeholder: '#7A8594', // Platzhalter in Eingabefeldern
  accent: '#2F5C8F', // Primärbutton, Schalter, Ring, Balken, Links
  accentPressed: '#24486F', // Primärbutton gedrückt
  onAccent: '#F7EFE0', // Text/Symbole auf Akzentblau (warmes Weiß)
  reached: '#2F5C8F', // Status "erreicht"
  close: '#C98A3E', // Status "knapp", Hinweis "geschätzt"
  low: '#B5654A', // Status "niedrig" (Terrakotta) — Rot gibt es bewusst nicht
  track: 'rgba(47,92,143,0.14)', // Hintergrundspur von Balken und Ring
  divider: 'rgba(31,42,54,0.08)', // Trennlinien in Karten (1px)
  iconBubble: 'rgba(47,92,143,0.10)', // runder Hintergrund hinter kleinen Symbolen
} as const;

export const white = (opacity: number) => `rgba(255,255,255,${opacity})`;
export const inkA = (opacity: number) => `rgba(31,42,54,${opacity})`;
export const accentA = (opacity: number) => `rgba(47,92,143,${opacity})`;

// --------------------------------------------------------------- Schriften
// Instrument Serif für Titel und große Zahlen, Instrument Sans für alles
// Bedienbare. Registriert in fonts.css (@font-face auf die fünf .ttf).
export const fonts = {
  serif: "'Instrument Serif', Georgia, serif",
  sans: "'Instrument Sans', -apple-system, system-ui, sans-serif",
} as const;

export const weight = { regular: 400, medium: 500, semibold: 600 } as const;

// Typo-Stufen laut Design-Sprache (Größen fix, wachsen nicht mit Dynamic Type).
export const type = {
  // Serif
  scoreNumber: { fontFamily: fonts.serif, fontSize: 36, fontWeight: 400 },
  greeting: { fontFamily: fonts.serif, fontSize: 34, fontWeight: 400 },
  pageTitle: { fontFamily: fonts.serif, fontSize: 32, fontWeight: 400 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 28, fontWeight: 400 },
  subpageTitle: { fontFamily: fonts.serif, fontSize: 26, fontWeight: 400 },
  freeText: { fontFamily: fonts.serif, fontSize: 23, fontWeight: 400 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, fontWeight: 400 },
  tileValue: { fontFamily: fonts.serif, fontSize: 19, fontWeight: 400 },
  listPercent: { fontFamily: fonts.serif, fontSize: 15, fontWeight: 400 },
  quote: { fontFamily: fonts.serif, fontSize: 15, fontStyle: 'italic', fontWeight: 400 },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 13,
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.3em',
    color: palette.hint,
  },
  // Sans
  input: { fontFamily: fonts.sans, fontSize: 16, fontWeight: 400 },
  primaryButton: { fontFamily: fonts.sans, fontSize: 15, fontWeight: 500, letterSpacing: '0.3px' },
  settingsRow: { fontFamily: fonts.sans, fontSize: 15, fontWeight: 400 },
  cardTitle: { fontFamily: fonts.sans, fontSize: 14.5, fontWeight: 600 },
  backButton: { fontFamily: fonts.sans, fontSize: 14, fontWeight: 500 },
  body: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 400 },
  pill: { fontFamily: fonts.sans, fontSize: 13, fontWeight: 500 },
  hintText: { fontFamily: fonts.sans, fontSize: 11.5, fontWeight: 400 },
  small: { fontFamily: fonts.sans, fontSize: 11, fontWeight: 400 },
  overline: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '2.1px',
    color: palette.secondary,
  },
  navLabel: { fontFamily: fonts.sans, fontSize: 10, fontWeight: 500 },
} satisfies Record<string, CSSProperties>;

// ---------------------------------------------------- Himmel-Hintergrund
// Drei Ebenen. SwiftUI-ZStack zeichnet die letzte Ebene oben, CSS die erste
// — daher umgekehrte Reihenfolge: blauer Schein, warmer Schein, Verlauf.
// Radien "75 % / 85 % der Displaybreite" → vw (CSS erlaubt für einen Kreis
// keinen Prozentradius, vw ist bei Vollbild dasselbe).
export const skyBackground = [
  'radial-gradient(circle 85vw at 72% 96%, rgba(120,168,222,0.42) 0%, rgba(120,168,222,0) 100%)',
  'radial-gradient(circle 75vw at 30% 10%, rgba(240,205,150,0.40) 0%, rgba(240,205,150,0) 100%)',
  'linear-gradient(to bottom, #F7EFE0 0%, #F3ECDF 40%, #EEE7DA 62%, #DCE4EC 80%, #B8CFEA 100%)',
].join(', ');

// --------------------------------------------------------------- Layout
export const layout = {
  screenX: 18, // Rand links/rechts
  screenTop: 8,
  screenBottom: 16, // vor der Menüleiste
  blockGap: 14, // zwischen Blöcken
  headingInset: 6, // Überschriften außerhalb von Karten: 18 + 6 = 24 vom Rand
  overlineToCard: 8,
  overlineToTitle: 2,
  navHeight: 70,
  navSide: 14,
  navAboveSafeArea: 4,
} as const;

// Platz, den der Scroll-Inhalt unten freihalten muss, damit er oberhalb
// der schwebenden Leiste endet (Inhalt scrollt dahinter durch).
export const navClearance = `calc(${layout.navHeight + layout.navAboveSafeArea + layout.screenBottom}px + env(safe-area-inset-bottom))`;

// ---------------------------------------------------------------- Karten
// SwiftUI-Schatten-"radius" ≈ halbe CSS-Blur — CSS-Blur daher doppelt.
const swiftShadow = (color: string, radius: number, y: number) => `0 ${y}px ${radius * 2}px ${color}`;

/** Karte, hervorgehoben: Radius 28, Weiß 62 %, Rand Weiß 70 %, Schatten Tinte 14 % */
export const glassCard = (radius = 28): CSSProperties => ({
  background: white(0.62),
  borderRadius: radius,
  boxShadow: `inset 0 0 0 1px ${white(0.7)}, ${swiftShadow(inkA(0.14), 14, 12)}`,
  padding: '4px 16px',
});

/** Listen-Karte, flach: Radius 24, Weiß 58 %, Rand Weiß 70 %, kein Schatten */
export const listCard = (radius = 24): CSSProperties => ({
  background: white(0.58),
  borderRadius: radius,
  boxShadow: `inset 0 0 0 1px ${white(0.7)}`,
  padding: '4px 16px',
});

/** Listenzeile: 12 oben/unten, Trennlinie 1px Tinte 8 % (bei der letzten Zeile weglassen) */
export const listRow = (last = false): CSSProperties => ({
  padding: '12px 0',
  borderBottom: last ? 'none' : `1px solid ${palette.divider}`,
  ...type.body,
  color: palette.ink,
});

// --------------------------------------------------------------- Bausteine
export const primaryButton = (pressed = false): CSSProperties => ({
  width: '100%',
  padding: '15px 0',
  borderRadius: 9999,
  border: 'none',
  background: pressed ? palette.accentPressed : palette.accent,
  color: palette.onAccent,
  boxShadow: swiftShadow(accentA(0.45), 12, 10),
  ...type.primaryButton,
});

/** Zahnrad-Knopf oben rechts: Kreis 42, Weiß 62 %, Rand Weiß 80 %, Symbol 17 */
export const gearButton: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 9999,
  background: white(0.62),
  boxShadow: `inset 0 0 0 1px ${white(0.8)}`,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: palette.ink,
  padding: 0,
};

/** Zurück-Knopf: Chevron 15 Medium + Text Sans 14 Medium, 2px Abstand, Tinte */
export const backButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  background: 'none',
  border: 'none',
  padding: 0,
  color: palette.ink,
  ...type.backButton,
};

/** Pill-Umschalter: Spur Weiß 45 % mit 3px Innenrand */
export const pillTrack: CSSProperties = {
  display: 'inline-flex',
  padding: 3,
  borderRadius: 9999,
  background: white(0.45),
  boxShadow: `inset 0 0 0 1px ${white(0.7)}`,
};

/** Pill-Segment: 8×11 Innenabstand, aktiv Akzentblau mit #F7EFE0, Wechsel 0,2 s */
export const pillSegment = (active: boolean): CSSProperties => ({
  padding: '8px 11px',
  borderRadius: 9999,
  border: 'none',
  background: active ? palette.accent : 'transparent',
  color: active ? palette.onAccent : palette.ink,
  transition: 'background 0.2s, color 0.2s',
  ...type.pill,
});

/** Fortschrittsbalken: 5 hoch, Kapsel, Spur Akzent 14 %, Füllung animiert 0,3 s */
export const progressTrack: CSSProperties = {
  height: 5,
  borderRadius: 9999,
  background: palette.track,
  overflow: 'hidden',
};
export const progressFill = (fraction: number, color: string = palette.reached): CSSProperties => ({
  height: '100%',
  width: `${Math.max(0, Math.min(1, fraction)) * 100}%`,
  borderRadius: 9999,
  background: color,
  transition: 'width 0.3s',
});

/** Symbol-Blase: Kreis 34, Akzent 10 %, Symbol 42 % der Größe in Akzentblau */
export const iconBubble = (size = 34): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: 9999,
  background: palette.iconBubble,
  color: palette.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});
export const iconBubbleGlyph = (size = 34) => Math.round(size * 0.42);

/** Statuspunkt: 7px Kreis */
export const statusDot = (color: string): CSSProperties => ({
  width: 7,
  height: 7,
  borderRadius: 9999,
  background: color,
  flexShrink: 0,
});

/** Score-Ring: 104, Strich 7, runde Enden, Start 12 Uhr — Werte für ein SVG */
export const scoreRing = { size: 104, stroke: 7 } as const;
