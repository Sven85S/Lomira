import { useState, type CSSProperties } from 'react';
import { fonts, gearButton, glassCard, layout, listCard, listRow, palette, pillSegment, pillTrack, statusDot, type, white } from '../styles/himmel';
import { useData } from '../context/DataContext';
import { STATE_COLORS } from '../store/ritualSelectors';
import { formatEntryDate } from '../lib/date';
import PrimaryButton from '../components/PrimaryButton';
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

// Kleine Knöpfe (Monat vor/zurück, Bearbeiten, Löschen) — gearButton in 32px
const smallIconBtn: CSSProperties = { ...gearButton, width: 32, height: 32, flexShrink: 0 };

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
    <div style={{ padding: `0 ${layout.screenX}px`, display: 'flex', flexDirection: 'column', gap: layout.blockGap }}>
      {showInfo && (
        <div style={listCard()}>
          <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ ...type.body, color: palette.ink, lineHeight: 1.5, margin: 0 }}>
              Eine Emotion zu benennen, beruhigt nachweislich das Nervensystem — Studien zeigen, dass allein das In-Worte-Fassen eines
              Gefühlszustands die Stressreaktion im Gehirn messbar dämpft.
            </p>
            <p style={{ ...type.body, color: palette.ink, lineHeight: 1.5, margin: 0 }}>
              Deshalb geht es beim täglichen Ritual nicht darum, jeden Tag etwas Besonderes zu erleben, sondern darum, regelmäßig kurz
              hinzuschauen — kleine Verschiebungen fallen so früher auf, bevor sie sich aufstauen.
            </p>
            <p style={{ ...type.hintText, color: palette.hint, lineHeight: 1.5, margin: 0 }}>
              Das ersetzt keine Therapie oder Diagnostik. Bei anhaltender Belastung gehört professionelle Unterstützung dazu.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ ...type.body, color: palette.ink, textAlign: 'center', margin: 0 }}>Wie fühlst du dich gerade?</p>
        <div style={pillTrack}>
          {STATE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              disabled={isDone}
              onClick={() => setSelectedState(key)}
              style={{ ...pillSegment(state === key), whiteSpace: 'nowrap', cursor: isDone ? 'default' : 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        rows={3}
        placeholder={QUESTIONS[dayIndex]}
        value={isDone ? (todayEntry?.note ?? '') : noteDraft}
        disabled={isDone}
        onChange={(e) => setNoteDraft(e.target.value)}
        style={{ ...listCard(), ...type.freeText, width: '100%', padding: '12px 16px', border: 'none', color: palette.ink }}
      />

      <PrimaryButton
        disabled={!state || isDone}
        onClick={() => state && completeRitual(state, noteDraft.trim())}
        style={state ? { cursor: isDone ? 'default' : 'pointer' } : { background: white(0.7), color: palette.tertiary, boxShadow: 'none', cursor: 'default' }}
      >
        {isDone ? 'Heute erledigt ✓' : 'Ritual abschließen'}
      </PrimaryButton>

      <div style={glassCard()}>
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ ...type.body, color: palette.ink }}>Serie</span>
          <span>
            <span style={{ fontFamily: fonts.serif, fontSize: 22, color: palette.accent }}>{streak}</span>
            <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary, marginLeft: 4 }}>
              {streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}
            </span>
          </span>
        </div>
      </div>

      <div style={glassCard()}>
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button style={smallIconBtn} onClick={() => setCalMonthOffset((v) => v - 1)} aria-label="Vorheriger Monat">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ ...type.cardTitle, color: palette.ink }}>{cal.label}</span>
            <button style={smallIconBtn} onClick={() => setCalMonthOffset((v) => v + 1)} aria-label="Nächster Monat">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((wd) => (
              <div key={wd} style={{ ...type.small, textAlign: 'center', color: palette.tertiary }}>
                {wd}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {cal.cells.map((cell, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '2px 0' }}>
                {cell.hasDay && (
                  <>
                    <div style={{ ...type.small, color: palette.ink }}>{cell.dayNum}</div>
                    <div style={{ ...statusDot(cell.state ? STATE_COLORS[cell.state] : 'transparent'), margin: '3px auto 0' }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {ritualEntries.length > 0 && (
        <div style={listCard()}>
          {ritualEntries.map((entry, i) => {
            const isExpanded = expandedId === entry.id;
            const isEditing = editingId === entry.id;
            return (
              <div
                key={entry.id}
                style={{ ...listRow(i === ritualEntries.length - 1), display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
                onClick={() => {
                  if (isEditing) return;
                  setExpandedId((cur) => (cur === entry.id ? null : entry.id));
                  setEditingId(null);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={statusDot(STATE_COLORS[entry.state])} />
                  <span style={{ ...type.small, color: palette.secondary, flexShrink: 0 }}>{formatEntryDate(entry.date)}</span>
                  {!isExpanded && (
                    <p style={{ ...type.body, flex: 1, minWidth: 0, color: palette.tertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                      {entry.note}
                    </p>
                  )}
                </div>

                {isExpanded && !isEditing && (
                  <>
                    <p style={{ ...type.body, color: palette.ink, lineHeight: 1.5, margin: 0 }}>{entry.note}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={smallIconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(entry.id);
                          setEditDraft(entry.note);
                        }}
                        aria-label="Bearbeiten"
                      >
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      <button
                        style={smallIconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRitualEntry(entry.id);
                          setExpandedId((cur) => (cur === entry.id ? null : cur));
                        }}
                        aria-label="Löschen"
                      >
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={palette.low} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
                      style={{ ...type.body, width: '100%', padding: 10, borderRadius: 12, background: white(0.45), border: 'none', boxShadow: `inset 0 0 0 1px ${white(0.7)}`, color: palette.ink }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={pillSegment(true)}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRitualEntry(entry.id, { note: editDraft });
                          setEditingId(null);
                        }}
                      >
                        Speichern
                      </button>
                      <button
                        style={{ ...pillSegment(false), boxShadow: `inset 0 0 0 1px ${white(0.7)}`, color: palette.tertiary }}
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
      )}
    </div>
  );
}
