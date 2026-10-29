import { useContext } from 'react';
import { AppStateContext, AppDispatchContext, ServiceContext } from './appContexts.js';
import { ActionTypes, AnalysisStatus, AnalysisModes } from './appReducer.js';

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
