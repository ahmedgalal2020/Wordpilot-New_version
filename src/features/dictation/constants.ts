import type { SkillMode } from './types';

export const INITIAL_SOURCE =
  'Quantum mechanics describes the physical properties of nature at the scale of atoms and subatomic particles. It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.';

export const WORKSPACE_DRAFT_KEY = 'wordpilot-workspace-draft-v4';

export const SKILL_MODES: Array<{
  id: SkillMode;
  title: string;
  shortTitle: string;
  sourceLabel: string;
  inputLabel: string;
  placeholder: string;
  instruction: string;
  finishLabel: string;
  sourceHiddenByDefault: boolean;
}> = [
  {
    id: 'Dictation',
    title: 'Hear and type exactly',
    shortTitle: 'Dictation',
    sourceLabel: 'Dictation Script',
    inputLabel: 'Your Dictation',
    placeholder: 'Type exactly what you hear...',
    instruction: 'Listen word by word, type the exact text, then check missing, wrong, and extra words.',
    finishLabel: 'Grade Dictation',
    sourceHiddenByDefault: true,
  },
  {
    id: 'Reading',
    title: 'Read, hide, rebuild',
    shortTitle: 'Reading',
    sourceLabel: 'Reading Text',
    inputLabel: 'Rebuilt Text',
    placeholder: 'Hide the source, then rewrite the main text from memory...',
    instruction: 'Read the source first, hide it, then rebuild the text. The comparison shows what you missed.',
    finishLabel: 'Check Reading',
    sourceHiddenByDefault: false,
  },
  {
    id: 'Listening',
    title: 'Listen for phrases',
    shortTitle: 'Listening',
    sourceLabel: 'Listening Script',
    inputLabel: 'What You Heard',
    placeholder: 'Listen twice, then write what you heard...',
    instruction: 'Focus on phrase endings, connectors, and rhythm. Replay difficult parts before grading.',
    finishLabel: 'Check Listening',
    sourceHiddenByDefault: true,
  },
  {
    id: 'Writing',
    title: 'Rebuild the idea',
    shortTitle: 'Writing',
    sourceLabel: 'Writing Prompt',
    inputLabel: 'Your Version',
    placeholder: 'Write your own version of the idea...',
    instruction: 'Use the source as a prompt. Rewrite the idea clearly, then compare structure and key words.',
    finishLabel: 'Check Writing',
    sourceHiddenByDefault: false,
  },
];

