import { ActionTypes } from '../state/appReducer.js';

function formatTimestamp(date) {
  return date.toISOString();
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `log-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLogger(dispatch) {
  return {
    log(message, level = 'info', context = {}) {
      const entry = {
        id: createId(),
        level,
        message,
        context,
        timestamp: formatTimestamp(new Date()),
      };
      dispatch({ type: ActionTypes.APPEND_LOG_ENTRY, payload: entry });
    },
    clear() {
      dispatch({ type: ActionTypes.CLEAR_LOG });
    },
  };
}
