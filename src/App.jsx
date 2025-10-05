import { useRef } from "react";
import ApiKeyBanner from "./components/ApiKeyBanner.jsx";
import AnalysisControls from "./components/AnalysisControls.jsx";
import AnalysisResults from "./components/AnalysisResults.jsx";
import VideoNarrative from "./components/VideoNarrative.jsx";
import DebugPanel from "./components/DebugPanel.jsx";
import Header from "./components/Header.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import VideoPlayer from "./components/VideoPlayer.jsx";

export default function App() {
  const videoRef = useRef(null);

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-12 md:px-8">
        <Header />
        <ApiKeyBanner />

        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <UploadPanel />
            <VideoPlayer videoRef={videoRef} />
            <AnalysisControls videoElementRef={videoRef} />
          </div>

          <AnalysisResults />
          <VideoNarrative />
          <DebugPanel />
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
          <p>Developed by Prof. Gerd Kortuem with Claude Code</p>
          <p>TU Delft, Faculty of Industrial Design Engineering | g.w.kortuem@tudelft.nl</p>
          <p>v3.0 | October 2025</p>
        </footer>
      </div>
    </div>
  );
}
