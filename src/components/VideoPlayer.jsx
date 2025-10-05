import { useEffect } from "react";
import { useAppState, AnalysisStatus } from "../state/AppStateProvider.jsx";
import { useAnalysisServices } from "../hooks/useAnalysisServices.js";

export default function VideoPlayer({ videoRef }) {
  const { videoUrl, analysisStatus } = useAppState();
  const { videoLoader } = useAnalysisServices();

  useEffect(() => {
    return () => {
      const videoElement = videoRef?.current;
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();
      }
    };
  }, [videoRef]);

  const handleLoadedMetadata = () => {
    const videoElement = videoRef?.current;
    if (!videoElement) return;
    videoLoader.setMetadata({
      duration: videoElement.duration,
      dimensions: {
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      },
    });
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-100">2. Preview</h2>
      <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-contain"
            controls
            onLoadedMetadata={handleLoadedMetadata}
            muted
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Upload a video to preview it here.
          </div>
        )}
      </div>
      {analysisStatus === AnalysisStatus.ANALYZING && (
        <p className="mt-2 text-xs text-slate-400">Video playback paused during analysis.</p>
      )}
    </section>
  );
}
