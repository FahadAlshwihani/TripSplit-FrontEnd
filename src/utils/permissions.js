export const permissionsFor = (member, archived = false) => {
  const role = member?.role;
  return {
    canEditTrip: !archived && role === 'owner',
    canManageMembers: !archived && ['owner', 'admin'].includes(role),
    canTransferOwnership: !archived && role === 'owner',
    canCreateExpense: !archived && Boolean(member),
    canRecordSettlement: !archived && Boolean(member),
    canArchiveTrip: !archived && role === 'owner',
    canRestoreTrip: archived && role === 'owner',
    canEditExpense: (expense) => !archived && (['owner', 'admin'].includes(role) || expense.created_by === member?.id),
  };
};
