import { useState, type ButtonHTMLAttributes } from 'react';
import { primaryButton } from '../styles/himmel';

// primaryButton(pressed) braucht einen echten Gedrückt-Zustand (#24486F) —
// :active lässt sich per Inline-Style nicht ausdrücken.
export default function PrimaryButton({ style, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);
  return (
    <button
      {...rest}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      style={{ ...primaryButton(pressed && !disabled), ...style }}
    />
  );
}
