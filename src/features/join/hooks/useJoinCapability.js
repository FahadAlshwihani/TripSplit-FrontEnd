import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getJoinCapability } from '../api/joinApi';
import { parseJoinInput } from '../utils/parseJoinInput';

// `committedInput` is only updated when the caller explicitly triggers a
// lookup (Enter/click, or the Flow B auto-trigger from a pre-filled query
// param) -- never on every keystroke. useRouteResource's abort/generation
// guard means a rapid re-trigger just cancels the stale in-flight fetch.
export default function useJoinCapability(committedInput) {
  const parsed = parseJoinInput(committedInput);
  const resource = useRouteResource(
    (signal) => (parsed ? getJoinCapability(parsed, { signal }) : Promise.resolve(null)),
    [parsed?.mode, parsed?.value],
    true
  );
  return { ...resource, parsed };
}
