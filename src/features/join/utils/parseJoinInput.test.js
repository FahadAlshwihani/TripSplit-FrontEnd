import { parseJoinInput } from './parseJoinInput';

test('a bare join code is classified as code and uppercased', () => {
  expect(parseJoinInput('t6z90ch1')).toEqual({ mode: 'code', value: 'T6Z90CH1' });
});

test('a URL with ?code= is classified as code', () => {
  expect(parseJoinInput('https://tripsplit.app/trips/join?code=abcd1234')).toEqual({ mode: 'code', value: 'ABCD1234' });
});

test('a URL with ?token= is classified as token', () => {
  expect(parseJoinInput('https://tripsplit.app/invite/accept?token=xyz-token-value')).toEqual({ mode: 'token', value: 'xyz-token-value' });
});

test('a /invite/<token> URL path is classified as token', () => {
  expect(parseJoinInput('https://tripsplit.app/invite/dYNf3orWZKybJjBPi7Y1Y_jdAM0iUGfMrgQSsOAlDkP9')).toEqual({
    mode: 'token',
    value: 'dYNf3orWZKybJjBPi7Y1Y_jdAM0iUGfMrgQSsOAlDkP9',
  });
});

test('a long raw token pasted without a URL is classified as token', () => {
  const token = 'dYNf3orWZKybJjBPi7Y1Y_jdAM0iUGfMrgQSsOAlDkP9odj9H-4BpPoTAi3N1sOy';
  expect(parseJoinInput(token)).toEqual({ mode: 'token', value: token });
});

test('empty or whitespace-only input returns null', () => {
  expect(parseJoinInput('')).toBeNull();
  expect(parseJoinInput('   ')).toBeNull();
});

test('a garbled short input that is neither a code nor a token returns null', () => {
  expect(parseJoinInput('a')).toBeNull();
});

test('a malformed URL falls through to null', () => {
  expect(parseJoinInput('https://')).toBeNull();
});
