import { useState } from 'react';
import { colors, iconBtnStyle, serif } from '../styles/tokens';
import { useData } from '../context/DataContext';
import { STATE_COLORS } from '../store/ritualSelectors';
import { formatEntryDate } from '../lib/date';
import type { RitualState } from '../types';

const QUESTIONS = [
  'Was hat dich heute besonders bewegt?', 'Wodurch hast du dich heute sicher gefühlt?', 'Was hat dir heute gutgetan?',
  'Wo in deinem Körper hast du heute Anspannung gespürt?', 'Was hat dir geholfen, wieder zur Ruhe zu kommen?',
  'Gab es einen Moment heute, der sich stimmig angefühlt hat?', 'Was brauchst du gerade am meisten?',
  'Woran hast du heute gemerkt, dass du dich reguliert hast?', 'Was möchtest du morgen mit dir mitnehmen?', 'Was war heute leichter, als du dachtest?',
];

const STATE_LABELS: { key: RitualState; label: string }[] = [
  { key: 'angespannt', label: 'Angespannt' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'reguliert', label: 'Reguliert' },
  { key: 'entspannt', label: 'Entspannt' },
];

interface Props {
  showInfo: boolean;
}

export default function RitualScreen({ showInfo }: Props) {
  const { ritualEntries, todayEntry, streak, completeRitual, updateRitualEntry, deleteRitualEntry, calendarForOffset } = useData();

  const [selectedState, setSelectedState] = useState<RitualState | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const isDone = !!todayEntry;
  const state = todayEntry?.state ?? selectedState;
  const dayIndex = Math.floor(Date.now() / 86400000) % QUESTIONS.length;
  const cal = calendarForOffset(calMonthOffset);

  return (
    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {showInfo && (
        <div style={{ width: '100%', padding: '14px 16px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.border}`, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, margin: 0 }}>
            Eine Emotion zu benennen, beruhigt nachweislich das Nervensystem — Studien zeigen, dass allein das In-Worte-Fassen eines
            Gefühlszustands die Stressreaktion im Gehirn messbar dämpft.
          </p>
          <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, margin: 0 }}>
            Deshalb geht es beim täglichen Ritual nicht darum, jeden Tag etwas Besonderes zu erleben, sondern darum, regelmäßig kurz
            hinzuschauen — kleine Verschiebungen fallen so früher auf, bevor sie sich aufstauen.
          </p>
          <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, margin: 0 }}>
            Das ersetzt keine Therapie oder Diagnostik. Bei anhaltender Belastung gehört professionelle Unterstützung dazu.
          </p>
        </div>
      )}

      <p style={{ fontSize: 14, color: colors.text, textAlign: 'center', marginBottom: 12 }}>Wie fühlst du dich gerade?</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', justifyContent: 'center' }}>
        {STATE_LABELS.map(({ key, label }) => {
          const active = state === key;
          return (
            <button
              key={key}
              disabled={isDone}
              onClick={() => setSelectedState(key)}
              style={{
                padding: '4px 7px',
                borderRadius: 9999,
                fontSize: 12,
                cursor: isDone ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                border: active ? `1px solid ${colors.text}` : `1px solid ${colors.border}`,
                background: active ? colors.text : 'transparent',
                color: active ? colors.surface : colors.muted,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <textarea
        rows={3}
        placeholder={QUESTIONS[dayIndex]}
        value={isDone ? (todayEntry?.note ?? '') : noteDraft}
        disabled={isDone}
        onChange={(e) => setNoteDraft(e.target.value)}
        style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 16, fontSize: 14, background: colors.card, border: `1px solid ${colors.border}`, color: colors.text }}
      />

      <button
        disabled={!state || isDone}
        onClick={() => state && completeRitual(state, noteDraft.trim())}
        style={{
          marginTop: 16,
          padding: '10px 24px',
          borderRadius: 9999,
          fontSize: 14,
          background: state ? colors.text : colors.border,
          color: state ? colors.surface : colors.muted,
          cursor: state && !isDone ? 'pointer' : 'default',
        }}
      >
        {isDone ? 'Heute erledigt ✓' : 'Ritual abschließen'}
      </button>

      <div style={{ width: '100%', marginTop: 24, padding: '12px 16px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: colors.text }}>Serie</span>
        <span style={{ fontSize: 14, color: colors.green, fontWeight: 500 }}>{streak === 1 ? '1 Tag in Folge' : `${streak} Tage in Folge`}</span>
      </div>

      <div style={{ width: '100%', marginTop: 16, padding: '14px 16px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button style={iconBtnStyle} onClick={() => setCalMonthOffset((v) => v - 1)} aria-label="Vorheriger Monat">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontFamily: serif, fontSize: 14, color: colors.text }}>{cal.label}</span>
          <button style={iconBtnStyle} onClick={() => setCalMonthOffset((v) => v + 1)} aria-label="Nächster Monat">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((wd) => (
            <div key={wd} style={{ textAlign: 'center', fontSize: 9, color: colors.muted }}>
              {wd}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cal.cells.map((cell, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '2px 0' }}>
              {cell.hasDay && (
                <>
                  <div style={{ fontSize: 10, color: colors.text }}>{cell.dayNum}</div>
                  <div style={{ width: 5, height: 5, borderRadius: 9999, margin: '3px auto 0', background: cell.state ? STATE_COLORS[cell.state] : 'transparent' }} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ritualEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isEditing = editingId === entry.id;
          return (
            <div
              key={entry.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 14, background: colors.card, border: `1px solid ${colors.border}`, cursor: 'pointer' }}
              onClick={() => {
                if (isEditing) return;
                setExpandedId((cur) => (cur === entry.id ? null : entry.id));
                setEditingId(null);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: STATE_COLORS[entry.state], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: colors.muted, flexShrink: 0 }}>{formatEntryDate(entry.date)}</span>
                {!isExpanded && (
                  <p style={{ flex: 1, minWidth: 0, fontSize: 13, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {entry.note}
                  </p>
                )}
              </div>

              {isExpanded && !isEditing && (
                <>
                  <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, margin: 0 }}>{entry.note}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={iconBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(entry.id);
                        setEditDraft(entry.note);
                      }}
                      aria-label="Bearbeiten"
                    >
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      style={iconBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRitualEntry(entry.id);
                        setExpandedId((cur) => (cur === entry.id ? null : cur));
                      }}
                      aria-label="Löschen"
                    >
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.rust} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1={10} y1={11} x2={10} y2={17} />
                        <line x1={14} y1={11} x2={14} y2={17} />
                      </svg>
                    </button>
                  </div>
                </>
              )}

              {isEditing && (
                <>
                  <textarea
                    rows={3}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%', padding: 10, borderRadius: 12, fontSize: 13, background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ padding: '7px 16px', borderRadius: 9999, fontSize: 12, background: colors.text, color: colors.surface, cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateRitualEntry(entry.id, { note: editDraft });
                        setEditingId(null);
                      }}
                    >
                      Speichern
                    </button>
                    <button
                      style={{ padding: '7px 16px', borderRadius: 9999, fontSize: 12, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.muted, cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
