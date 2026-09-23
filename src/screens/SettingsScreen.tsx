import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react';
import { bgGradient, cardStyle, colors, iconBtnStyle, serif } from '../styles/tokens';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';
import {
  cancelReminder,
  getNextReminderId,
  isReminderSupported,
  requestNotificationPermission,
  scheduleReminder,
  type ReminderEntry,
} from '../notifications/reminders';
import { isAppleHealthSupported, requestAppleHealthAuthorization } from '../health/appleHealth';

interface Props {
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms: () => void;
}

const DEFAULT_REMINDER_TIME = '08:00';

const rowStyle: CSSProperties = { ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' };
const rowLabelStyle: CSSProperties = { fontSize: 14, color: colors.text };
const backBtnStyle: CSSProperties = { ...iconBtnStyle, width: 44, height: 44 };
const sectionLabelStyle: CSSProperties = { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 0', padding: '0 4px' };
const timeInputStyle: CSSProperties = { fontSize: 16, color: colors.text, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '5px 8px' };

function ChevronIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

// Shared by the Apple Health toggle and each reminder row's own toggle.
function Switch({ on, onClick, disabled, ariaLabel }: { on: boolean; onClick: () => void; disabled?: boolean; ariaLabel: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        width: 44, height: 26, borderRadius: 9999, background: on ? colors.sage : colors.border,
        position: 'relative', padding: 0, cursor: disabled ? 'default' : 'pointer', flexShrink: 0, border: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: on ? 22 : 3, width: 20, height: 20, borderRadius: 9999,
          background: colors.card, boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

function ReminderRow({
  entry,
  onToggle,
  onTimeChange,
  onDelete,
}: {
  entry: ReminderEntry;
  onToggle: (id: number) => void;
  onTimeChange: (id: number, time: string) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div style={rowStyle}>
      <input
        type="time"
        value={entry.time}
        onChange={(e) => onTimeChange(entry.id, e.target.value)}
        disabled={!isReminderSupported}
        style={timeInputStyle}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Switch on={entry.enabled} onClick={() => onToggle(entry.id)} disabled={!isReminderSupported} ariaLabel="Erinnerung umschalten" />
        <button onClick={() => onDelete(entry.id)} aria-label="Erinnerung löschen" style={{ ...iconBtnStyle, width: 28, height: 28, background: 'transparent', border: 'none' }}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

export default function SettingsScreen({ onClose, onOpenPrivacyPolicy, onOpenTerms }: Props) {
  const [firstName, setFirstName] = useState('');
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [appleHealthEnabled, setAppleHealthEnabled] = useState(false);
  const [healthPermissionDenied, setHealthPermissionDenied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [name, healthEnabled, storedReminders] = await Promise.all([
        readJSON(STORAGE_KEYS.firstName, ''),
        readJSON(STORAGE_KEYS.appleHealthEnabled, false),
        readJSON<ReminderEntry[]>(STORAGE_KEYS.reminderTimes, []),
      ]);
      setFirstName(name);
      setAppleHealthEnabled(healthEnabled);

      // One-time migration: a pre-existing single reminder (remindersEnabled
      // + reminderTime, from before multiple reminders existed) becomes a
      // one-entry list under its already-scheduled native id (1) — adopted
      // into the new format, not rescheduled, so an existing user's
      // notification keeps firing exactly as before across the update.
      let currentReminders = storedReminders;
      if (currentReminders.length === 0) {
        const [legacyEnabled, legacyTime] = await Promise.all([
          readJSON(STORAGE_KEYS.remindersEnabled, false),
          readJSON(STORAGE_KEYS.reminderTime, ''),
        ]);
        if (legacyEnabled && legacyTime) {
          currentReminders = [{ id: 1, time: legacyTime, enabled: true }];
          await writeJSON(STORAGE_KEYS.reminderTimes, currentReminders);
        }
      }
      setReminders(currentReminders);
      setLoaded(true);
    })();
  }, []);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    void writeJSON(STORAGE_KEYS.firstName, value);
  };

  const persistReminders = async (next: ReminderEntry[]) => {
    setReminders(next);
    await writeJSON(STORAGE_KEYS.reminderTimes, next);
  };

  const handleAddReminder = async () => {
    setPermissionDenied(false);
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    const id = await getNextReminderId();
    await scheduleReminder(id, DEFAULT_REMINDER_TIME);
    await persistReminders([...reminders, { id, time: DEFAULT_REMINDER_TIME, enabled: true }]);
  };

  const handleToggleReminder = async (id: number) => {
    setPermissionDenied(false);
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    if (target.enabled) {
      await cancelReminder(id);
      await persistReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: false } : r)));
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    await scheduleReminder(id, target.time);
    await persistReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: true } : r)));
  };

  const handleReminderTimeChange = async (id: number, time: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    if (target.enabled) await scheduleReminder(id, time);
    await persistReminders(reminders.map((r) => (r.id === id ? { ...r, time } : r)));
  };

  const handleDeleteReminder = async (id: number) => {
    await cancelReminder(id);
    await persistReminders(reminders.filter((r) => r.id !== id));
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

  return (
    <div
      style={{
        // bottom leaves room for OrbitNav instead of covering it (inset: 0
        // used to) — the tab bar stays visible/reachable while this overlay
        // shows. Exact value matches OrbitNav's own root height, OrbitNav.tsx:66.
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(118px + env(safe-area-inset-bottom))',
        background: bgGradient, zIndex: 35, display: 'flex', flexDirection: 'column',
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

          <div style={sectionLabelStyle}>Erinnerungen</div>

          {reminders.map((entry) => (
            <ReminderRow
              key={entry.id}
              entry={entry}
              onToggle={handleToggleReminder}
              onTimeChange={handleReminderTimeChange}
              onDelete={handleDeleteReminder}
            />
          ))}

          <button
            onClick={handleAddReminder}
            disabled={!isReminderSupported}
            style={{
              ...rowStyle, justifyContent: 'center', gap: 8, cursor: isReminderSupported ? 'pointer' : 'default',
              opacity: isReminderSupported ? 1 : 0.5, width: '100%',
            }}
          >
            <PlusIcon />
            <span style={{ fontSize: 14, color: colors.blue, fontWeight: 500 }}>Erinnerung hinzufügen</span>
          </button>

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

          <div style={rowStyle}>
            <span style={rowLabelStyle}>In Health speichern</span>
            <Switch on={appleHealthEnabled} onClick={handleToggleAppleHealth} disabled={!isAppleHealthSupported} ariaLabel="Health-Speicherung umschalten" />
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

          <LegalRow label="Datenschutzerklärung" onClick={onOpenPrivacyPolicy} />
          <LegalRow label="Nutzungsbedingungen" onClick={onOpenTerms} />
        </div>
      </div>
    </div>
  );
}
