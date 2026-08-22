import React, { useRef } from 'react';

const CELL_COUNT = 6;

/*
  Six flat cells, no dash separator — Stitch's own two mockups disagree on
  this (desktop shows a "XXX-XXX" dash, mobile doesn't), and only the
  mobile composition is backed by an actual screenshot, so that's the one
  followed here.

  dir="ltr" is deliberate: digit entry stays left-to-right even inside an
  Arabic RTL page, so cell order and reading order never fight each other.
*/
const OtpInput = ({ value, onChange, disabled, label }) => {
  const refs = useRef([]);

  const handleChange = (index, event) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(CELL_COUNT, ' ').split('');
    chars[index] = digit || ' ';
    onChange(chars.join('').trimEnd());
    if (digit && index < CELL_COUNT - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CELL_COUNT);
    if (!digits) return;
    onChange(digits);
    const lastIndex = Math.min(digits.length, CELL_COUNT) - 1;
    refs.current[lastIndex]?.focus();
  };

  return (
    <div className="otp-cells" dir="ltr" role="group" aria-label={label}>
      {Array.from({ length: CELL_COUNT }).map((_, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          className="otp-cells__cell"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={index === 0}
          aria-label={`${label} ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
