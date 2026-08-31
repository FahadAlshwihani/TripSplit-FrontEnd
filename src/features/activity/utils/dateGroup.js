// Groups an already-newest-first activity page (the server guarantees
// `-created_at, -id` ordering -- see apps/trips/views.py:activity_view)
// into consecutive same-calendar-day runs. A single sequential scan is
// correct and cheap here specifically because the input is pre-sorted;
// this never re-sorts or merges non-adjacent runs of the same day.
export const dateGroupKey = (value) => new Date(value).toDateString();

export const formatDateGroupLabel = (value, language) => {
  const locale = language?.startsWith('ar') ? 'ar-SA' : language?.startsWith('en') ? 'en' : undefined;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
};

export const groupEventsByDate = (events) => {
  const groups = [];
  let current = null;
  events.forEach((event) => {
    const key = dateGroupKey(event.created_at);
    if (!current || current.key !== key) {
      current = { key, date: event.created_at, events: [] };
      groups.push(current);
    }
    current.events.push(event);
  });
  return groups;
};
