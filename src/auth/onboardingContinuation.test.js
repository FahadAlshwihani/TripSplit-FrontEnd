import { continuationFromLocation, continuationFromPath, postProfileNavigation } from './onboardingContinuation';

test('models a join-code continuation without confusing it with the trip URL identifier', () => {
  expect(continuationFromPath('/trips/join?code=ab12cd34')).toEqual({
    type: 'join_code', joinCode: 'AB12CD34', returnPath: '/trips/join?code=ab12cd34',
  });
});

test('models an invitation token separately and never stores it as a join code', () => {
  const intent = continuationFromPath('/invite/secrettoken1234567890');
  expect(intent).toEqual({ type: 'invitation', token: 'secrettoken1234567890', returnPath: '/invite/secrettoken1234567890' });
  expect(intent).not.toHaveProperty('joinCode');
});

test('rejects external return URLs and falls back to the Account hub', () => {
  expect(postProfileNavigation('https://evil.example/steal')).toEqual({
    to: '/account', state: { onboardingContinuation: { type: 'default', returnPath: '/account' } },
  });
});

test('only reads a structurally valid continuation from router state', () => {
  expect(continuationFromLocation({ state: { onboardingContinuation: { type: 'join_code', joinCode: 'ABCD1234' } } })).toEqual({ type: 'join_code', joinCode: 'ABCD1234' });
  expect(continuationFromLocation({ state: { onboardingContinuation: { type: 'join_code', joinCode: '../bad' } } })).toBeNull();
});
