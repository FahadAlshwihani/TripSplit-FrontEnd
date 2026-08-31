import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';
import { formatDateTime } from '../../../shared/utils/format';
import { groupEventsByDate, formatDateGroupLabel } from '../utils/dateGroup';
import { eventAmount, eventIcon, eventTone } from '../utils/eventRegistry';
import { activityCopyKeys, activityCopyVars } from '../utils/copyKey';

/*
  One ledger row: icon, actor + predicate sentence, time/meta line, and
  an optional trailing amount -- the compact "ledger card" shape from
  the approved Stitch reference, not a floating per-item card with its
  own heavy shadow (the shadow/border lives once, on the group's own
  .act-group__rows list -- see activity.css). Rows are deliberately
  NOT clickable: no domain currently exposes a safe per-resource deep-
  link target from this feed (see docs/architecture/activity-ledger.md
  "Known limitations"), so this never fakes interactive affordance
  (cursor, hover-lift, tabIndex) it can't back up.
*/
const ActivityRow = ({ event }) => {
  const { t, i18n } = useTranslation();
  const icon = eventIcon(event.event_type);
  const tone = eventTone(event.event_type);
  const amount = eventAmount(event);
  const time = formatDateTime(event.created_at, i18n.language, { timeStyle: 'short' });
  const scopeLabel = event.summary?.scope ? t(`expense.scope.${event.summary.scope}`) : null;

  return (
    <li className="act-row">
      <span className={`act-row__icon act-row__icon--${tone}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </span>
      <div className="act-row__body">
        <p className="act-row__text">
          <strong className="act-row__actor">{event.actor?.display_name || t('activity.system')}</strong>{' '}
          {t(activityCopyKeys(event), activityCopyVars(t, event))}
        </p>
        <p className="act-row__meta">
          <bdi dir="ltr">{time}</bdi>
          {scopeLabel && <> · {scopeLabel}</>}
        </p>
      </div>
      <div className={`act-row__value act-row__value--${amount ? amount.tone : 'muted'}`}>
        {amount ? (
          <bdi dir="ltr" className="act-row__value-money">
            {amount.sign && <span aria-hidden="true">{amount.sign}</span>}
            <Money value={amount.value} currency={amount.currency} variant="tabular" />
          </bdi>
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </div>
    </li>
  );
};

const ActivityPanel = ({ events }) => {
  const { i18n } = useTranslation();
  const groups = groupEventsByDate(events);

  return (
    <div className="act-ledger">
      {groups.map((group, index) => (
        // group.key is the calendar-day string, not guaranteed unique
        // across the whole list -- groupEventsByDate deliberately keeps
        // two non-adjacent runs of the same day as separate groups, so
        // the React key has to disambiguate by position too.
        <section className="act-group" key={`${group.key}-${index}`}>
          <div className="act-group__head">
            <h3 className="act-group__label text-label">{formatDateGroupLabel(group.date, i18n.language)}</h3>
            <span className="act-group__rule" aria-hidden="true" />
          </div>
          <ul className="act-group__rows">
            {group.events.map((event) => <ActivityRow event={event} key={event.id} />)}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default ActivityPanel;
