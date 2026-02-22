
/**
 * @fileOverview Central Registry for global linguistic standards.
 * Maps ISO language codes to comprehensive QA module defaults.
 */

import { QASettings } from './types';
import { getPunctuationPreset } from './punctuation-presets';
import { getNumberPreset } from './number-presets';
import { getQuotePreset } from './quote-presets';
import { getUnitPreset } from './unit-presets';

/**
 * Gets the complete set of standard QA settings for a given locale.
 */
export function getSettingsForLocale(locale: string): Partial<QASettings> {
  const pPreset = getPunctuationPreset(locale);
  const nPreset = getNumberPreset(locale);
  const qPreset = getQuotePreset(locale);
  const uPreset = getUnitPreset(locale);

  return {
    // Punctuation Grid
    punctuationGrid: pPreset.punctuationGrid,
    specialSignsGrid: pPreset.specialSignsGrid,
    
    // Quotes & Apostrophes
    allowedQuotePairs: qPreset.pairs,
    allowedApostrophes: qPreset.apostrophes,
    quoteLocalePreset: qPreset.id,

    // Numbers & Ranges
    decimalSeparator: nPreset.decimalSeparator,
    thousandSeparator: nPreset.thousandSeparator,
    preferredRangeSymbol: nPreset.rangeSymbol,
    rangeSpacing: nPreset.rangeSpacing,
    preferredNumberSign: nPreset.numberSign,
    numberSignSpacing: nPreset.numberSignSpacing,
    digitToTextMap: nPreset.digitToTextMap.map(d => ({...d, id: crypto.randomUUID()})),
    numberLocalePreset: nPreset.id,

    // Measurements
    measurementUnits: uPreset.units.map(u => ({ id: crypto.randomUUID(), ...u })),
    measurementLocalePreset: uPreset.id,
    measurementSpacing: uPreset.spacing,
    temperatureSpacing: uPreset.tempSpacing,
    measurementRequireNbsp: uPreset.requireNbsp,

    // Letter Case
    checkInitialCapitalization: true,
    checkCamelCase: true,
    
    // Omissions
    ignoreSingleLatin: true,
    ignoreMathOnly: true,
  };
}

/**
 * Friendly name resolver for locale codes
 */
export function getLanguageName(locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(locale.split('-')[0]) || locale;
  } catch (e) {
    return locale;
  }
}
