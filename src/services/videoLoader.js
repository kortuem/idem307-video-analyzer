import { ActionTypes } from '../state/appReducer.js';

export function createVideoLoader({ dispatch, getState, logger }) {
  const revokeCurrentUrl = () => {
    const { videoUrl } = getState();
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
  };

  return {
    async loadFile(file) {
      if (!file) {
        return null;
      }

      revokeCurrentUrl();

      logger.log(`Loading video file: ${file.name}`);
      const objectUrl = URL.createObjectURL(file);

      dispatch({ type: ActionTypes.SET_VIDEO_FILE, payload: file });
      dispatch({ type: ActionTypes.SET_VIDEO_URL, payload: objectUrl });
      dispatch({ type: ActionTypes.RESET_ANALYSIS });

      return objectUrl;
    },
    setMetadata(metadata) {
      dispatch({ type: ActionTypes.SET_VIDEO_METADATA, payload: metadata });
    },
    reset() {
      revokeCurrentUrl();
      dispatch({ type: ActionTypes.SET_VIDEO_FILE, payload: null });
      dispatch({ type: ActionTypes.SET_VIDEO_URL, payload: '' });
      dispatch({ type: ActionTypes.SET_VIDEO_METADATA, payload: null });
      dispatch({ type: ActionTypes.RESET_ANALYSIS });
    },
  };
}
