export function getAudioExtension(mimeType: string) {
  if (/ogg/i.test(mimeType)) return 'ogg';
  if (/mp4|m4a/i.test(mimeType)) return 'm4a';
  if (/mpeg|mp3/i.test(mimeType)) return 'mp3';
  if (/wav/i.test(mimeType)) return 'wav';
  return 'webm';
}
export function getFriendlyEvaluationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/AI_NOT_CONFIGURED|GEMINI_API_KEY/i.test(message)) {
    return 'AI pronunciation analysis is not configured yet. Add GEMINI_API_KEY on the server, or type/check your spoken response manually for now.';
  }

  if (/NO_SPEECH_DETECTED|No spoken words/i.test(message)) {
    return 'No spoken words were detected in this recording. Try again closer to the microphone.';
  }

  if (/AUDIO_TOO_SMALL|too short/i.test(message)) {
    return 'The recording was too short to evaluate. Hold record while you repeat the full sentence.';
  }

  return 'AI pronunciation analysis could not finish. You can retry recording or use the typed response checker.';
}

export function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Could not read the recording.'));
    reader.readAsDataURL(blob);
  });
}

