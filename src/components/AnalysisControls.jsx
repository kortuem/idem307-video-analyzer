import { useCallback, useMemo, useState } from 'react';
import {
  useAppDispatch,
  useAppState,
  ActionTypes,
  AnalysisStatus,
  AnalysisModes,
} from '../state/AppStateProvider.jsx';
import { perspectiveList } from '../utils/perspectives.js';
import { useAnalysisServices } from '../hooks/useAnalysisServices.js';
import { useApiKey } from '../hooks/useApiKey.js';

function getStatusLabel(status) {
  switch (status) {
    case AnalysisStatus.PREPARING:
      return 'Preparing…';
    case AnalysisStatus.CAPTURING:
      return 'Capturing frames…';
    case AnalysisStatus.ANALYZING:
      return 'Analyzing with Gemini…';
    case AnalysisStatus.COMPLETE:
      return 'Analysis complete';
    case AnalysisStatus.ERROR:
      return 'Analysis failed';
    default:
      return 'Idle';
  }
}

export default function AnalysisControls({ videoElementRef }) {
  const dispatch = useAppDispatch();
  const state = useAppState();
  const { analysisManager, exporter } = useAnalysisServices();
  const { hasConfiguredKey } = useApiKey();
  const [localError, setLocalError] = useState('');

  const isBusy =
    state.analysisStatus === AnalysisStatus.PREPARING ||
    state.analysisStatus === AnalysisStatus.CAPTURING ||
    state.analysisStatus === AnalysisStatus.ANALYZING;

  const handlePerspectiveChange = (event) => {
    dispatch({ type: ActionTypes.SET_SELECTED_PERSPECTIVE, payload: event.target.value });
  };

  const handleModeChange = (event) => {
    dispatch({ type: ActionTypes.SET_ANALYSIS_MODE, payload: event.target.value });
  };

  const handleExport = useCallback(() => {
    const results = state.analysisResults[state.selectedPerspective] ?? [];
    if (results.length === 0) {
      setLocalError('Run an analysis before exporting.');
      return;
    }
    const perspective = perspectiveList.find((item) => item.id === state.selectedPerspective);
    try {
      exporter.download({
        perspective,
        results,
        videoFile: state.videoFile,
        videoMetadata: state.videoMetadata,
        summary: state.analysisSummaries[state.selectedPerspective] ?? '',
        highlights: state.analysisHighlights[state.selectedPerspective] ?? [],
        mode: state.analysisMode,
      });
      setLocalError('');
    } catch (error) {
      setLocalError(error.message ?? 'Failed to download analysis.');
    }
  }, [
    exporter,
    state.analysisResults,
    state.selectedPerspective,
    state.videoFile,
    state.videoMetadata,
    state.analysisSummaries,
    state.analysisHighlights,
    state.analysisMode,
  ]);

  const handleStop = useCallback(() => {
    analysisManager.cancelOngoingAnalysis();
    setLocalError('Analysis stopped by user.');
  }, [analysisManager]);

  const handleAnalyze = useCallback(
    async (reuseCapturedFrames = false) => {
      const videoElement = videoElementRef?.current;
      if (!videoElement) {
        setLocalError('Upload a video before running analysis.');
        return;
      }
      if (!hasConfiguredKey) {
        setLocalError('Provide a Gemini API key before running analysis.');
        return;
      }
      setLocalError('');
      try {
        await analysisManager.analyze({
          videoElement,
          perspectiveId: state.selectedPerspective,
          intervalSeconds: state.analysisMode === AnalysisModes.CONTINUOUS ? 1.8 : 2.5,
          reuseCapturedFrames,
        });
      } catch (error) {
        setLocalError(error.message ?? 'Analysis failed.');
      }
    },
    [analysisManager, hasConfiguredKey, state.selectedPerspective, state.analysisMode, videoElementRef],
  );

  const progressPercent = useMemo(() => Math.round((state.analysisProgress ?? 0) * 100), [
    state.analysisProgress,
  ]);

  const hasResults = (state.analysisResults[state.selectedPerspective] ?? []).length > 0;
  const modeLabel =
    state.analysisMode === AnalysisModes.CONTINUOUS ? 'Continuous narrative mode' : 'Isolated frame mode';

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-100">3. Analysis Controls</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="perspective">
              Perspective
            </label>
            <select
              id="perspective"
              className="rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              value={state.selectedPerspective}
              onChange={handlePerspectiveChange}
              disabled={isBusy}
            >
              {perspectiveList.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3">
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-400">Mode</legend>
            <div className="mt-2 flex flex-col gap-2 text-xs text-slate-300">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="analysis-mode"
                  value={AnalysisModes.ISOLATED}
                  checked={state.analysisMode === AnalysisModes.ISOLATED}
                  onChange={handleModeChange}
                  disabled={isBusy}
                />
                <span className="flex flex-col">
                  <span className="font-semibold text-slate-100">Isolated Frames</span>
                  <span className="text-[0.72rem] text-slate-400">
                    Analyze each frame independently with standalone prompts.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="analysis-mode"
                  value={AnalysisModes.CONTINUOUS}
                  checked={state.analysisMode === AnalysisModes.CONTINUOUS}
                  onChange={handleModeChange}
                  disabled={isBusy}
                />
                <span className="flex flex-col">
                  <span className="font-semibold text-slate-100">Continuous Narrative</span>
                  <span className="text-[0.72rem] text-slate-400">
                    Track changes across frames, adapt sampling, and build a flowing story.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAnalyze(false)}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={isBusy || !state.videoUrl}
          >
            Analyze Video
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze(true)}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
            disabled={isBusy || state.capturedFrames.length === 0}
          >
            Re-analyze with New Perspective
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="rounded-lg border border-rose-600 px-4 py-2 text-sm font-medium text-rose-200 hover:border-rose-500 disabled:cursor-not-allowed disabled:border-rose-900 disabled:text-rose-500"
            disabled={!isBusy}
          >
            Stop Analysis
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
            disabled={!hasResults || isBusy}
          >
            Download Analysis
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{getStatusLabel(state.analysisStatus)} · {modeLabel}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>
      {state.error && <p className="mt-3 text-xs text-rose-300">{state.error}</p>}
      {localError && <p className="mt-2 text-xs text-rose-300">{localError}</p>}
    </section>
  );
}
