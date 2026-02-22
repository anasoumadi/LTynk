import { z } from 'zod';

const PunctuationGridSchema = z.object({
  spaceBefore: z.string(),
  spaceAfter: z.string(),
  noSpaceBefore: z.string(),
  noSpaceAfter: z.string(),
  nbspBefore: z.string(),
  nbspAfter: z.string(),
});

const QuotePairSchema = z.object({
  open: z.string(),
  close: z.string(),
});

const MeasurementUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetUnit: z.string(),
});

const DigitToTextEntrySchema = z.object({
  id: z.string(),
  digit: z.number(),
  forms: z.array(z.string()),
});

const ConsistencyRuleOptionsSchema = z.object({
  enabled: z.boolean(),
  ignoreSpaceTypes: z.boolean(),
  ignoreCase: z.boolean(),
  checkWithoutTags: z.boolean(),
  ignoreNumbers: z.boolean(),
  ignorePluralEnglish: z.boolean(),
  ignorePunctuation: z.boolean(),
});

const UserDefinedCheckSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  title: z.string(),
  sourcePattern: z.string(),
  sourceOptions: z.object({
    caseSensitive: z.boolean(),
    wholeWord: z.boolean(),
    isRegex: z.boolean(),
  }),
  targetPattern: z.string(),
  targetOptions: z.object({
    caseSensitive: z.boolean(),
    wholeWord: z.boolean(),
    isRegex: z.boolean(),
  }),
  condition: z.enum(['both_found', 'source_found_target_missing', 'target_found_source_missing', 'both_regex_match']),
  languages: z.array(z.string()),
  group: z.string(),
});

const QASettingsSchema = z.object({
  checkEmpty: z.boolean(),
  checkSameAsSource: z.boolean(),
  ignoreSingleLatin: z.boolean(),
  ignoreMathOnly: z.boolean(),
  checkPartialTranslation: z.boolean(),
  minWordsPartial: z.number(),
  ignoreWordsWithNumbersHyphens: z.boolean(),
  checkSentenceCount: z.boolean(),
  checkInitialCapitalization: z.boolean(),
  checkCamelCase: z.boolean(),
  checkAllUpper: z.boolean(),
  checkSpecialCase: z.boolean(),
  specialCases: z.array(z.string()),
  checkMultipleSpaces: z.boolean(),
  ignoreSourceFormatting: z.boolean(),
  checkEndPunctuation: z.boolean(),
  ignoreQuotesBracketsEnd: z.boolean(),
  checkDoublePunctuation: z.boolean(),
  doublePuncAsInSource: z.boolean(),
  checkStartEndSpaces: z.boolean(),
  checkBrackets: z.boolean(),
  ignoreMoreLessThanBrackets: z.boolean(),
  ignoreUnmatchedBracketsSource: z.boolean(),
  checkQuotes: z.boolean(),
  checkApostrophes: z.boolean(),
  allowedQuotePairs: z.array(QuotePairSchema),
  allowedApostrophes: z.array(z.string()),
  quoteLocalePreset: z.string(),
  punctuationGrid: PunctuationGridSchema,
  specialSignsGrid: PunctuationGridSchema,
  checkMeasurementUnits: z.boolean(),
  ignoreCustomUnits: z.boolean(),
  measurementUnits: z.array(MeasurementUnitSchema),
  measurementSpacing: z.enum(['space', 'no-space']),
  measurementRequireNbsp: z.boolean(),
  temperatureSpacing: z.enum(['space', 'no-space']),
  temperatureRequireNbsp: z.boolean(),
  measurementLocalePreset: z.string(),
  checkNumbersAndRanges: z.boolean(),
  ignoreNumbersRegex: z.string(),
  digitToTextEnabled: z.boolean(),
  digitToTextMap: z.array(DigitToTextEntrySchema),
  skipImperialInParens: z.boolean(),
  omitStartEndZeros: z.boolean(),
  numberFormattingEnabled: z.boolean(),
  strictNumberSpacing: z.boolean(),
  allowLeadingZeros: z.boolean(),
  textNumberSpacing: z.enum(['space', 'no-space']),
  checkNumberSign: z.boolean(),
  preferredNumberSign: z.string(),
  numberSignSpacing: z.enum(['space', 'no-space']),
  checkRanges: z.boolean(),
  preferredRangeSymbol: z.string(),
  rangeSpacing: z.enum(['space', 'no-space']),
  decimalSeparator: z.enum(['dot', 'comma']),
  thousandSeparator: z.enum(['space', 'comma', 'dot', 'nbsp', 'none']),
  thousandSeparator1000: z.enum(['require', 'disallow']),
  checkNumbersOrder: z.boolean(),
  numberLocalePreset: z.string(),
  checkNumbers: z.boolean(),
  checkMathSigns: z.boolean(),
  checkTemperatureSigns: z.boolean(),
  checkTags: z.boolean(),
  checkTagOrder: z.boolean(),
  checkTagSpacing: z.boolean(),
  checkTagSpacingInconsistency: z.boolean(),
  checkEntities: z.boolean(),
  checkInconsistency: z.boolean(),
  targetInconsistencyOptions: ConsistencyRuleOptionsSchema,
  sourceInconsistencyOptions: ConsistencyRuleOptionsSchema,
  checkMixedScripts: z.boolean(),
  checkRepeatedWords: z.boolean(),
  checkUrls: z.boolean(),
  checkLengthLimit: z.boolean(),
  lengthLimitPercent: z.number(),
  checkUntranslatables: z.boolean(),
  untranslatables: z.array(z.string()),
  untranslatableScope: z.enum(['source', 'target', 'both']),
  checkUntranslatableCount: z.boolean(),
  includeTechnical: z.boolean(),
  includeMixedCase: z.boolean(),
  includeUpperCase: z.boolean(),
  ignoreSpaceTypes: z.boolean(),
  checkForbiddenWords: z.boolean(),
  ignoreForbiddenIfInSource: z.boolean(),
  forbiddenWords: z.array(z.string()),
  checkTerminology: z.boolean(),
  checkTermCount: z.boolean(),
  skipUntranslatablesInTerm: z.boolean(),
  checkTermTags: z.boolean(),
  reverseTermCheck: z.boolean(),
  detectForbiddenTerms: z.boolean(),
  activeGlossaryIds: z.array(z.string()),
  userDefinedChecks: z.array(UserDefinedCheckSchema),
});

export const QAProfileSchema = z.object({
  id: z.string(),
  profileName: z.string(),
  targetLocale: z.string(),
  clientName: z.string().optional(),
  version: z.string(),
  lastModified: z.string(),
  settings: QASettingsSchema,
});

export type ValidatedQAProfile = z.infer<typeof QAProfileSchema>;

export function validateQAProfile(data: any): ValidatedQAProfile | null {
  try {
    return QAProfileSchema.parse(data);
  } catch (error) {
    console.error('QA Profile Validation Failed:', error);
    return null;
  }
}
