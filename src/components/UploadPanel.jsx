import { useRef, useState } from "react";
import { useAppState } from "../state/AppStateProvider.jsx";
import { useAnalysisServices } from "../hooks/useAnalysisServices.js";
import { formatDuration, formatFileSize } from "../utils/formatters.js";

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export default function UploadPanel() {
  const fileInputRef = useRef(null);
  const { videoFile, videoMetadata } = useAppState();
  const { videoLoader } = useAnalysisServices();
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload an MP4, WebM, or QuickTime video.');
      return;
    }

    setError('');
    await videoLoader.loadFile(file);
  };

  const handleReset = () => {
    videoLoader.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-100">1. Upload Video</h2>
          <p className="mt-2 text-sm text-slate-400">
            Choose an MP4, WebM, or MOV file. Videos stay on your device; frames are captured locally before analysis.
          </p>
        </div>
        {videoFile && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500"
          >
            Remove
          </button>
        )}
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <label
          htmlFor="video-upload"
          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-950/60 p-6 text-sm text-slate-200 transition hover:border-sky-500 hover:text-sky-200"
        >
          <div className="text-center">
            <p className="font-medium">Drop video here or click to browse</p>
            <p className="mt-1 text-xs text-slate-400">Max ~200MB recommended for smoother analysis</p>
          </div>
          <input
            ref={fileInputRef}
            id="video-upload"
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Current selection</p>
          {videoFile ? (
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>
                <span className="text-slate-400">Name: </span>
                {videoFile.name}
              </li>
              <li>
                <span className="text-slate-400">Size: </span>
                {formatFileSize(videoFile.size)}
              </li>
              <li>
                <span className="text-slate-400">Type: </span>
                {videoFile.type || 'unknown'}
              </li>
              <li>
                <span className="text-slate-400">Duration: </span>
                {formatDuration(videoMetadata?.duration)}
              </li>
              <li>
                <span className="text-slate-400">Resolution: </span>
                {videoMetadata?.dimensions
                  ? `${videoMetadata.dimensions.width}×${videoMetadata.dimensions.height}`
                  : '—'}
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No file selected yet.</p>
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
    </section>
  );
}
