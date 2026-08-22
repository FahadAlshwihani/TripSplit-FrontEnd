import { useEffect, useState } from 'react';
import { generateAvatarDataUri } from '../services/avatarGenerator';

// status: 'idle' (no style/seed yet) | 'loading' | 'ready' | 'error'.
// Every consumer (the canonical Avatar, the picker grid's own candidates)
// goes through this so the async-chunk-load + fallback-on-error behavior
// only needs to be right once.
const useDicebearAvatar = ({ style, seed, size = 128 }) => {
  const [state, setState] = useState({ status: style && seed ? 'loading' : 'idle', dataUri: null });

  useEffect(() => {
    if (!style || !seed) {
      setState({ status: 'idle', dataUri: null });
      return undefined;
    }
    let cancelled = false;
    setState({ status: 'loading', dataUri: null });
    generateAvatarDataUri({ style, seed, size })
      .then((dataUri) => { if (!cancelled) setState({ status: 'ready', dataUri }); })
      .catch(() => { if (!cancelled) setState({ status: 'error', dataUri: null }); });
    return () => { cancelled = true; };
  }, [style, seed, size]);

  return state;
};

export default useDicebearAvatar;
