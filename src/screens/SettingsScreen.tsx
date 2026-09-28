import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react';
import { inkA, layout, listCard, listRow, palette, type, white } from '../styles/himmel';
import OverlayScreen from '../components/OverlayScreen';
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

const rowStyle = (last: boolean): CSSProperties => ({ ...listRow(last), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 });
const rowLabelStyle: CSSProperties = { ...type.settingsRow, color: palette.ink };
const sectionLabelStyle: CSSProperties = { ...type.overline, padding: `0 ${layout.headingInset}px`, marginBottom: layout.overlineToCard };
const hintStyle: CSSProperties = { ...type.hintText, color: palette.tertiary, margin: 0, padding: `0 ${layout.headingInset}px` };
const errorStyle: CSSProperties = { ...hintStyle, color: palette.low };
const inputStyle: CSSProperties = {
  ...type.input,
  color: palette.ink,
  background: white(0.45),
  border: 'none',
  boxShadow: `inset 0 0 0 1px ${white(0.7)}`,
  borderRadius: 8,
};

function ChevronIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function LegalRow({ label, onClick, last }: { label: string; onClick: () => void; last: boolean }) {
  return (
    <button onClick={onClick} style={{ ...rowStyle(last), cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none' }}>
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
        width: 44, height: 26, borderRadius: 9999, background: on ? palette.accent : palette.track,
        position: 'relative', padding: 0, cursor: disabled ? 'default' : 'pointer', flexShrink: 0, border: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: on ? 22 : 3, width: 20, height: 20, borderRadius: 9999,
          background: white(1), boxShadow: `0 1px 3px ${inkA(0.2)}`, transition: 'left 0.15s',
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
    <div style={rowStyle(false)}>
      <input
        type="time"
        value={entry.time}
        onChange={(e) => onTimeChange(entry.id, e.target.value)}
        disabled={!isReminderSupported}
        style={{ ...inputStyle, padding: '5px 8px' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Switch on={entry.enabled} onClick={() => onToggle(entry.id)} disabled={!isReminderSupported} ariaLabel="Erinnerung umschalten" />
        <button
          onClick={() => onDelete(entry.id)}
          aria-label="Erinnerung löschen"
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', flexShrink: 0 }}
        >
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
    <OverlayScreen zIndex={35} onBack={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: layout.blockGap, opacity: loaded ? 1 : 0 }}>
        <div style={{ padding: `0 ${layout.headingInset}px` }}>
          <div style={type.wordmark}>Lomira</div>
          <div style={{ ...type.pageTitle, color: palette.ink, marginTop: layout.overlineToTitle }}>Einstellungen</div>
        </div>

        <div style={listCard()}>
          <div style={rowStyle(true)}>
            <span style={rowLabelStyle}>Dein Vorname (optional)</span>
            <input
              type="text"
              value={firstName}
              onChange={handleNameChange}
              placeholder="z.B. Michael"
              style={{ ...inputStyle, padding: '6px 10px', width: 140, textAlign: 'right' }}
            />
          </div>
        </div>

        <div>
          <div style={sectionLabelStyle}>Erinnerungen</div>
          <div style={listCard()}>
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
                ...rowStyle(true), justifyContent: 'center', gap: 8, cursor: isReminderSupported ? 'pointer' : 'default',
                opacity: isReminderSupported ? 1 : 0.5, width: '100%', background: 'none',
              }}
            >
              <PlusIcon />
              <span style={{ ...type.cardTitle, color: palette.accent }}>Erinnerung hinzufügen</span>
            </button>
          </div>
        </div>

        {!isReminderSupported && <p style={hintStyle}>Erinnerungen sind nur in der iOS- oder Android-App verfügbar.</p>}
        {permissionDenied && (
          <p style={errorStyle}>
            Ohne Benachrichtigungs-Berechtigung kann Lomira keine Erinnerung senden. Du kannst sie in den
            Systemeinstellungen deines Geräts erlauben und es hier erneut versuchen.
          </p>
        )}

        <div style={listCard()}>
          <div style={rowStyle(true)}>
            <span style={rowLabelStyle}>In Health speichern</span>
            <Switch on={appleHealthEnabled} onClick={handleToggleAppleHealth} disabled={!isAppleHealthSupported} ariaLabel="Health-Speicherung umschalten" />
          </div>
        </div>

        {!isAppleHealthSupported && <p style={hintStyle}>Die Health-Speicherung ist nur in der iOS-App verfügbar.</p>}
        {healthPermissionDenied && (
          <p style={errorStyle}>
            Ohne Health-Berechtigung kann Lomira keine Werte schreiben. Du kannst sie in den Systemeinstellungen
            deines Geräts erlauben und es hier erneut versuchen.
          </p>
        )}

        <div style={listCard()}>
          <LegalRow label="Datenschutzerklärung" onClick={onOpenPrivacyPolicy} last={false} />
          <LegalRow label="Nutzungsbedingungen" onClick={onOpenTerms} last />
        </div>
      </div>
    </OverlayScreen>
  );
}
