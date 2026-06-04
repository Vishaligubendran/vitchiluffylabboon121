import { useEffect, useRef, useState } from 'react';
import './PinInput.css';

const MASK_DELAY_MS = 4000;

/**
 * 8 separate PIN boxes. Each digit stays visible for 4 seconds, then masks as *.
 */
export default function PinInput({ value, onChange, length = 8 }) {
  const [masked, setMasked] = useState(() => Array(length).fill(false));
  const timersRef = useRef([]);
  const prevValueRef = useRef('');
  const inputRef = useRef(null);
  useEffect(() => {
    const prev = prevValueRef.current;
    const next = value.slice(0, length);

    for (let i = 0; i < length; i += 1) {
      const char = next[i] || '';
      const prevChar = prev[i] || '';

      if (char === prevChar) continue;

      if (timersRef.current[i]) {
        clearTimeout(timersRef.current[i]);
        timersRef.current[i] = null;
      }

      if (char) {
        setMasked((m) => {
          const copy = [...m];
          copy[i] = false;
          return copy;
        });
        timersRef.current[i] = setTimeout(() => {
          setMasked((m) => {
            const copy = [...m];
            copy[i] = true;
            return copy;
          });
        }, MASK_DELAY_MS);
      } else {
        setMasked((m) => {
          const copy = [...m];
          copy[i] = false;
          return copy;
        });
      }
    }

    prevValueRef.current = next;
  }, [value, length]);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => t && clearTimeout(t));
    },
    []
  );

  const focusInput = () => inputRef.current?.focus();

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(raw);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && value.length > 0) {
      const next = value.slice(0, -1);
      onChange(next);
      e.preventDefault();
    }
  };

  const displayChar = (index) => {
    const digit = value[index];
    if (!digit) return '';
    return masked[index] ? '*' : digit;
  };

  return (
    <div
      className="pin-input-wrap"
      onClick={focusInput}
      role="group"
      aria-label={`${length}-digit PIN`}
    >
      <div className="pin-boxes">
        {Array.from({ length }, (_, i) => (
          <div
            key={i}
            className={[
              'pin-box',
              value.length === i ? 'pin-box-active' : '',
              value[i] ? 'pin-box-filled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          >
            {displayChar(i)}
          </div>
        ))}
        <input
          ref={inputRef}
          className="pin-hidden-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label={`Enter ${length}-digit PIN`}
        />
      </div>
    </div>
  );
}
