
export interface UnitPreset {
  id: string;
  label: string;
  units: { name: string; targetUnit: string }[];
  spacing: "space" | "no-space";
  tempSpacing: "space" | "no-space";
  requireNbsp: boolean;
}

const baseUnits = [
    { name: 'Meter', targetUnit: 'm' },
    { name: 'Kilometer', targetUnit: 'km' },
    { name: 'Centimeter', targetUnit: 'cm' },
    { name: 'Millimeter', targetUnit: 'mm' },
    { name: 'Kilogram', targetUnit: 'kg' },
    { name: 'Gram', targetUnit: 'g' },
    { name: 'Liter', targetUnit: 'l' },
    { name: 'Kilobyte', targetUnit: 'KB' },
    { name: 'Megabyte', targetUnit: 'MB' },
    { name: 'Gigabyte', targetUnit: 'GB' },
    { name: 'Volt', targetUnit: 'V' },
    { name: 'Watt', targetUnit: 'W' },
    { name: 'Hertz', targetUnit: 'Hz' },
];

const createUnits = (overrides: Record<string, string>) => {
  return baseUnits.map(unit => {
    const override = overrides[unit.name];
    return override ? { ...unit, targetUnit: override } : unit;
  });
};

const standardUnits = createUnits({});
const cyrillicUnits = createUnits({ Kilobyte: 'КБ', Megabyte: 'МБ', Gigabyte: 'ГБ', Meter: 'м', Gram: 'г' });
const frenchUnits = createUnits({ Kilobyte: 'ko', Megabyte: 'Mo', Gigabyte: 'Go' });

export const UNIT_PRESETS: UnitPreset[] = [
  { id: 'sq', label: 'Albanian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'ar', label: 'Arabic', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'bg', label: 'Bulgarian', units: cyrillicUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'zh-CN', label: 'Chinese Simplified', units: standardUnits, spacing: 'no-space', tempSpacing: 'no-space', requireNbsp: false },
  { id: 'zh-TW', label: 'Chinese Traditional', units: standardUnits, spacing: 'no-space', tempSpacing: 'no-space', requireNbsp: false },
  { id: 'hr', label: 'Croatian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'cs', label: 'Czech', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'da', label: 'Danish', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'nl', label: 'Dutch', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'en', label: 'English', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'et', label: 'Estonian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'fi', label: 'Finnish', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'fr', label: 'French', units: frenchUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'de', label: 'German', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'el', label: 'Greek', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'he', label: 'Hebrew', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'is', label: 'Icelandic', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'it', label: 'Italian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'ja', label: 'Japanese', units: standardUnits, spacing: 'no-space', tempSpacing: 'no-space', requireNbsp: false },
  { id: 'kk', label: 'Kazakh', units: createUnits({ Kilobyte: 'КБ', Megabyte: 'МБ', Gigabyte: 'ГБ', Meter: 'м' }), spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'ko', label: 'Korean', units: standardUnits, spacing: 'no-space', tempSpacing: 'no-space', requireNbsp: false },
  { id: 'lt', label: 'Lithuanian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'nb', label: 'Norwegian Bokmål', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'pl', label: 'Polish', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'pt-PT', label: 'Portuguese (Portugal)', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'pt-BR', label: 'Portuguese (Brazil)', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'ro', label: 'Romanian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'ru', label: 'Russian', units: cyrillicUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'sr', label: 'Serbian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'sk', label: 'Slovak', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'sl', label: 'Slovenian', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'es', label: 'Spanish', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'sv', label: 'Swedish', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'th', label: 'Thai', units: standardUnits, spacing: 'no-space', tempSpacing: 'no-space', requireNbsp: false },
  { id: 'tr', label: 'Turkish', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'uk', label: 'Ukrainian', units: cyrillicUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: true },
  { id: 'uz', label: 'Uzbek', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
  { id: 'vi', label: 'Vietnamese', units: standardUnits, spacing: 'space', tempSpacing: 'space', requireNbsp: false },
];

export function getUnitPreset(locale: string): UnitPreset {
  const defaultPreset = UNIT_PRESETS.find(p => p.id === 'en')!;
  if (!locale) return defaultPreset;
  
  const fullMatch = UNIT_PRESETS.find(p => p.id.toLowerCase() === locale.toLowerCase());
  if (fullMatch) return fullMatch;

  const langCode = locale.split('-')[0].toLowerCase();
  const shortMatch = UNIT_PRESETS.find(p => p.id.toLowerCase() === langCode);
  return shortMatch || defaultPreset;
}
