import { useAppState, AnalysisStatus } from "../state/AppStateProvider.jsx";

function NarrativePlaceholder({ analysisStatus }) {
  if (analysisStatus === AnalysisStatus.ANALYZING || analysisStatus === AnalysisStatus.CAPTURING) {
    return <p className="text-sm text-slate-400">Generating continuous narrative…</p>;
  }
  if (analysisStatus === AnalysisStatus.PREPARING) {
    return <p className="text-sm text-slate-400">Preparing analysis…</p>;
  }
  return <p className="text-sm text-slate-400">Run an analysis to generate a complete narrative summary.</p>;
}

export default function VideoNarrative() {
  const { selectedPerspective, analysisSummaries, analysisHighlights, analysisStatus } = useAppState();
  const summary = analysisSummaries[selectedPerspective];
  const highlights = analysisHighlights[selectedPerspective] ?? [];
  const hasNarrative = Boolean(summary);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-100">5. Video Narrative</h2>
        <span className="text-xs uppercase tracking-widest text-slate-500">
          {hasNarrative ? 'Ready' : 'Awaiting analysis'}
        </span>
      </div>
      {hasNarrative ? (
        <div className="mt-4 space-y-4">
          <div className="whitespace-pre-wrap text-sm text-slate-200">{summary}</div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Highlights</h3>
            {highlights.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No explicit highlights detected; rely on the narrative for key insights.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {highlights.map((item) => (
                  <li key={`${item.timestamp}-${item.frameIndex}`} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{item.timestamp}</p>
                    <p className="mt-1 text-sm text-slate-200">{item.description || item.reason}</p>
                    {item.reason && (
                      <p className="mt-1 text-xs text-slate-400">Reason: {item.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <NarrativePlaceholder analysisStatus={analysisStatus} />
        </div>
      )}
    </section>
  );
}
