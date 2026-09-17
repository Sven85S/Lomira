// Adapted for this app's Vite/ESM build from the Claude Design export:
// - React imported explicitly (see animations-v3.jsx for why).
// - OM_SCENES/OM_PLAYBACK are hardcoded here instead of read from
//   window.OM_SCENES/window.OM_PLAYBACK — those globals were only ever set
//   by the Claude Design preview shell's <script> tag (the .dc.html file),
//   which this app doesn't include. Values copied verbatim from there.
// - lomira-icon.png is a real Vite asset import instead of a bare relative
//   src string, which wouldn't resolve once bundled.
// - Tab bar's second slot updated from the old "Wissen" (book icon) to the
//   app's actual "Übungen" tab (hand icon, path copied from OrbitNav.tsx),
//   so the animation matches the real tab bar it hands off to.
import React from 'react';
import lomiraIcon from './lomira-icon.png';

const OM_SCENES =
  '[{"name":"Begrüßung","dur":1.8,"desc":"Der Atem-Ball füllt den ganzen Screen, Begrüßungstext blendet ein und bleibt kurz stehen"},{"name":"Übergang","dur":0.9,"desc":"Text blendet aus, der Ball schrumpft direkt zu seiner Position auf dem Home-Screen"},{"name":"Home","dur":1.6,"desc":"Statusleiste, Kopfzeile und Menüleiste blenden ein — die App ist geöffnet"}]';
const OM_PLAYBACK = '{"mode":"times","count":1}';

function LomiraPiece({ userName, accent }) {
  const { T, CUES } = useComposition();
  const c1 = CUES['Begrüßung'], c2 = CUES['Übergang'], c3 = CUES['Home'];

  const size = animate({ from: 1000, to: 252, start: c2, end: c2 + 0.85, ease: Easing.easeInOutCubic })(T);
  const cy = animate({ from: 422, to: 310, start: c2, end: c2 + 0.85, ease: Easing.easeInOutCubic })(T);
  const pulse = 1 + Math.sin(T * 1.15) * 0.028;

  const hasName = !!(userName && userName.trim());
  const greetOpacity = hasName
    ? animate({ from: 0, to: 1, start: c1 + 0.1, end: c1 + 0.5 })(T) * (1 - animate({ from: 0, to: 1, start: c2 - 0.35, end: c2 })(T))
    : 0;

  const chromeOpacity = animate({ from: 0, to: 1, start: c3, end: c3 + 0.55 })(T);

  const ballStyle = {
    position: 'absolute',
    width: size, height: size, left: 195 - size / 2, top: cy - size / 2,
    borderRadius: '9999px', overflow: 'hidden',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 30px 60px -28px rgba(31,42,54,0.55)',
    transform: 'scale(' + pulse + ')'
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Instrument Sans',system-ui,sans-serif", background: 'linear-gradient(180deg,#EFE7D8 0%,#EAE3D5 60%,#D8E1EC 82%,#BCD1E9 100%)' }}>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 52, padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#1F2A36', opacity: chromeOpacity }}>
        <span>15:12</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="#1F2A36"><rect x="0" y="8" width="3" height="4" rx="1"></rect><rect x="4.5" y="5.5" width="3" height="6.5" rx="1"></rect><rect x="9" y="3" width="3" height="9" rx="1"></rect><rect x="13.5" y="0.5" width="3" height="11.5" rx="1" opacity="0.35"></rect></svg>
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="0.6" y="0.6" width="20" height="10.8" rx="3.2" stroke="#1F2A36" strokeOpacity="0.4"></rect><rect x="2.4" y="2.4" width="13.4" height="7.2" rx="2" fill="#1F2A36"></rect></svg>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 58, textAlign: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 15, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3B4654', opacity: chromeOpacity }}>Lomira</div>

      <div style={ballStyle}>
        <img src={lomiraIcon} alt="Lomira" style={{ position: 'absolute', left: '-13%', top: '-13%', width: '126%', height: '126%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '9999px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), inset 10px 14px 34px rgba(255,255,255,0.35), inset -12px -16px 38px rgba(31,42,54,0.16)' }}></div>
      </div>

      {hasName && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: greetOpacity }}>
          <div style={{ padding: '0 30px', textAlign: 'center', letterSpacing: '0.01em' }}>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: 44, lineHeight: 1.32, color: '#F8F1E3', textShadow: '0 2px 4px rgba(15,20,26,0.85), 0 8px 20px rgba(15,20,26,0.7), 0 16px 40px rgba(15,20,26,0.55)' }}>Hallo {userName},</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: 44, lineHeight: 1.32, color: '#F8F1E3', textShadow: '0 2px 4px rgba(15,20,26,0.85), 0 8px 20px rgba(15,20,26,0.7), 0 16px 40px rgba(15,20,26,0.55)' }}>schön, dass du</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: 44, lineHeight: 1.32, color: '#F8F1E3', textShadow: '0 2px 4px rgba(15,20,26,0.85), 0 8px 20px rgba(15,20,26,0.7), 0 16px 40px rgba(15,20,26,0.55)' }}>wieder da bist</div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 26, opacity: chromeOpacity }}>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', alignItems: 'center', padding: '10px 8px', borderRadius: 32, background: 'rgba(255,255,255,0.72)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.8), 0 18px 34px -22px rgba(31,42,54,0.5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6577" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 12 6.5 12 9 5 12.5 19 15 12 22 12"></polyline></svg>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#5A6577' }}>HRV</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6577" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10"></path>
              <path d="M11 10V3.5a1.5 1.5 0 0 1 3 0V10"></path>
              <path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8"></path>
              <path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2c-2.5 0-3.5-1-5-3l-2.7-4.3a1.5 1.5 0 0 1 2.6-1.5L8 12"></path>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#5A6577' }}>Übungen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ position: 'relative', width: 56, height: 56, borderRadius: '9999px', overflow: 'hidden', display: 'block', boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 10px 20px -8px rgba(31,42,54,0.55)' }}>
              <img src={lomiraIcon} alt="" style={{ position: 'absolute', left: '-13%', top: '-13%', width: '126%', height: '126%', objectFit: 'cover', display: 'block' }} />
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6577" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4.5 13.2H11l-1 8.8 8.5-11.2H12z"></path></svg>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#5A6577' }}>Ritual</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6577" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17 9.5 10.5l4 4L21 7"></path><path d="M21 12V7h-5"></path></svg>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#5A6577' }}>Fortschritt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LomiraStartAnim = function LomiraStartAnim(props) {
  return React.createElement(CompositionStage, { width: 390, height: 844, scenes: OM_SCENES, playback: OM_PLAYBACK },
    React.createElement(LomiraPiece, props));
};
