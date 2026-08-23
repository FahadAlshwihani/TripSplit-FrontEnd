// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// findBy*/waitFor's default 1000ms budget is tight for routes that mount
// a React.lazy chunk plus an async data fetch (e.g. Create Trip's
// CurrencyPicker) under a fully parallel CI test run, where worker CPU
// contention alone can push resolution past it — flaky failures with no
// underlying logic bug. 5000ms matches real user patience for a page
// load without hiding a genuinely broken/never-resolving assertion.
configure({ asyncUtilTimeout: 5000 });

// jsdom's test-environment global doesn't include structuredClone (a
// standard global in every real browser and in Node 17+, but not wired
// into Jest 27's jsdom sandbox) — @dicebear/core uses it internally to
// clone style definitions. v8.serialize/deserialize is the same technique
// Node's own real structuredClone implementation uses, so this isn't a
// simplified stand-in with fewer guarantees (unlike a JSON.stringify
// round-trip, it also handles Dates/Maps/Sets/etc.).
if (typeof globalThis.structuredClone !== 'function') {
  // eslint-disable-next-line global-require
  const v8 = require('v8');
  globalThis.structuredClone = (value) => v8.deserialize(v8.serialize(value));
}
