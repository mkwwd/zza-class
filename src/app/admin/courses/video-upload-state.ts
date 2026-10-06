type VideoPair = {
  durationSeconds: number | null;
  url: string;
};

type PendingReplacement = {
  durationSeconds: number | null;
  isMetadataResolved: boolean;
  uploadedUrl: string | null;
};

type VideoUploadState = {
  committed: VideoPair;
  pendingReplacement: PendingReplacement | null;
  previewUrl: string;
};

type VideoUploadEvent =
  | { previewUrl: string; type: 'replacement-selected' }
  | { durationSeconds: number; type: 'metadata-ready' }
  | { type: 'metadata-failed' }
  | { type: 'upload-failed' }
  | { type: 'upload-succeeded'; url: string };

export function createVideoUploadState(
  url: string,
  durationSeconds: number | null,
): VideoUploadState {
  return {
    committed: { durationSeconds, url },
    pendingReplacement: null,
    previewUrl: url,
  };
}

export function normalizeVideoDuration(duration: number): number | null {
  const roundedDuration = Math.round(duration);
  return Number.isFinite(roundedDuration) && roundedDuration >= 0
    ? roundedDuration
    : null;
}

export function isVideoUploadPending(state: VideoUploadState): boolean {
  return state.pendingReplacement !== null;
}

function commitReadyReplacement(state: VideoUploadState): VideoUploadState {
  const replacement = state.pendingReplacement;

  if (
    !replacement ||
    replacement.uploadedUrl === null ||
    !replacement.isMetadataResolved
  ) {
    return state;
  }

  return {
    ...state,
    committed: {
      durationSeconds: replacement.durationSeconds,
      url: replacement.uploadedUrl,
    },
    pendingReplacement: null,
  };
}

function updatePendingReplacement(
  state: VideoUploadState,
  update: Partial<PendingReplacement>,
) {
  if (!state.pendingReplacement) return state;

  return commitReadyReplacement({
    ...state,
    pendingReplacement: {
      ...state.pendingReplacement,
      ...update,
    },
  });
}

export function reduceVideoUploadState(
  state: VideoUploadState,
  event: VideoUploadEvent,
): VideoUploadState {
  switch (event.type) {
    case 'replacement-selected':
      return {
        ...state,
        pendingReplacement: {
          durationSeconds: null,
          isMetadataResolved: false,
          uploadedUrl: null,
        },
        previewUrl: event.previewUrl,
      };
    case 'metadata-ready': {
      if (!state.pendingReplacement) {
        return {
          ...state,
          committed: {
            ...state.committed,
            durationSeconds: event.durationSeconds,
          },
        };
      }

      return updatePendingReplacement(state, {
        durationSeconds: event.durationSeconds,
        isMetadataResolved: true,
      });
    }
    case 'metadata-failed':
      return updatePendingReplacement(state, {
        durationSeconds: null,
        isMetadataResolved: true,
      });
    case 'upload-succeeded':
      return updatePendingReplacement(state, {
        uploadedUrl: event.url,
      });
    case 'upload-failed':
      return {
        ...state,
        pendingReplacement: null,
        previewUrl: state.committed.url,
      };
  }
}
