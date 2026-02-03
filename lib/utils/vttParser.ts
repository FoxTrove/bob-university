/**
 * Utility to parse and clean VTT (WebVTT) transcript content
 */

interface VTTCue {
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * Parse time string like "00:01:23.456" to seconds
 */
function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseFloat(seconds)
    );
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes, 10) * 60 + parseFloat(seconds);
  }
  return 0;
}

/**
 * Parse VTT content into an array of cues
 */
export function parseVTT(vttContent: string): VTTCue[] {
  const lines = vttContent.split('\n');
  const cues: VTTCue[] = [];
  let i = 0;

  // Skip WEBVTT header and any metadata
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line (e.g., "00:00:00.000 --> 00:00:05.000")
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim().split(' ')[0]);
      const startTime = parseTime(startStr);
      const endTime = parseTime(endStr);

      // Collect text lines until empty line or next timestamp
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].includes('-->')) {
        // Skip cue identifiers (numeric lines before timestamps)
        if (!/^\d+$/.test(lines[i].trim())) {
          textLines.push(lines[i].trim());
        }
        i++;
      }

      if (textLines.length > 0) {
        cues.push({
          startTime,
          endTime,
          text: textLines.join(' '),
        });
      }
    } else {
      i++;
    }
  }

  return cues;
}

/**
 * Extract clean text from VTT content (no timestamps)
 * Removes duplicate consecutive lines and cleans up the text
 */
export function vttToCleanText(vttContent: string): string {
  const cues = parseVTT(vttContent);

  // Deduplicate and join text
  const seenText = new Set<string>();
  const cleanLines: string[] = [];

  for (const cue of cues) {
    const normalizedText = cue.text.trim();
    if (normalizedText && !seenText.has(normalizedText)) {
      seenText.add(normalizedText);
      cleanLines.push(normalizedText);
    }
  }

  return cleanLines.join(' ');
}

/**
 * Check if content appears to be VTT format
 */
export function isVTTFormat(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('WEBVTT') ||
         /^\d{2}:\d{2}/.test(trimmed) ||
         content.includes('-->');
}

/**
 * Format seconds to readable time string (e.g., "1:23")
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
