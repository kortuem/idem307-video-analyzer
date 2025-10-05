function buildHeader({ perspectiveLabel, mode, videoFile, videoMetadata }) {
  const modeLabel = mode === 'continuous' ? 'Continuous Narrative' : 'Isolated Frames';
  const lines = [
    'AI Video Analyzer Report',
    '========================',
    '',
    `Generated at: ${new Date().toISOString()}`,
    `Perspective: ${perspectiveLabel}`,
    `Analysis Mode: ${modeLabel}`,
    '',
    'Video Details',
    '------------',
    `Filename: ${videoFile?.name ?? 'Unknown'}`,
    `Size: ${videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'}`,
    `Duration: ${videoMetadata?.duration ? `${videoMetadata.duration.toFixed(2)} s` : 'Unknown'}`,
    videoMetadata?.dimensions
      ? `Resolution: ${videoMetadata.dimensions.width}×${videoMetadata.dimensions.height}`
      : 'Resolution: Unknown',
    '',
  ];

  return lines.join('\n');
}

function formatFrameEntry(frame, index) {
  const changeDescriptor = frame.changeCategory
    ? `Change intensity: ${frame.changeCategory.toUpperCase()} (${(frame.changeScore * 100).toFixed(0)}%)`
    : 'Change intensity: n/a';
  return [
    `Frame ${index + 1} (${frame.timestamp})`,
    '--------------------------',
    changeDescriptor,
    frame.text?.trim() ? frame.text.trim() : 'No description returned.',
    '',
  ].join('\n');
}

function buildFrameSection(results) {
  return results.map(formatFrameEntry).join('\n');
}

function buildNarrativeSection(summaryText, highlights = []) {
  const summaryLines = [
    '',
    'Comprehensive Narrative',
    '-----------------------',
    summaryText?.trim() || 'Summary unavailable.',
    '',
    'Key Events & Highlights',
    '-----------------------',
  ];

  if (highlights.length === 0) {
    summaryLines.push('• No explicit highlights detected.');
  } else {
    highlights.forEach((event) => {
      const snippet = event.snippet ? ` — ${event.snippet}` : '';
      summaryLines.push(`• ${event.timestamp}: ${event.reason}${snippet}`);
    });
  }

  summaryLines.push('');

  return summaryLines.join('\n');
}

export function createExporter({ logger }) {
  return {
    download({ perspective, results, videoFile, videoMetadata, summary, highlights, mode }) {
      if (!results || results.length === 0) {
        throw new Error('No analysis results available to export.');
      }

      const header = buildHeader({
        perspectiveLabel: perspective.label,
        mode,
        videoFile,
        videoMetadata
      });
      const narrativeSection = buildNarrativeSection(summary, highlights);
      const framesSection = buildFrameSection(results);
      const content = `${header}${narrativeSection}${framesSection}`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `${perspective.id}-analysis-${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.log('Analysis report downloaded');
    },
  };
}
