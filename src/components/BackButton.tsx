import { backButton } from '../styles/himmel';

interface Props {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

// chevron.left 15 Medium + Text Sans 14 Medium, 2 Abstand. minHeight 44 hält
// die Tippfläche groß, ohne die Optik zu ändern.
export default function BackButton({ label, onClick, ariaLabel }: Props) {
  return (
    <button style={{ ...backButton, minHeight: 44 }} onClick={onClick} aria-label={ariaLabel ?? label}>
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
