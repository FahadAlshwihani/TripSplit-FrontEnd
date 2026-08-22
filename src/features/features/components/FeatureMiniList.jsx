import React from 'react';
import { useTranslation } from 'react-i18next';

const FeatureMiniList = ({ items }) => {
  const { t } = useTranslation();
  return (
    <ul className="feature-mini-list">
      {items.map(({ key, Icon }) => (
        <li className="feature-mini-list__row" key={key}>
          <Icon className="feature-mini-list__icon" />
          <div className="feature-mini-list__text">
            <span className="feature-mini-list__title text-label">{t(`features.section1.items.${key}.title`)}</span>
            <span className="feature-mini-list__description text-copy-sm">{t(`features.section1.items.${key}.description`)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default FeatureMiniList;
