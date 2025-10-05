import { createContext, useContext, useMemo, useReducer, useRef, useEffect } from 'react';
import { createLogger } from '../services/logger.js';
import { FrameCaptureService } from '../services/frameCapture.js';
import { GeminiClient } from '../services/geminiClient.js';
import { createVideoLoader } from '../services/videoLoader.js';
import { AnalysisManager } from '../services/analysisManager.js';
import { createExporter } from '../services/exporter.js';
import { ActionTypes, AnalysisStatus, AnalysisModes, appReducer, initialState } from './appReducer.js';

const AppStateContext = createContext(initialState);
const AppDispatchContext = createContext(() => {});
const ServiceContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (baseState) => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY ?? '';
    if (envKey) {
      return {
        ...baseState,
        apiKey: envKey,
        apiKeySource: 'env',
      };
    }
    return baseState;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const getState = () => stateRef.current;

  const wrappedDispatch = (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }
    return dispatch(action);
  };

  const servicesRef = useRef(null);

  if (!servicesRef.current) {
    const logger = createLogger(dispatch);
    const frameCaptureService = new FrameCaptureService({ logger });
    const geminiClient = new GeminiClient({ apiKey: '', logger });
    const analysisManager = new AnalysisManager({
      dispatch,
      getState,
      frameCaptureService,
      geminiClient,
      logger,
    });
    const videoLoader = createVideoLoader({ dispatch, getState, logger });
    const exporter = createExporter({ logger });

    servicesRef.current = {
      logger,
      frameCaptureService,
      geminiClient,
      analysisManager,
      videoLoader,
      exporter,
    };
  } else {
    servicesRef.current.analysisManager.getState = getState;
  }

  // Sync API key to geminiClient
  const prevApiKeyRef = useRef(null);

  useEffect(() => {
    const currentKey = state.apiKey ?? '';

    // Update API key if changed
    if (currentKey !== prevApiKeyRef.current) {
      prevApiKeyRef.current = currentKey;
      servicesRef.current.geminiClient.setApiKey(currentKey);
    }
  }, [state.apiKey]);

  const memoState = useMemo(() => state, [state]);

  return (
    <AppStateContext.Provider value={memoState}>
      <AppDispatchContext.Provider value={wrappedDispatch}>
        <ServiceContext.Provider value={servicesRef.current}>
          {children}
        </ServiceContext.Provider>
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}

export function useServices() {
  return useContext(ServiceContext);
}

export { ActionTypes, AnalysisStatus, AnalysisModes };
