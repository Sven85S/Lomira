import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react';
import { cardStyle, colors, iconBtnStyle, serif } from '../styles/tokens';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';
import { cancelDailyReminder, isReminderSupported, requestNotificationPermission, scheduleDailyReminder } from '../notifications/reminders';
import { isAppleHealthSupported, requestAppleHealthAuthorization } from '../health/appleHealth';

interface Props {
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms: () => void;
}

const rowStyle: CSSProperties = { ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' };
const rowLabelStyle: CSSProperties = { fontSize: 14, color: colors.text };
const backBtnStyle: CSSProperties = { ...iconBtnStyle, width: 44, height: 44 };

function ChevronIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function LegalRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...rowStyle, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
      <span style={rowLabelStyle}>{label}</span>
      <ChevronIcon />
    </button>
  );
}

export default function SettingsScreen({ onClose, onOpenPrivacyPolicy, onOpenTerms }: Props) {
  const [firstName, setFirstName] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [appleHealthEnabled, setAppleHealthEnabled] = useState(false);
  const [healthPermissionDenied, setHealthPermissionDenied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [name, enabled, time, healthEnabled] = await Promise.all([
        readJSON(STORAGE_KEYS.firstName, ''),
        readJSON(STORAGE_KEYS.remindersEnabled, false),
        readJSON(STORAGE_KEYS.reminderTime, '08:00'),
        readJSON(STORAGE_KEYS.appleHealthEnabled, false),
      ]);
      setFirstName(name);
      setRemindersEnabled(enabled);
      setReminderTime(time);
      setAppleHealthEnabled(healthEnabled);
      setLoaded(true);
    })();
  }, []);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    void writeJSON(STORAGE_KEYS.firstName, value);
  };

  const handleToggleReminders = async () => {
    setPermissionDenied(false);
    if (remindersEnabled) {
      setRemindersEnabled(false);
      await writeJSON(STORAGE_KEYS.remindersEnabled, false);
      await cancelDailyReminder();
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    setRemindersEnabled(true);
    await writeJSON(STORAGE_KEYS.remindersEnabled, true);
    await scheduleDailyReminder(reminderTime);
  };

  const handleToggleAppleHealth = async () => {
    setHealthPermissionDenied(false);
    if (appleHealthEnabled) {
      setAppleHealthEnabled(false);
      await writeJSON(STORAGE_KEYS.appleHealthEnabled, false);
      return;
    }
    const granted = await requestAppleHealthAuthorization();
    if (!granted) {
      setHealthPermissionDenied(true);
      return;
    }
    setAppleHealthEnabled(true);
    await writeJSON(STORAGE_KEYS.appleHealthEnabled, true);
  };

  const handleTimeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReminderTime(value);
    await writeJSON(STORAGE_KEYS.reminderTime, value);
    if (remindersEnabled) await scheduleDailyReminder(value);
  };

  return (
    <div
      style={{
        // bottom leaves room for OrbitNav instead of covering it (inset: 0
        // used to) — the tab bar stays visible/reachable while this overlay
        // shows. Exact value matches OrbitNav's own root height, OrbitNav.tsx:66.
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(118px + env(safe-area-inset-bottom))',
        background: colors.surface, zIndex: 35, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={backBtnStyle} onClick={onClose} aria-label="Zurück">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14, opacity: loaded ? 1 : 0 }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text }}>Einstellungen</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LegalRow label="Datenschutzerklärung" onClick={onOpenPrivacyPolicy} />
          <LegalRow label="Nutzungsbedingungen" onClick={onOpenTerms} />

          <div style={rowStyle}>
            <span style={rowLabelStyle}>Dein Vorname (optional)</span>
            <input
              type="text"
              value={firstName}
              onChange={handleNameChange}
              placeholder="z.B. Michael"
              style={{ fontSize: 16, color: colors.text, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 10px', width: 140, textAlign: 'right' }}
            />
          </div>

          <div style={rowStyle}>
            <span style={rowLabelStyle}>Erinnerungen</span>
            <button
              onClick={handleToggleReminders}
              disabled={!isReminderSupported}
              aria-label="Erinnerungen umschalten"
              style={{
                width: 44, height: 26, borderRadius: 9999, background: remindersEnabled ? colors.sage : colors.border,
                position: 'relative', padding: 0, cursor: isReminderSupported ? 'pointer' : 'default', flexShrink: 0, border: 'none',
                opacity: isReminderSupported ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  position: 'absolute', top: 3, left: remindersEnabled ? 22 : 3, width: 20, height: 20, borderRadius: 9999,
                  background: colors.card, boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s',
                }}
              />
            </button>
          </div>

          {!isReminderSupported && (
            <p style={{ fontSize: 12, color: colors.muted, margin: 0, padding: '0 4px' }}>
              Erinnerungen sind nur in der iOS- oder Android-App verfügbar.
            </p>
          )}
          {permissionDenied && (
            <p style={{ fontSize: 12, color: colors.rust, margin: 0, padding: '0 4px' }}>
              Ohne Benachrichtigungs-Berechtigung kann Lomira keine Erinnerung senden. Du kannst sie in den
              Systemeinstellungen deines Geräts erlauben und es hier erneut versuchen.
            </p>
          )}

          {remindersEnabled && (
            <div style={rowStyle}>
              <span style={rowLabelStyle}>Uhrzeit</span>
              <input
                type="time"
                value={reminderTime}
                onChange={handleTimeChange}
                style={{ fontSize: 16, color: colors.text, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '5px 8px' }}
              />
            </div>
          )}

          <div style={rowStyle}>
            <span style={rowLabelStyle}>In Health speichern</span>
            <button
              onClick={handleToggleAppleHealth}
              disabled={!isAppleHealthSupported}
              aria-label="Health-Speicherung umschalten"
              style={{
                width: 44, height: 26, borderRadius: 9999, background: appleHealthEnabled ? colors.sage : colors.border,
                position: 'relative', padding: 0, cursor: isAppleHealthSupported ? 'pointer' : 'default', flexShrink: 0, border: 'none',
                opacity: isAppleHealthSupported ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  position: 'absolute', top: 3, left: appleHealthEnabled ? 22 : 3, width: 20, height: 20, borderRadius: 9999,
                  background: colors.card, boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s',
                }}
              />
            </button>
          </div>

          {!isAppleHealthSupported && (
            <p style={{ fontSize: 12, color: colors.muted, margin: 0, padding: '0 4px' }}>
              Die Health-Speicherung ist nur in der iOS-App verfügbar.
            </p>
          )}
          {healthPermissionDenied && (
            <p style={{ fontSize: 12, color: colors.rust, margin: 0, padding: '0 4px' }}>
              Ohne Health-Berechtigung kann Lomira keine Werte schreiben. Du kannst sie in den Systemeinstellungen
              deines Geräts erlauben und es hier erneut versuchen.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
