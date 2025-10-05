export const ActionTypes = {
  SET_API_KEY: 'SET_API_KEY',
  SET_API_KEY_SOURCE: 'SET_API_KEY_SOURCE',
  SET_SELECTED_PERSPECTIVE: 'SET_SELECTED_PERSPECTIVE',
  SET_ANALYSIS_MODE: 'SET_ANALYSIS_MODE',
  SET_VIDEO_FILE: 'SET_VIDEO_FILE',
  SET_VIDEO_METADATA: 'SET_VIDEO_METADATA',
  SET_VIDEO_URL: 'SET_VIDEO_URL',
  SET_ANALYSIS_STATUS: 'SET_ANALYSIS_STATUS',
  SET_ANALYSIS_PROGRESS: 'SET_ANALYSIS_PROGRESS',
  SET_ERROR: 'SET_ERROR',
  RESET_ANALYSIS: 'RESET_ANALYSIS',
  STORE_CAPTURED_FRAMES: 'STORE_CAPTURED_FRAMES',
  STORE_ANALYSIS_RESULTS: 'STORE_ANALYSIS_RESULTS',
  STORE_ANALYSIS_SUMMARY: 'STORE_ANALYSIS_SUMMARY',
  STORE_ANALYSIS_HIGHLIGHTS: 'STORE_ANALYSIS_HIGHLIGHTS',
  CLEAR_ANALYSIS_FOR_PERSPECTIVE: 'CLEAR_ANALYSIS_FOR_PERSPECTIVE',
  APPEND_LOG_ENTRY: 'APPEND_LOG_ENTRY',
  CLEAR_LOG: 'CLEAR_LOG',
};

export const AnalysisStatus = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  CAPTURING: 'capturing',
  ANALYZING: 'analyzing',
  COMPLETE: 'complete',
  ERROR: 'error',
};

export const AnalysisModes = {
  ISOLATED: 'isolated',
  CONTINUOUS: 'continuous',
};

export const initialState = {
  apiKey: '',
  apiKeySource: 'none',
  selectedPerspective: 'objective-description',
  analysisMode: AnalysisModes.ISOLATED,
  videoFile: null,
  videoMetadata: null,
  videoUrl: '',
  capturedFrames: [],
  analysisResults: {},
  analysisSummaries: {},
  analysisHighlights: {},
  analysisStatus: AnalysisStatus.IDLE,
  analysisProgress: 0,
  error: null,
  log: [],
};

export function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_API_KEY:
      return { ...state, apiKey: action.payload };
    case ActionTypes.SET_API_KEY_SOURCE:
      return { ...state, apiKeySource: action.payload };
    case ActionTypes.SET_SELECTED_PERSPECTIVE:
      return { ...state, selectedPerspective: action.payload };
    case ActionTypes.SET_ANALYSIS_MODE:
      return { ...state, analysisMode: action.payload };
    case ActionTypes.SET_VIDEO_FILE:
      return { ...state, videoFile: action.payload };
    case ActionTypes.SET_VIDEO_METADATA:
      return { ...state, videoMetadata: action.payload };
    case ActionTypes.SET_VIDEO_URL:
      return { ...state, videoUrl: action.payload };
    case ActionTypes.SET_ANALYSIS_STATUS:
      return { ...state, analysisStatus: action.payload };
    case ActionTypes.SET_ANALYSIS_PROGRESS:
      return { ...state, analysisProgress: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.RESET_ANALYSIS:
      return {
        ...state,
        capturedFrames: [],
        analysisResults: {},
        analysisSummaries: {},
        analysisHighlights: {},
        analysisStatus: AnalysisStatus.IDLE,
        analysisProgress: 0,
        error: null,
      };
    case ActionTypes.STORE_CAPTURED_FRAMES:
      return { ...state, capturedFrames: action.payload };
    case ActionTypes.STORE_ANALYSIS_RESULTS:
      return {
        ...state,
        analysisResults: {
          ...state.analysisResults,
          [action.payload.perspective]: action.payload.results,
        },
      };
    case ActionTypes.STORE_ANALYSIS_SUMMARY:
      return {
        ...state,
        analysisSummaries: {
          ...state.analysisSummaries,
          [action.payload.perspective]: action.payload.summary,
        },
      };
    case ActionTypes.STORE_ANALYSIS_HIGHLIGHTS:
      return {
        ...state,
        analysisHighlights: {
          ...state.analysisHighlights,
          [action.payload.perspective]: action.payload.highlights,
        },
      };
    case ActionTypes.CLEAR_ANALYSIS_FOR_PERSPECTIVE: {
      const perspective = action.payload;
      const nextResults = { ...state.analysisResults };
      const nextSummaries = { ...state.analysisSummaries };
      const nextHighlights = { ...state.analysisHighlights };
      delete nextResults[perspective];
      delete nextSummaries[perspective];
      delete nextHighlights[perspective];
      return {
        ...state,
        analysisResults: nextResults,
        analysisSummaries: nextSummaries,
        analysisHighlights: nextHighlights,
      };
    }
    case ActionTypes.APPEND_LOG_ENTRY:
      return {
        ...state,
        log: [...state.log, action.payload],
      };
    case ActionTypes.CLEAR_LOG:
      return { ...state, log: [] };
    default:
      return state;
  }
}
