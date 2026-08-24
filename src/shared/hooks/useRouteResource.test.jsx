import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import useRouteResource from './useRouteResource';
import { ApiError } from '../../api/errors';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

const Harness = ({ loader, resourceKey, resetOnKeyChange }) => {
  const resource = useRouteResource(loader, [resourceKey], resetOnKeyChange);
  return (
    <div>
      {resource.loading && <span>loading</span>}
      {resource.error && <span role="alert">{resource.error.message}</span>}
      {resource.data && <span>{resource.data.value}</span>}
      <button onClick={resource.retry}>retry</button>
    </div>
  );
};

test('aborts a route-scoped read when the component unmounts', async () => {
  let requestSignal;
  const loader = jest.fn((signal) => {
    requestSignal = signal;
    return new Promise(() => {});
  });
  const view = render(<Harness loader={loader} resourceKey="trip-a" />);
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
  view.unmount();
  expect(requestSignal.aborted).toBe(true);
});

test('aborts the old trip read and ignores its late response', async () => {
  const requests = { 'trip-a': deferred(), 'trip-b': deferred() };
  const signals = {};
  const loaderFor = (tripId) => (signal) => {
    signals[tripId] = signal;
    return requests[tripId].promise;
  };
  const view = render(<Harness loader={loaderFor('trip-a')} resourceKey="trip-a" />);
  await waitFor(() => expect(signals['trip-a']).toBeDefined());
  view.rerender(<Harness loader={loaderFor('trip-b')} resourceKey="trip-b" />);
  await waitFor(() => expect(signals['trip-b']).toBeDefined());
  expect(signals['trip-a'].aborted).toBe(true);

  await act(async () => requests['trip-b'].resolve({ value: 'current trip' }));
  expect(await screen.findByText('current trip')).toBeInTheDocument();
  await act(async () => requests['trip-a'].resolve({ value: 'stale trip' }));
  expect(screen.queryByText('stale trip')).not.toBeInTheDocument();
});

test('does not expose an expected cancellation as a route error', async () => {
  const loader = jest.fn().mockRejectedValue(new ApiError({
    code: 'request_cancelled',
    message: 'Request cancelled.',
  }));
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<Harness loader={loader} resourceKey="trip-a" />);
  await waitFor(() => expect(loader).toHaveBeenCalled());
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test('with resetOnKeyChange, the previous data is cleared the instant a new key starts loading', async () => {
  const requests = { 'trip-a': deferred(), 'trip-b': deferred() };
  const loaderFor = (tripId) => () => requests[tripId].promise;
  const view = render(<Harness loader={loaderFor('trip-a')} resourceKey="trip-a" resetOnKeyChange />);
  await act(async () => requests['trip-a'].resolve({ value: 'trip A' }));
  expect(await screen.findByText('trip A')).toBeInTheDocument();
  view.rerender(<Harness loader={loaderFor('trip-b')} resourceKey="trip-b" resetOnKeyChange />);
  expect(screen.queryByText('trip A')).not.toBeInTheDocument();
});

test('without resetOnKeyChange (default), the previous data stays visible while a new key loads', async () => {
  const requests = { 'trip-a': deferred(), 'trip-b': deferred() };
  const loaderFor = (tripId) => () => requests[tripId].promise;
  const view = render(<Harness loader={loaderFor('trip-a')} resourceKey="trip-a" />);
  await act(async () => requests['trip-a'].resolve({ value: 'trip A' }));
  expect(await screen.findByText('trip A')).toBeInTheDocument();
  view.rerender(<Harness loader={loaderFor('trip-b')} resourceKey="trip-b" />);
  expect(screen.getByText('trip A')).toBeInTheDocument();
});

test('retry clears the previous error and starts a fresh read', async () => {
  const loader = jest.fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ value: 'recovered' });
  render(<Harness loader={loader} resourceKey="trip-a" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  await act(async () => screen.getByRole('button', { name: 'retry' }).click());
  expect(await screen.findByText('recovered')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(loader).toHaveBeenCalledTimes(2);
});
