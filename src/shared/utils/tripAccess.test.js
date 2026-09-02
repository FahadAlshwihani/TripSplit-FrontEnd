import { deriveTripAccessState, nextJoinPolicy } from './tripAccess';

describe('deriveTripAccessState', () => {
  test('open: link enabled, approval not required', () => {
    expect(deriveTripAccessState({ join_policy: 'open' })).toEqual({
      joinPolicy: 'open', inviteLinkEnabled: true, approvalRequired: false,
    });
  });

  test('approval_required: link enabled, approval required', () => {
    expect(deriveTripAccessState({ join_policy: 'approval_required' })).toEqual({
      joinPolicy: 'approval_required', inviteLinkEnabled: true, approvalRequired: true,
    });
  });

  test('invite_only: link disabled, approval not required (there is no link left to require approval for)', () => {
    expect(deriveTripAccessState({ join_policy: 'invite_only' })).toEqual({
      joinPolicy: 'invite_only', inviteLinkEnabled: false, approvalRequired: false,
    });
  });

  test('defaults to open when trip/join_policy is missing (never throws)', () => {
    expect(deriveTripAccessState({})).toEqual({ joinPolicy: 'open', inviteLinkEnabled: true, approvalRequired: false });
    expect(deriveTripAccessState(null)).toEqual({ joinPolicy: 'open', inviteLinkEnabled: true, approvalRequired: false });
  });
});

describe('nextJoinPolicy', () => {
  test('link disabled always resolves to invite_only, regardless of approvalRequired', () => {
    expect(nextJoinPolicy({ inviteLinkEnabled: false, approvalRequired: false })).toBe('invite_only');
    expect(nextJoinPolicy({ inviteLinkEnabled: false, approvalRequired: true })).toBe('invite_only');
  });

  test('link enabled + approval required resolves to approval_required', () => {
    expect(nextJoinPolicy({ inviteLinkEnabled: true, approvalRequired: true })).toBe('approval_required');
  });

  test('link enabled + approval not required resolves to open', () => {
    expect(nextJoinPolicy({ inviteLinkEnabled: true, approvalRequired: false })).toBe('open');
  });

  test('is the exact inverse of deriveTripAccessState for every one of the three canonical policies', () => {
    ['open', 'approval_required', 'invite_only'].forEach((joinPolicy) => {
      const derived = deriveTripAccessState({ join_policy: joinPolicy });
      expect(nextJoinPolicy(derived)).toBe(joinPolicy);
    });
  });
});
