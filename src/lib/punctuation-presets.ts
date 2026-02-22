
import { PunctuationGrid } from './types';

export interface PunctuationPreset {
  id: string;
  label: string;
  punctuationGrid: PunctuationGrid;
  specialSignsGrid: PunctuationGrid;
}

const EMPTY_GRID: PunctuationGrid = {
  spaceBefore: '',
  spaceAfter: '',
  noSpaceBefore: '',
  noSpaceAfter: '',
  nbspBefore: '',
  nbspAfter: ''
};

export const PUNCTUATION_PRESETS: PunctuationPreset[] = [
  { id: 'en', label: 'English', punctuationGrid: { ...EMPTY_GRID, noSpaceBefore: '.,:;!?', spaceAfter: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'sq', label: 'Albanian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'ar', label: 'Arabic', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'bg', label: 'Bulgarian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'zh-CN', label: 'Chinese Simplified', punctuationGrid: { ...EMPTY_GRID, noSpaceBefore: '.,:;!?', noSpaceAfter: '.,:;!?' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'zh-TW', label: 'Chinese Traditional', punctuationGrid: { ...EMPTY_GRID, noSpaceBefore: '.,:;!?', noSpaceAfter: '.,:;!?' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'hr', label: 'Croatian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'cs', label: 'Czech', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'da', label: 'Danish', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'nl', label: 'Dutch', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'et', label: 'Estonian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'fi', label: 'Finnish', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'fr', label: 'French', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,', noSpaceBefore: '.,', noSpaceAfter: '\'', nbspBefore: ':;!?»', nbspAfter: '«' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '§', spaceAfter: '®%%©§', noSpaceBefore: '©®™', nbspBefore: '%%‰', nbspAfter: '§' } },
  { id: 'de', label: 'German', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '' } },
  { id: 'el', label: 'Greek', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'he', label: 'Hebrew', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'is', label: 'Icelandic', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'it', label: 'Italian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'ja', label: 'Japanese', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'kk', label: 'Kazakh', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'ko', label: 'Korean', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'lt', label: 'Lithuanian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'nb', label: 'Norwegian Bokmål', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'pl', label: 'Polish', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'pt-PT', label: 'Portuguese (Portugal)', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'pt-BR', label: 'Portuguese (Brazil)', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'ro', label: 'Romanian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'ru', label: 'Russian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'sr', label: 'Serbian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'sk', label: 'Slovak', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'sl', label: 'Slovenian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'es', label: 'Spanish', punctuationGrid: { ...EMPTY_GRID, spaceBefore: '¡¿', spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '¡¿' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'sv', label: 'Swedish', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'th', label: 'Thai', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'tr', label: 'Turkish', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'uk', label: 'Ukrainian', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
  { id: 'uz', label: 'Uzbek', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '©§', spaceAfter: '®%%©§', noSpaceBefore: '®%%' } },
  { id: 'vi', label: 'Vietnamese', punctuationGrid: { ...EMPTY_GRID, spaceAfter: '.,:;!?', noSpaceBefore: '.,:;!?', noSpaceAfter: '\'' }, specialSignsGrid: { ...EMPTY_GRID, spaceBefore: '%%©§', spaceAfter: '®%%©§', noSpaceBefore: '®' } },
];

export function getPunctuationPreset(locale: string): PunctuationPreset {
  if (!locale) return PUNCTUATION_PRESETS[0];
  const fullMatch = PUNCTUATION_PRESETS.find(p => p.id.toLowerCase() === locale.toLowerCase());
  if (fullMatch) return fullMatch;

  const langCode = locale.split('-')[0].toLowerCase();
  const shortMatch = PUNCTUATION_PRESETS.find(p => p.id.toLowerCase() === langCode);
  return shortMatch || PUNCTUATION_PRESETS.find(p => p.id === 'en')!;
}
