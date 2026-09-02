import i18n from '../../i18n';
import { buildTripShareMessage } from './shareMessage';

const url = 'https://example.com/trips/short-1';

afterEach(async () => { await i18n.changeLanguage('en'); });

describe('English', () => {
  test('open, no password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'open' });
    expect(message).toBe('Join us on "summer" 👋\nHere\'s the trip link:\nhttps://example.com/trips/short-1\n\nYou can jump straight in.');
  });

  test('approval_required, no password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'approval_required' });
    expect(message).toBe('Join us on "summer" 👋\nHere\'s the trip link:\nhttps://example.com/trips/short-1\n\nOnce you\'re in, let me know so I can approve your request.');
  });

  test('approval_required, with password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'approval_required', password: 'hunter2' });
    expect(message).toBe('Join us on "summer" 👋\nHere\'s the trip link:\nhttps://example.com/trips/short-1\n\nPassword: hunter2\n\nOnce you\'re in, let me know so I can approve your request.');
  });

  test('invite_only, no password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'invite_only' });
    expect(message).toBe('You\'re invited to join "summer" 👋\nHere\'s your invite link:\nhttps://example.com/trips/short-1');
  });

  test('invite_only, with password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'invite_only', password: 'hunter2' });
    expect(message).toBe('You\'re invited to join "summer" 👋\nHere\'s your invite link:\nhttps://example.com/trips/short-1\n\nPassword: hunter2');
  });

  test('fund contextual message never includes a password even if one is passed', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, linkType: 'fund', password: 'hunter2' });
    expect(message).toBe('Check your Fund contribution for "summer" 👋\nhttps://example.com/trips/short-1');
    expect(message).not.toContain('hunter2');
  });

  test('settlement contextual message never includes a password even if one is passed', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, linkType: 'settlement', password: 'hunter2' });
    expect(message).toBe('Check the settlement details for "summer" 👋\nhttps://example.com/trips/short-1');
    expect(message).not.toContain('hunter2');
  });
});

describe('Arabic', () => {
  beforeEach(async () => { await i18n.changeLanguage('ar'); });

  test('open, no password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'open' });
    expect(message).toBe('انضم معنا في رحلة "summer" 👋\nهذا رابط الدخول:\nhttps://example.com/trips/short-1\n\nادخل مباشرة وبتنضم للرحلة.');
  });

  test('approval_required, with password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'approval_required', password: 'hunter2' });
    expect(message).toBe('انضم معنا في رحلة "summer" 👋\nهذا رابط الدخول:\nhttps://example.com/trips/short-1\n\nكلمة المرور: hunter2\n\nبعد ما تدخل، علمني عشان أقبل طلب الانضمام.');
  });

  test('invite_only, with password', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'invite_only', password: 'hunter2' });
    expect(message).toBe('هذه دعوة للانضمام لرحلة "summer" 👋\nرابط الدعوة:\nhttps://example.com/trips/short-1\n\nكلمة المرور: hunter2');
  });

  test('fund contextual message', () => {
    const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, linkType: 'fund' });
    expect(message).toBe('شوف مساهمتك في صندوق رحلة "summer" 👋\nhttps://example.com/trips/short-1');
  });
});

test('the current app locale controls the language, never an independent browser-language check', async () => {
  await i18n.changeLanguage('ar');
  const arMessage = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'open' });
  await i18n.changeLanguage('en');
  const enMessage = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'open' });
  expect(arMessage).not.toBe(enMessage);
  expect(arMessage).toContain('انضم معنا');
  expect(enMessage).toContain('Join us');
});

test('the password never appears inside the URL itself, only as a separate line in the message body', () => {
  const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url, joinPolicy: 'approval_required', password: 'hunter2' });
  const [urlLine] = message.split('\n').filter((line) => line.startsWith('http'));
  expect(urlLine).toBe(url);
  expect(urlLine).not.toContain('hunter2');
});

test('no raw internal UUID appears in a share message -- callers are always responsible for passing a short_code URL', () => {
  const message = buildTripShareMessage({ t: i18n.t.bind(i18n), tripName: 'summer', url: 'https://example.com/trips/short-1', joinPolicy: 'open' });
  expect(message).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
});
