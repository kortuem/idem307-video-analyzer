import { ActionTypes, AnalysisStatus, AnalysisModes } from '../state/appReducer.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
import { buildFramePrompt, buildSummaryPrompt, getPerspectiveById } from '../utils/perspectives.js';

const CONTINUOUS_ADAPTIVE_CONFIG = {
  enable: true,
  minInterval: 1,
  maxInterval: 4,
  step: 1,
};

function firstSentence(text, maxLength = 180) {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/[^.!?]+[.!?]/);
  const candidate = match ? match[0].trim() : trimmed;
  if (candidate.length <= maxLength) return candidate;
  return `${candidate.slice(0, maxLength - 1)}…`;
}

function detectSignificantEvent(frame, description, previousDescription = '') {
  const noteworthyKeywords = ['enter', 'exit', 'arrive', 'depart', 'approach', 'hazard', 'risk', 'crowd', 'conflict', 'shift', 'change', 'collision'];
  const lowered = (description || '').toLowerCase();
  const previousLower = (previousDescription || '').toLowerCase();
  const changeScore = frame.changeScore ?? 0;
  const matchedKeyword = noteworthyKeywords.find((keyword) => lowered.includes(keyword));

  let reason = null;
  if (changeScore >= 0.45) {
    reason = 'Large visible change or movement in the scene.';
  } else if (changeScore >= 0.25 && matchedKeyword) {
    reason = `Activity involving "${matchedKeyword}" becomes prominent.`;
  } else if (matchedKeyword && !previousLower.includes(matchedKeyword)) {
    reason = `Newly visible detail related to "${matchedKeyword}".`;
  }

  if (!reason) {
    return null;
  }

  return {
    reason,
    snippet: firstSentence(description),
    changeScore,
  };
}

function formatFrameForSummary(frame) {
  const categoryLabel = (frame.changeCategory || 'low').toUpperCase();
  const description = frame.text?.trim() || 'No description returned.';
  return `- [${frame.timestamp}] (${categoryLabel} change) ${description}`;
}

export class AnalysisManager {
  constructor({ dispatch, getState, frameCaptureService, geminiClient, logger }) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.frameCaptureService = frameCaptureService;
    this.geminiClient = geminiClient;
    this.logger = logger;
    this.abortController = null;
  }

  cancelOngoingAnalysis() {
    if (this.abortController) {
      this.abortController.abort();
      this.logger.log('Analysis cancelled by user', 'warn');
    }
  }

  async analyze({
    videoElement,
    perspectiveId,
    intervalSeconds = 5,
    reuseCapturedFrames = false,
  }) {
    const perspective = getPerspectiveById(perspectiveId);
    if (!perspective) {
      throw new Error('Invalid perspective');
    }

    const state = this.getState();
    const apiKeyFromState = state.apiKey ?? '';
    const keyToUse = apiKeyFromState || this.geminiClient.getApiKey();

    if (!keyToUse) {
      throw new Error('Gemini API key is not configured.');
    }

    if (!videoElement) {
      throw new Error('Video element reference missing.');
    }

    this.geminiClient.setApiKey(keyToUse);
    const mode = state.analysisMode ?? AnalysisModes.ISOLATED;
    this.logger.log(`Starting ${mode} analysis: ${perspective.label}`);

    this.dispatch({ type: ActionTypes.SET_SELECTED_PERSPECTIVE, payload: perspective.id });
    this.dispatch({ type: ActionTypes.SET_ERROR, payload: null });
    this.dispatch({ type: ActionTypes.SET_ANALYSIS_STATUS, payload: AnalysisStatus.PREPARING });
    this.dispatch({ type: ActionTypes.SET_ANALYSIS_PROGRESS, payload: 0 });
    this.dispatch({ type: ActionTypes.CLEAR_ANALYSIS_FOR_PERSPECTIVE, payload: perspective.id });

    let frames = state.capturedFrames;

    const originalTime = videoElement.currentTime;
    const wasPaused = videoElement.paused;
    videoElement.pause();

    if (!reuseCapturedFrames || frames.length === 0) {
      this.dispatch({ type: ActionTypes.SET_ANALYSIS_STATUS, payload: AnalysisStatus.CAPTURING });
      frames = await this.captureFrames({
        videoElement,
        intervalSeconds,
        mode,
      });
      this.dispatch({ type: ActionTypes.STORE_CAPTURED_FRAMES, payload: frames });
    }

    this.dispatch({ type: ActionTypes.SET_ANALYSIS_STATUS, payload: AnalysisStatus.ANALYZING });

    const results = [];
    const contextState = {
      previousDescriptions: [],
      cumulativeNarrative: [],
      significantEvents: [],
      staticSceneCount: 0,
    };

    this.abortController = new AbortController();

    try {
      for (let index = 0; index < frames.length; index += 1) {
        const frame = frames[index];
        const prompt = buildFramePrompt({
          perspectiveId: perspective.id,
          mode,
          context: {
            index,
            previousDescriptions: contextState.previousDescriptions,
          },
        });

        const { text } = await this.geminiClient.analyzeFrame({
          base64Image: frame.dataUrl,
          prompt,
          abortSignal: this.abortController.signal,
        });

        const trimmedText = text?.trim() ?? '';
        const enrichedFrame = {
          ...frame,
          text: trimmedText,
          perspectiveId: perspective.id,
        };
        results.push(enrichedFrame);

        const previousDescription = contextState.previousDescriptions.at(-1) ?? '';
        contextState.previousDescriptions.push(trimmedText);
        contextState.previousDescriptions = contextState.previousDescriptions.slice(-3);
        if (trimmedText) {
          contextState.cumulativeNarrative.push(`[${frame.timestamp}] ${trimmedText}`);
        }
        if ((frame.changeScore ?? 0) < 0.08) {
          contextState.staticSceneCount += 1;
        }
        const eventDetails = detectSignificantEvent(frame, trimmedText, previousDescription);
        if (eventDetails) {
          const lastEvent = contextState.significantEvents.at(-1);
          const isDuplicate = lastEvent
            ? lastEvent.frameIndex === index && lastEvent.reason === eventDetails.reason
            : false;
          if (!isDuplicate) {
            contextState.significantEvents.push({
              frameIndex: index,
              timestamp: frame.timestamp,
              reason: eventDetails.reason,
              snippet: eventDetails.snippet,
              changeScore: eventDetails.changeScore,
              changeCategory: frame.changeCategory,
            });
          }
        }

        this.dispatch({
          type: ActionTypes.STORE_ANALYSIS_RESULTS,
          payload: { perspective: perspective.id, results: [...results] },
        });

        // Analysis phase is 30-90% of total progress
        const analysisProgress = 0.3 + ((index + 1) / frames.length) * 0.6;
        this.dispatch({
          type: ActionTypes.SET_ANALYSIS_PROGRESS,
          payload: analysisProgress,
        });
        this.logger.log(`Analyzed frame ${index + 1} / ${frames.length}`);
        await sleep(350);
      }

      // Summary generation phase is 90-100% of total progress
      this.dispatch({ type: ActionTypes.SET_ANALYSIS_PROGRESS, payload: 0.9 });

      // Generate summary (works for both auth types - keyword uses backend proxy)
      const summaryText = await this.generateSummary({
        perspective,
        frames: results,
        contextState,
        videoMetadata: state.videoMetadata,
        mode,
      });
      this.dispatch({
        type: ActionTypes.STORE_ANALYSIS_SUMMARY,
        payload: { perspective: perspective.id, summary: summaryText },
      });
      this.dispatch({
        type: ActionTypes.STORE_ANALYSIS_HIGHLIGHTS,
        payload: { perspective: perspective.id, highlights: contextState.significantEvents },
      });
      this.logger.log('Narrative summary generated successfully');

      // Complete - set to 100%
      this.dispatch({ type: ActionTypes.SET_ANALYSIS_PROGRESS, payload: 1 });
      this.dispatch({ type: ActionTypes.SET_ANALYSIS_STATUS, payload: AnalysisStatus.COMPLETE });
      this.logger.log(`Analysis complete: ${perspective.label}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        this.dispatch({ type: ActionTypes.SET_ANALYSIS_STATUS, payload: AnalysisStatus.IDLE });
        return;
      }
      this.logger.log(error.message ?? 'Unknown analysis error', 'error');
      this.dispatch({ type: ActionTypes.SET_ANALYSIS_STATUS, payload: AnalysisStatus.ERROR });
      this.dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      this.abortController = null;
      try {
        await new Promise((resolve) => {
          videoElement.currentTime = originalTime;
          const handleSeeked = () => {
            videoElement.removeEventListener('seeked', handleSeeked);
            resolve();
          };
          videoElement.addEventListener('seeked', handleSeeked, { once: true });
        });
        if (!wasPaused) {
          await videoElement.play().catch(() => {});
        }
      } catch (restoreError) {
        this.logger.log('Failed to restore video playback state', 'warn', {
          message: restoreError?.message,
        });
      }
    }
  }

  async captureFrames({ videoElement, intervalSeconds, mode }) {
    return this.frameCaptureService.captureFrames({
      videoElement,
      intervalSeconds,
      mode,
      adaptiveConfig: mode === AnalysisModes.CONTINUOUS ? CONTINUOUS_ADAPTIVE_CONFIG : { enable: false },
      onProgress: ({ progress }) => {
        if (typeof progress === 'number') {
          // Capture phase is 0-30% of total progress
          const captureProgress = progress * 0.3;
          this.dispatch({ type: ActionTypes.SET_ANALYSIS_PROGRESS, payload: captureProgress });
        }
      },
    });
  }

  async generateSummary({ perspective, frames, contextState, videoMetadata, mode }) {
    if (!frames || frames.length === 0) {
      return 'No frames analysed.';
    }

    const summaryInstruction = buildSummaryPrompt({ perspectiveId: perspective.id });
    const frameSummaries = frames.map((frame) => formatFrameForSummary(frame)).join('\n');
    const highlights = contextState.significantEvents
      .map((event) => {
        const snippet = event.snippet ? ` — ${event.snippet}` : '';
        return `• ${event.timestamp}: ${event.reason}${snippet}`;
      })
      .join('\n');
    const metadataLines = [
      videoMetadata?.duration ? `Video duration: ${videoMetadata.duration.toFixed(2)} seconds.` : '',
      videoMetadata?.dimensions
        ? `Resolution: ${videoMetadata.dimensions.width}×${videoMetadata.dimensions.height}.`
        : '',
      `Analysis mode: ${mode}.`,
    ]
      .filter(Boolean)
      .join('\n');
    const maxChangeScore = frames.reduce((max, frame) => Math.max(max, frame.changeScore ?? 0), 0);
    const motionGuidance = mode === AnalysisModes.ISOLATED && maxChangeScore >= 0.18
      ? `Motion guidance: Frames show visible movement (change score up to ${(maxChangeScore * 100).toFixed(0)}%). Mention the observed progression of people or vehicles when summarising.`
      : '';

    this.logger.log('Generating narrative summary from frame analyses');

    const prompt = [`${summaryInstruction}`,
      '',
      metadataLines,
      motionGuidance,
      '',
      'Frame analyses:',
      frameSummaries,
      '',
      'Significant events detected (if any):',
      highlights || '• None detected explicitly; infer based on frame analyses.',
      '',
      'Create a cohesive narrative (2-4 paragraphs) describing the full video, referencing the beginning, middle, and end.',
      'After the narrative, include a short bulleted list of key takeaways or recommendations relevant to this perspective.',
    ].join('\n');

    const { text } = await this.geminiClient.generateText({
      prompt,
      abortSignal: this.abortController?.signal,
      temperature: 0.35,
    });

    return text?.trim() ?? '';
  }
}
