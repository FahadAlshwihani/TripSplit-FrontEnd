import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Avatar from './Avatar';
import { encodeInitialsKey, encodeDicebearKey } from '../utils/avatarKey';

test('renders initials computed from displayName on the color from the key', () => {
  render(<Avatar avatarKey={encodeInitialsKey('coral')} displayName="Alex Smith" />);
  expect(screen.getByText('AS')).toBeInTheDocument();
});

test('renders a generated DiceBear avatar as an image once loaded', async () => {
  // alt="" is intentionally decorative (the display name text next to it
  // already conveys identity), which means it has no accessible "img"
  // role to query by — queried via the DOM directly instead.
  const { container } = render(
    <Avatar avatarKey={encodeDicebearKey({ style: 'lorelei', seed: 'render-test' })} displayName="Alex Smith" />,
  );
  await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument(), { timeout: 15000 });
  expect(container.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:image\/svg\+xml/));
}, 20000);

test('an animated dicebear key applies the matching animation class once loaded', async () => {
  const { container } = render(
    <Avatar avatarKey={encodeDicebearKey({ style: 'glass', seed: 'anim-test', animation: 'fast' })} displayName="Alex Smith" />,
  );
  await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument(), { timeout: 15000 });
  expect(container.querySelector('img')).toHaveClass('pf-avatar--anim-fast');
}, 20000);

test('falls back to an initials rendering (not a broken image) when generation fails', async () => {
  render(<Avatar avatarKey="dicebear_not-a-real-style_seed1_none" displayName="Fahad" />);
  await waitFor(() => expect(screen.getByText('FA')).toBeInTheDocument(), { timeout: 15000 });
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
}, 20000);

test('legacy avatar_key values fall through to the original emoji glyph', () => {
  render(<Avatar avatarKey="avatar_01" displayName="Alex Smith" />);
  expect(screen.getByText('🦊')).toBeInTheDocument();
});

test('an unrecognized legacy key falls through to the generic person glyph', () => {
  render(<Avatar avatarKey="some_unknown_value" displayName="Alex Smith" />);
  expect(screen.getByText('👤')).toBeInTheDocument();
});
