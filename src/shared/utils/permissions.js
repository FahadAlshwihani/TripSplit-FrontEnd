export const permissionsFor = (member, archived = false, closed = false) => {
  const role = member?.role;
  const readOnly = archived || closed;
  return {
    canEditTrip: !readOnly && ['owner', 'admin'].includes(role),
    canManageMembers: !readOnly && ['owner', 'admin'].includes(role),
    canTransferOwnership: !readOnly && role === 'owner',
    canCreateExpense: !readOnly && Boolean(member),
    canRecordSettlement: !readOnly && Boolean(member),
    canArchiveTrip: !archived && role === 'owner',
    canRestoreTrip: archived && role === 'owner',
    canEditExpense: (expense) => !readOnly && (['owner', 'admin'].includes(role) || expense.created_by === member?.id),
  };
};
