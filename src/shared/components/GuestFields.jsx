import React from 'react';
import { AVATARS } from '../utils/avatars';

const GuestFields = ({ values, onChange, namePlaceholder }) => (
  <>
    <input className="pc-input" value={values.guest_name} onChange={(e) => onChange({ ...values, guest_name: e.target.value })} placeholder={namePlaceholder} required />
    <div className="avatar-picker">
      {AVATARS.map(([key, glyph]) => (
        <button type="button" key={key} className={`avatar-choice ${values.avatar_key === key ? 'selected' : ''}`} onClick={() => onChange({ ...values, avatar_key: key })}>{glyph}</button>
      ))}
    </div>
  </>
);

export default GuestFields;
