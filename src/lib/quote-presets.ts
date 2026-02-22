import { QuotePair } from './types';

export interface QuotePreset {
  id: string;
  label: string;
  pairs: QuotePair[];
  apostrophes: string[];
}

export const TYPOGRAPHIC_CHARS = [
  { char: '"', code: '0022', name: 'Quotation Mark (Straight)' },
  { char: "'", code: '0027', name: 'Apostrophe (Straight)' },
  { char: '“', code: '201C', name: 'Left Double Quotation' },
  { char: '”', code: '201D', name: 'Right Double Quotation' },
  { char: '‘', code: '2018', name: 'Left Single Quotation' },
  { char: '’', code: '2019', name: 'Right Single Quotation / Apostrophe' },
  { char: '„', code: '201E', name: 'Double Low-9 Quotation' },
  { char: '‚', code: '201A', name: 'Single Low-9 Quotation' },
  { char: '«', code: '00AB', name: 'Left-Pointing Double Angle' },
  { char: '»', code: '00BB', name: 'Right-Pointing Double Angle' },
  { char: '‹', code: '2039', name: 'Left-Pointing Single Angle' },
  { char: '›', code: '203A', name: 'Right-Pointing Single Angle' },
  { char: '「', code: '300C', name: 'Left Corner Bracket' },
  { char: '」', code: '300D', name: 'Right Corner Bracket' },
  { char: '『', code: '300E', name: 'Left White Corner Bracket' },
  { char: '』', code: '300F', name: 'Right White Corner Bracket' },
];

export const QUOTE_PRESETS: QuotePreset[] = [
    { id: 'sq', label: 'Albanian', pairs: [{ open: '„', close: '”' }, { open: '«', close: '»' }, { open: '“', close: '„' }], apostrophes: ['’', "'"] },
    { id: 'ar', label: 'Arabic', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'bg', label: 'Bulgarian', pairs: [{ open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'zh-CN', label: 'Chinese Simplified', pairs: [{ open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'zh-TW', label: 'Chinese Traditional', pairs: [{ open: '「', close: '」' }, { open: '『', close: '』' }], apostrophes: ['’', "'"] },
    { id: 'hr', label: 'Croatian', pairs: [{ open: '„', close: '“' }, { open: '»', close: '«' }], apostrophes: ['’', "'"] },
    { id: 'cs', label: 'Czech', pairs: [{ open: '„', close: '“' }, { open: '‚', close: '‘' }], apostrophes: ['’', "'"] },
    { id: 'da', label: 'Danish', pairs: [{ open: '»', close: '«' }, { open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'nl', label: 'Dutch', pairs: [{ open: '„', close: '”' }, { open: '‘', close: '’' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'en', label: 'English', pairs: [{ open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'et', label: 'Estonian', pairs: [{ open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'fi', label: 'Finnish', pairs: [{ open: '”', close: '”' }, { open: '’', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'fr', label: 'French', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'de', label: 'German', pairs: [{ open: '„', close: '“' }, { open: '‚', close: '‘' }], apostrophes: ['’', "'"] },
    { id: 'el', label: 'Greek', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'he', label: 'Hebrew', pairs: [{ open: '”', close: '”' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'is', label: 'Icelandic', pairs: [{ open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'it', label: 'Italian', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'ja', label: 'Japanese', pairs: [{ open: '「', close: '」' }, { open: '『', close: '』' }], apostrophes: ['’', "'"] },
    { id: 'kk', label: 'Kazakh', pairs: [{ open: '«', close: '»' }], apostrophes: ['’', "'"] },
    { id: 'ko', label: 'Korean', pairs: [{ open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'lt', label: 'Lithuanian', pairs: [{ open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'nb', label: 'Norwegian Bokmål', pairs: [{ open: '«', close: '»' }, { open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'pl', label: 'Polish', pairs: [{ open: '„', close: '”' }, { open: '«', close: '»' }], apostrophes: ['’', "'"] },
    { id: 'pt-PT', label: 'Portuguese (Portugal)', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }], apostrophes: ['’', "'"] },
    { id: 'pt-BR', label: 'Portuguese (Brazil)', pairs: [{ open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'ro', label: 'Romanian', pairs: [{ open: '„', close: '”' }, { open: '«', close: '»' }], apostrophes: ['’', "'"] },
    { id: 'ru', label: 'Russian', pairs: [{ open: '«', close: '»' }, { open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'sr', label: 'Serbian', pairs: [{ open: '„', close: '”' }, { open: '»', close: '«' }], apostrophes: ['’', "'"] },
    { id: 'sk', label: 'Slovak', pairs: [{ open: '„', close: '“' }, { open: '‚', close: '‘' }], apostrophes: ['’', "'"] },
    { id: 'sl', label: 'Slovenian', pairs: [{ open: '„', close: '“' }, { open: '»', close: '«' }], apostrophes: ['’', "'"] },
    { id: 'es', label: 'Spanish', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'sv', label: 'Swedish', pairs: [{ open: '”', close: '”' }, { open: '»', close: '«' }], apostrophes: ['’', "'"] },
    { id: 'th', label: 'Thai', pairs: [{ open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'tr', label: 'Turkish', pairs: [{ open: '“', close: '”' }, { open: '‘', close: '’' }], apostrophes: ['’', "'"] },
    { id: 'uk', label: 'Ukrainian', pairs: [{ open: '«', close: '»' }, { open: '„', close: '“' }], apostrophes: ['’', "'"] },
    { id: 'uz', label: 'Uzbek', pairs: [{ open: '«', close: '»' }, { open: '“', close: '”' }], apostrophes: ['’', "'", 'ʻ'] },
    { id: 'vi', label: 'Vietnamese', pairs: [{ open: '“', close: '”' }], apostrophes: ['’', "'"] }
];

export function getQuotePreset(locale: string): QuotePreset {
  if (!locale) return QUOTE_PRESETS.find(p => p.id === 'en')!;
  const fullMatch = QUOTE_PRESETS.find(p => p.id.toLowerCase() === locale.toLowerCase());
  if (fullMatch) return fullMatch;

  const langCode = locale.split('-')[0].toLowerCase();
  const shortMatch = QUOTE_PRESETS.find(p => p.id.toLowerCase() === langCode);
  return shortMatch || QUOTE_PRESETS.find(p => p.id === 'en')!;
}
