import React from 'react';
import './SegmentedControl.css';

/*
  Generic, reusable All/Shared/Personal-style toggle -- first built for
  the Expenses Ledger, deliberately not named/placed as an Expenses-only
  component since Overview's own (currently disabled) filter control is
  expected to want the same widget later. A native radiogroup, not a
  button-group: exactly one option is ever selected, matching how a
  browser-native radio input behaves for assistive tech and keyboard
  users (arrow-key semantics come for free once wired to real radio
  inputs at the DOM level -- this uses the ARIA role directly on
  buttons instead, the same pattern already used elsewhere in this
  app -- e.g. MobileBottomNav's nav items -- for a styled equivalent).
*/
const SegmentedControl = ({ options, value, onChange, ariaLabel }) => (
  <div className="seg-control" role="radiogroup" aria-label={ariaLabel}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={value === option.value}
        className={`seg-control__item${value === option.value ? ' is-active' : ''}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
