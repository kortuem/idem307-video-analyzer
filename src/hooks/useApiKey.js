import { useCallback } from 'react';
import { ActionTypes } from '../state/appReducer.js';
import { useAppDispatch, useAppState } from '../state/AppStateProvider.jsx';

export function useApiKey() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const setApiKey = useCallback(
    (value, source = 'manual') => {
      dispatch({ type: ActionTypes.SET_API_KEY, payload: value });
      dispatch({ type: ActionTypes.SET_API_KEY_SOURCE, payload: source });
    },
    [dispatch],
  );

  const clearApiKey = useCallback(() => {
    dispatch({ type: ActionTypes.SET_API_KEY, payload: '' });
    dispatch({ type: ActionTypes.SET_API_KEY_SOURCE, payload: 'none' });
  }, [dispatch]);

  return {
    apiKey: state.apiKey,
    apiKeySource: state.apiKeySource,
    hasConfiguredKey: Boolean(state.apiKey),
    setApiKey,
    clearApiKey,
  };
}
