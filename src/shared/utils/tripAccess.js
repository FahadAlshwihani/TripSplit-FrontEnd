// The ONE place backend join_policy (Trip.join_policy -- open /
// approval_required / invite_only, see apps.trips.models.Trip.
// JoinPolicy) is ever converted into the UI-facing concepts Governance's
// two-switch presentation needs. Settings' own 3-way radio group reads
// `trip.join_policy` directly (no derivation needed for a control that
// already matches the enum shape 1:1) -- this function exists so
// Governance's derived booleans are never computed inline a second time
// anywhere, and so the mapping itself is one documented, tested place
// rather than implicit in a component.
//
// Canonical state machine (matches apps.trips.services.join_trip's own
// real enforcement -- see docs/architecture/trip-access.md):
//   OPEN               -> generic join link works, joining needs no approval
//   APPROVAL_REQUIRED  -> generic join link works, joining needs owner/admin approval
//   INVITE_ONLY        -> generic join link (join_code) no longer admits new members;
//                         targeted invitations (a separate, unrelated mechanism --
//                         see TripInvitation) still work regardless of this policy
export function deriveTripAccessState(trip) {
  const joinPolicy = trip?.join_policy || 'open';
  return {
    joinPolicy,
    inviteLinkEnabled: joinPolicy !== 'invite_only',
    approvalRequired: joinPolicy === 'approval_required',
  };
}

// The inverse: given the two Governance switches' intended next values,
// what single canonical join_policy write represents that. There is no
// independent "approval" flag to persist -- turning the link off always
// wins (matches the disabled-switch UI both AccessSettingsCard and any
// future consumer already enforce), since there is no invite link left
// to require approval for once it's off.
export function nextJoinPolicy({ inviteLinkEnabled, approvalRequired }) {
  if (!inviteLinkEnabled) return 'invite_only';
  return approvalRequired ? 'approval_required' : 'open';
}
