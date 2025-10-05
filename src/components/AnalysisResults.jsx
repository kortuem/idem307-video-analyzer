import { useMemo } from 'react';
import { useAppState, AnalysisStatus, AnalysisModes } from '../state/AppStateProvider.jsx';
import { getPerspectiveById } from '../utils/perspectives.js';

const changeStyles = {
  high: 'bg-rose-500/20 text-rose-200 border border-rose-500/60',
  moderate: 'bg-amber-500/20 text-amber-200 border border-amber-500/60',
  low: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30',
};

export default function AnalysisResults() {
  const {
    selectedPerspective,
    analysisResults,
    analysisHighlights,
    capturedFrames,
    analysisStatus,
    analysisMode,
  } = useAppState();

  const currentPerspective = useMemo(
    () => getPerspectiveById(selectedPerspective),
    [selectedPerspective],
  );

  const results = analysisResults[selectedPerspective] ?? [];
  const highlights = analysisHighlights[selectedPerspective] ?? [];
  const highlightIndexes = new Set(highlights.map((item) => item.frameIndex));
  const highlightMap = new Map(highlights.map((item) => [item.frameIndex, item]));

  const hasResults = results.length > 0;
  const isAnalyzing =
    analysisStatus === AnalysisStatus.ANALYZING || analysisStatus === AnalysisStatus.CAPTURING;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-100">4. Analysis Results</h2>
          <p className="text-xs text-slate-400">
            Perspective: {currentPerspective.label} · Mode: {analysisMode === AnalysisModes.CONTINUOUS ? 'Continuous narrative' : 'Isolated frames'}
          </p>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-500">
          {isAnalyzing ? 'In progress' : hasResults ? 'Completed' : 'Awaiting analysis'}
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {hasResults
          ? results.map((result) => {
              const changeBadge = result.changeCategory ?? 'low';
              const changeClasses = changeStyles[changeBadge] ?? changeStyles.low;
              const highlightDetail = highlightMap.get(result.index);
              const isHighlight = Boolean(highlightDetail);
              return (
                <article
                  key={`${result.perspectiveId}-${result.index}`}
                  className={`flex flex-col gap-3 rounded-lg border ${
                    isHighlight ? 'border-sky-500/80 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]' : 'border-slate-700'
                  } bg-slate-950/60 p-4 transition`}
                >
                  <img
                    src={result.dataUrl}
                    alt={`Frame at ${result.timestamp}`}
                    className="aspect-video w-full rounded-md border border-slate-800 object-cover"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{result.timestamp}</span>
                    <span>Frame {result.index + 1}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 ${changeClasses}`}>
                      Change: {changeBadge.toUpperCase()}
                    </span>
                    {isHighlight && (
                      <span className="rounded-full border border-sky-500/60 bg-sky-500/10 px-2 py-1 text-sky-200">
                        Key moment
                      </span>
                    )}
                    {isHighlight && highlightDetail?.reason && (
                      <span className="mt-1 text-[0.7rem] text-sky-200">{highlightDetail.reason}</span>
                    )}
                    {isHighlight && highlightDetail?.snippet && (
                      <span className="mt-1 text-[0.7rem] text-slate-300">{highlightDetail.snippet}</span>
                    )}
                    {typeof result.changeScore === 'number' && (
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">
                        {(result.changeScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-200">
                    {result.text || 'No description returned.'}
                  </p>
                </article>
              );
            })
          : (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                <p>
                  {capturedFrames.length > 0
                    ? 'Frames captured. Re-run analysis with a perspective to generate results.'
                    : 'No analysis yet. Upload a video and click “Analyze Video” to get started.'}
                </p>
              </div>
            )}
      </div>
    </section>
  );
}
