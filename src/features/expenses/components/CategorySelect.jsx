import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryColor, categoryIconClass, categoryLabel, categoryTileColor } from '../../../shared/utils/categoryPresentation';

/*
  A native <select> can't render an icon/color chip per option, but the
  brief explicitly wants "category color block, category icon,
  localized category name" in the picker itself -- not just after
  selection. A real listbox combobox instead, same accessible pattern
  CurrencyPicker already established (trigger button + portal-free
  inline listbox, outside-click + Escape close), just without a search
  field since a trip typically has well under 20 categories.
*/
const CategorySelect = ({ id, categories, value, onChange, disabled }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = categories.find((category) => category.code === value) || null;

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const select = (category) => {
    onChange(category.code);
    setOpen(false);
  };

  return (
    <div className="category-select" ref={containerRef}>
      <button
        id={id}
        type="button"
        className="field-control category-select__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value_) => !value_)}
      >
        {selected ? (
          <span className="category-select__chip">
            <span className="category-select__swatch" style={{ background: categoryTileColor(selected.code, selected.color), color: categoryColor(selected.code, selected.color) }}>
              <i className={`bi ${categoryIconClass(selected.icon_key)}`} aria-hidden="true" />
            </span>
            {categoryLabel(t, selected.code, selected.name)}
          </span>
        ) : <span className="category-select__placeholder">{t('expenseComposer.selectCategory')}</span>}
        <i className="bi bi-chevron-down category-select__chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="category-select__listbox" role="listbox" aria-label={t('expense.category')}>
          {categories.map((category) => (
            <li
              key={category.id}
              role="option"
              aria-selected={category.code === value}
              className={`category-select__option${category.code === value ? ' is-selected' : ''}`}
              onClick={() => select(category)}
            >
              <span className="category-select__swatch" style={{ background: categoryTileColor(category.code, category.color), color: categoryColor(category.code, category.color) }}>
                <i className={`bi ${categoryIconClass(category.icon_key)}`} aria-hidden="true" />
              </span>
              {categoryLabel(t, category.code, category.name)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategorySelect;
