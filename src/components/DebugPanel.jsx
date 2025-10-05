import { useAppState } from "../state/AppStateProvider.jsx";

function levelStyles(level) {
  switch (level) {
    case "error":
      return "text-rose-400";
    case "warn":
      return "text-amber-300";
    default:
      return "text-slate-200";
  }
}

export default function DebugPanel() {
  const { log } = useAppState();

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-100">Debug Log</h2>
        <span className="text-xs text-slate-500">Latest events first</span>
      </div>
      <div className="mt-4 h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs">
        {log.length === 0 ? (
          <p className="text-slate-500">Interaction history will appear here.</p>
        ) : (
          <ul className="space-y-2">
            {[...log].reverse().map((entry) => (
              <li key={entry.id} className="font-mono text-[0.7rem] leading-relaxed">
                <span className="text-slate-500">[{entry.timestamp}]</span>{" "}
                <span className={`${levelStyles(entry.level)} font-semibold`}>{entry.level.toUpperCase()}</span>{" "}
                <span className="text-slate-200">{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
