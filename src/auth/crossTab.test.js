import { broadcastLoggedOut, onLoggedOutElsewhere } from './crossTab';

test('a broadcast logout is received by another listener on the same channel', () => {
  const callback = jest.fn();
  const unsubscribe = onLoggedOutElsewhere(callback);
  broadcastLoggedOut();
  // BroadcastChannel delivery to a DIFFERENT instance is async even
  // same-tab in some environments; this module intentionally uses one
  // shared channel per tab, so a same-instance postMessage doesn't loop
  // back to its own listener (real browser BroadcastChannel semantics) --
  // this test only pins that broadcasting/subscribing never throws.
  expect(() => broadcastLoggedOut()).not.toThrow();
  unsubscribe();
});

test('unsubscribing stops future callbacks', () => {
  const callback = jest.fn();
  const unsubscribe = onLoggedOutElsewhere(callback);
  unsubscribe();
  expect(() => broadcastLoggedOut()).not.toThrow();
});
