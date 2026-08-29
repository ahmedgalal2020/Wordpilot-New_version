import type { ComparisonItem, DictationAnalysis, MistakeRow, MistakeStatus, PracticeLanguage, TokenRange, WordRange } from './types';

export function buildMirrorSegments(text: string, activeRange: { start: number; end: number } | null) {
  if (!activeRange) {
    return [{ text, start: 0, end: text.length, highlighted: false }];
  }

  const segments: Array<{ text: string; start: number; end: number; highlighted: boolean }> = [];
  if (activeRange.start > 0) {
    segments.push({ text: text.slice(0, activeRange.start), start: 0, end: activeRange.start, highlighted: false });
  }
  segments.push({
    text: text.slice(activeRange.start, activeRange.end),
    start: activeRange.start,
    end: activeRange.end,
    highlighted: true,
  });
  if (activeRange.end < text.length) {
    segments.push({
      text: text.slice(activeRange.end),
      start: activeRange.end,
      end: text.length,
      highlighted: false,
    });
  }

  return segments;
}

export function getWordRanges(text: string, language: PracticeLanguage = 'en-US'): TokenRange[] {
  const ranges: TokenRange[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const normalized = normalizeComparableWord(match[0], language);
    if (!normalized) {
      continue;
    }

    ranges.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      normalized,
    });
  }

  return ranges;
}

export function getNextSourceIndexFromCaret(inputText: string, caretIndex: number) {
  const safeCaretIndex = Math.min(Math.max(caretIndex, 0), inputText.length);
  const wordsBeforeCaret = getWordRanges(inputText.slice(0, safeCaretIndex));

  if (wordsBeforeCaret.length === 0) {
    return 0;
  }

  return wordsBeforeCaret.length;
}

export function normalizeWord(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/[“”"']/g, '');
}

export function buildComparisonItems(sourceWords: WordRange[], inputWords: WordRange[]): ComparisonItem[] {
  return inputWords.map((inputWord, index) => {
    const targetWord = sourceWords[index]?.text;
    const isCorrect = Boolean(targetWord) && normalizeWord(inputWord.text) === normalizeWord(targetWord);

    return {
      id: `legacy-${index}-${inputWord.start}`,
      inputWord: inputWord.text,
      targetWord,
      inputIndex: index,
      sourceIndex: index < sourceWords.length ? index : null,
      status: !targetWord ? 'extra' : isCorrect ? 'correct' : 'wrong',
    };
  });
}

export function normalizeComparableWord(value: string, language: PracticeLanguage = 'en-US') {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u02BC\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, '');

  if (language === 'de-DE') {
    if (/^[.,!?;:]+$/.test(normalized)) {
      return normalized;
    }

    return normalized
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/[^\p{L}\p{N}.,!?;:]+$/u, '');
  }

  return normalized
    .toLowerCase()
    .replace(/(^[^\p{L}\p{N}]+)|([^\p{L}\p{N}]+$)/gu, '')
    .replace(/["']/g, '');
}

export function analyzeDictation(sourceWords: TokenRange[], inputWords: TokenRange[]): DictationAnalysis {

  if (sourceWords.length === 0 && inputWords.length === 0) {

    return { comparisonItems: [], mistakes: [], accuracy: 0 };

  }

  const comparisonItems: ComparisonItem[] = [];

  const mistakes: MistakeRow[] = [];

  if (inputWords.length === 0) {

    sourceWords.forEach((sourceWord, index) => {

      comparisonItems.push({

        id: `missing-${index}-${sourceWord.start}`,

        inputWord: sourceWord.text,

        targetWord: sourceWord.text,

        inputIndex: null,

        sourceIndex: index,

        status: 'missing',

      });

      mistakes.push({

        id: `mistake-missing-${index}-${sourceWord.start}`,

        order: mistakes.length + 1,

        inputIndex: null,

        sourceIndex: index,

        writtenWord: 'Missing word',

        correctWord: sourceWord.text,

        statusLabel: 'Missing word',

      });

    });

    return { comparisonItems, mistakes, accuracy: 0 };

  }

  const matches = alignWordSequences(sourceWords, inputWords);

  let sourceIndex = 0;

  let inputIndex = 0;

  let matchIndex = 0;

  let correctCount = 0;

  while (sourceIndex < sourceWords.length || inputIndex < inputWords.length) {

    const nextMatch = matches[matchIndex] ?? null;

    if (nextMatch && nextMatch.sourceIndex === sourceIndex && nextMatch.inputIndex === inputIndex) {

      comparisonItems.push({

        id: `correct-${inputIndex}-${inputWords[inputIndex].start}`,

        inputWord: inputWords[inputIndex].text,

        targetWord: sourceWords[sourceIndex].text,

        inputIndex,

        sourceIndex,

        status: 'correct',

      });

      correctCount += 1;

      sourceIndex += 1;

      inputIndex += 1;

      matchIndex += 1;

      continue;

    }

    const nextSourceBoundary = nextMatch?.sourceIndex ?? sourceWords.length;

    const nextInputBoundary = nextMatch?.inputIndex ?? inputWords.length;

    const substitutionCount = Math.min(nextSourceBoundary - sourceIndex, nextInputBoundary - inputIndex);

    for (let offset = 0; offset < substitutionCount; offset += 1) {

      const sourceWord = sourceWords[sourceIndex + offset];

      const inputWord = inputWords[inputIndex + offset];

      comparisonItems.push({

        id: `wrong-${inputIndex + offset}-${inputWord.start}`,

        inputWord: inputWord.text,

        targetWord: sourceWord.text,

        inputIndex: inputIndex + offset,

        sourceIndex: sourceIndex + offset,

        status: 'wrong',

      });

      mistakes.push({

        id: `mistake-wrong-${inputIndex + offset}-${inputWord.start}`,

        order: mistakes.length + 1,

        inputIndex: inputIndex + offset,

        sourceIndex: sourceIndex + offset,

        writtenWord: inputWord.text,

        correctWord: sourceWord.text,

        statusLabel: 'Wrong word',

      });

    }

    sourceIndex += substitutionCount;

    inputIndex += substitutionCount;

    while (sourceIndex < nextSourceBoundary) {

      const sourceWord = sourceWords[sourceIndex];

      comparisonItems.push({

        id: `missing-${sourceIndex}-${sourceWord.start}`,

        inputWord: sourceWord.text,

        targetWord: sourceWord.text,

        inputIndex: null,

        sourceIndex,

        status: 'missing',

      });

      mistakes.push({

        id: `mistake-missing-${sourceIndex}-${sourceWord.start}`,

        order: mistakes.length + 1,

        inputIndex: null,

        sourceIndex,

        writtenWord: 'Missing word',

        correctWord: sourceWord.text,

        statusLabel: 'Missing word',

      });

      sourceIndex += 1;

    }

    while (inputIndex < nextInputBoundary) {

      const inputWord = inputWords[inputIndex];

      const expectedWord = sourceWords[sourceIndex]?.text ?? 'No matching source word';

      comparisonItems.push({

        id: `extra-${inputIndex}-${inputWord.start}`,

        inputWord: inputWord.text,

        targetWord: expectedWord,

        inputIndex,

        sourceIndex: sourceIndex < sourceWords.length ? sourceIndex : null,

        status: 'extra',

      });

      mistakes.push({

        id: `mistake-extra-${inputIndex}-${inputWord.start}`,

        order: mistakes.length + 1,

        inputIndex,

        sourceIndex: sourceIndex < sourceWords.length ? sourceIndex : null,

        writtenWord: inputWord.text,

        correctWord: expectedWord,

        statusLabel: 'Extra word',

      });

      inputIndex += 1;

    }

  }

  const sourceCount = Math.max(sourceWords.length, 1);

  const extraCount = mistakes.filter((mistake) => mistake.statusLabel === 'Extra word').length;

  const extraPenalty = Math.min(sourceCount * 0.2, extraCount * 0.5);

  const accuracy = Math.max(0, Math.round(((correctCount - extraPenalty) / sourceCount) * 100));

  return { comparisonItems, mistakes, accuracy: Math.min(100, accuracy) };

}

export function getMistakeStatus(row: MistakeRow): MistakeStatus {
  if (row.statusLabel === 'Missing word') {
    return 'missing';
  }

  if (row.statusLabel === 'Extra word') {
    return 'extra';
  }

  return 'wrong';
}

export function alignWordSequences(sourceWords: TokenRange[], inputWords: TokenRange[]) {
  const matrix = Array.from({ length: sourceWords.length + 1 }, () => Array.from({ length: inputWords.length + 1 }, () => 0));

  for (let sourceIndex = sourceWords.length - 1; sourceIndex >= 0; sourceIndex -= 1) {
    for (let inputIndex = inputWords.length - 1; inputIndex >= 0; inputIndex -= 1) {
      matrix[sourceIndex][inputIndex] =
        sourceWords[sourceIndex].normalized === inputWords[inputIndex].normalized
          ? matrix[sourceIndex + 1][inputIndex + 1] + 1
          : Math.max(matrix[sourceIndex + 1][inputIndex], matrix[sourceIndex][inputIndex + 1]);
    }
  }

  const matches: Array<{ sourceIndex: number; inputIndex: number }> = [];
  let sourceIndex = 0;
  let inputIndex = 0;

  while (sourceIndex < sourceWords.length && inputIndex < inputWords.length) {
    if (sourceWords[sourceIndex].normalized === inputWords[inputIndex].normalized) {
      matches.push({ sourceIndex, inputIndex });
      sourceIndex += 1;
      inputIndex += 1;
      continue;
    }

    if (matrix[sourceIndex + 1][inputIndex] >= matrix[sourceIndex][inputIndex + 1]) {
      sourceIndex += 1;
    } else {
      inputIndex += 1;
    }
  }

  return matches;
}
