function ensureVideoReady(videoElement) {
  if (videoElement.readyState >= 2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = (event) => {
      cleanup();
      reject(event);
    };
    const cleanup = () => {
      videoElement.removeEventListener('loadeddata', onLoaded);
      videoElement.removeEventListener('error', onError);
    };
    videoElement.addEventListener('loadeddata', onLoaded);
    videoElement.addEventListener('error', onError);
  });
}

function seek(videoElement, timeInSeconds) {
  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = (event) => {
      cleanup();
      reject(event);
    };
    const cleanup = () => {
      videoElement.removeEventListener('seeked', handleSeeked);
      videoElement.removeEventListener('error', handleError);
    };

    videoElement.currentTime = timeInSeconds;
    videoElement.addEventListener('seeked', handleSeeked, { once: true });
    videoElement.addEventListener('error', handleError, { once: true });
  });
}

function getCanvas(videoElement) {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  return canvas;
}

function createMetricsCanvas(videoElement) {
  const canvas = document.createElement('canvas');
  const width = 96;
  const aspect = videoElement.videoHeight / (videoElement.videoWidth || 1);
  canvas.width = width;
  canvas.height = Math.max(24, Math.round(width * aspect));
  return canvas;
}

function calculateDifference(currentData, previousData) {
  if (!previousData || !currentData) {
    return 1;
  }
  const length = Math.min(currentData.length, previousData.length);
  if (length === 0) return 0;
  let diff = 0;
  for (let i = 0; i < length; i += 4) {
    const dr = Math.abs(currentData[i] - previousData[i]);
    const dg = Math.abs(currentData[i + 1] - previousData[i + 1]);
    const db = Math.abs(currentData[i + 2] - previousData[i + 2]);
    diff += dr + dg + db;
  }
  const maxDiff = (length / 4) * 255 * 3;
  return Math.min(1, diff / maxDiff);
}

function categorizeChange(score) {
  if (score >= 0.45) return 'high';
  if (score >= 0.18) return 'moderate';
  return 'low';
}

function toTimestamp(seconds) {
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().slice(14, 19);
}

export class FrameCaptureService {
  constructor({ logger }) {
    this.logger = logger;
  }

  async captureFrames({
    videoElement,
    intervalSeconds = 5,
    mode = 'isolated',
    adaptiveConfig = { minInterval: 3, maxInterval: 8, step: 1.5, enable: false },
    onProgress = () => {},
  }) {
    if (!videoElement) {
      throw new Error('Video element is required for frame capture.');
    }

    await ensureVideoReady(videoElement);

    const duration = videoElement.duration;
    const frames = [];
    const canvas = getCanvas(videoElement);
    const context = canvas.getContext('2d');
    const metricsCanvas = createMetricsCanvas(videoElement);
    const metricsContext = metricsCanvas.getContext('2d');

    this.logger.log(`Starting frame capture for duration ${duration.toFixed(2)}s`);

    let previousMetricsData = null;
    let time = 0;
    let dynamicInterval = intervalSeconds;
    const { enable, minInterval, maxInterval, step } = adaptiveConfig ?? {};

    while (time <= duration + 0.0001) {
      const boundedTime = Math.min(time, duration);
      await seek(videoElement, boundedTime);
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      metricsContext.drawImage(videoElement, 0, 0, metricsCanvas.width, metricsCanvas.height);

      const metricsData = metricsContext.getImageData(0, 0, metricsCanvas.width, metricsCanvas.height).data;
      const changeScore = calculateDifference(metricsData, previousMetricsData);
      previousMetricsData = metricsData;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const timestamp = toTimestamp(boundedTime);

      const frameRecord = {
        timestamp,
        dataUrl,
        index: frames.length,
        seconds: boundedTime,
        changeScore,
        changeCategory: categorizeChange(changeScore),
      };
      frames.push(frameRecord);

      const progressByTime = duration > 0 ? Math.min(1, boundedTime / duration) : 1;
      onProgress({
        completed: frames.length,
        total: Math.max(frames.length, duration / intervalSeconds),
        timestamp,
        progress: progressByTime,
        changeScore,
      });
      this.logger.log(`Captured frame at ${timestamp} (change=${changeScore.toFixed(2)})`);

      if (mode === 'continuous' && enable) {
        if (changeScore < 0.1) {
          dynamicInterval = Math.min(dynamicInterval + step, maxInterval ?? intervalSeconds);
        } else if (changeScore > 0.3) {
          dynamicInterval = Math.max(dynamicInterval - step, minInterval ?? intervalSeconds);
        }
      }

      if (frames.length === 1 && dynamicInterval === intervalSeconds) {
        time += intervalSeconds;
      } else {
        time += Math.max(1, dynamicInterval);
      }
    }

    return frames;
  }
}
