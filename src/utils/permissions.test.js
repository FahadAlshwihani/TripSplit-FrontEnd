import { permissionsFor } from './permissions';

test('owner controls disappear when a trip is archived', () => {
  const active = permissionsFor({ id: 'owner', role: 'owner' }, false);
  expect(active.canEditTrip).toBe(true);
  expect(active.canTransferOwnership).toBe(true);
  expect(active.canEditExpense({ created_by: 'other' })).toBe(true);
  const archived = permissionsFor({ id: 'owner', role: 'owner' }, true);
  expect(archived.canCreateExpense).toBe(false);
  expect(archived.canRestoreTrip).toBe(true);
});

test('member may edit only their own expense', () => {
  const permissions = permissionsFor({ id: 'member', role: 'member' }, false);
  expect(permissions.canEditExpense({ created_by: 'member' })).toBe(true);
  expect(permissions.canEditExpense({ created_by: 'other' })).toBe(false);
  expect(permissions.canManageMembers).toBe(false);
});
