export const permissionsFor = (member, archived = false, closed = false) => {
  const role = member?.role;
  const readOnly = archived || closed;
  const isManager = ['owner', 'admin'].includes(role);
  return {
    canEditTrip: !readOnly && isManager,
    canManageMembers: !readOnly && isManager,
    // Semantic capabilities mirror the backend's current owner/admin
    // contracts without making unrelated "manage members" permission do
    // double duty in Fund and settlement surfaces.
    canManageFund: !readOnly && isManager,
    canRecordAdminSettlement: !readOnly && isManager,
    canTransferOwnership: !readOnly && role === 'owner',
    canCreateExpense: !readOnly && Boolean(member),
    canRecordSettlement: !readOnly && Boolean(member),
    canArchiveTrip: !archived && role === 'owner',
    canRestoreTrip: archived && role === 'owner',
    canEditExpense: (expense) => !readOnly && (isManager || expense.created_by === member?.id),
  };
};
