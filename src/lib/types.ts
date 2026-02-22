
// AS: Essential tag types for TMX/XLIFF processing
export type TmxTagType = 'bpt' | 'ept' | 'ph' | 'it' | 'ut' | 'sub' | 'x';

export interface TmxTag {
  id: string;
  type: TmxTagType;
  content: string;
  index?: string;
}

// anasoumadi: Represents a segment of text with its associated tags
export interface TranslationSegment {
  text: string;
  tags: TmxTag[];
}

export type TUStatus = 'translated' | 'empty' | 'approved';

// AS: Detailed issue structure for QA reporting
export interface QAIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  code: string;
  ruleId?: string;
  groupId?: string;
  isIgnored?: boolean;
  ignoredBy?: string;
  sourceHighlights?: { start: number, end: number }[];
  targetHighlights?: { start: number, end: number }[];
}

export interface PunctuationGrid {
  spaceBefore: string;
  spaceAfter: string;
  noSpaceBefore: string;
  noSpaceAfter: string;
  nbspBefore: string;
  nbspAfter: string;
}

export interface QuotePair {
  open: string;
  close: string;
}

export interface MeasurementUnit {
  id: string;
  name: string;
  targetUnit: string;
}

export interface DigitToTextEntry {
  id: string;
  digit: number;
  forms: string[];
}

export interface ConsistencyRuleOptions {
  enabled: boolean;
  ignoreSpaceTypes: boolean;
  ignoreCase: boolean;
  checkWithoutTags: boolean;
  ignoreNumbers: boolean;
  ignorePluralEnglish: boolean;
  ignorePunctuation: boolean;
}

export type UserCheckCondition = 'both_found' | 'source_found_target_missing' | 'target_found_source_missing' | 'both_regex_match';

export interface UserDefinedCheck {
  id: string;
  enabled: boolean;
  title: string;
  sourcePattern: string;
  sourceOptions: {
    caseSensitive: boolean;
    wholeWord: boolean;
    isRegex: boolean;
  };
  targetPattern: string;
  targetOptions: {
    caseSensitive: boolean;
    wholeWord: boolean;
    isRegex: boolean;
  };
  condition: UserCheckCondition;
  languages: string[];
  group: string;
}

export interface QASettings {
  checkEmpty: boolean;
  checkSameAsSource: boolean;
  ignoreSingleLatin: boolean;
  ignoreMathOnly: boolean;
  checkPartialTranslation: boolean;
  minWordsPartial: number;
  ignoreWordsWithNumbersHyphens: boolean;
  checkSentenceCount: boolean;
  checkInitialCapitalization: boolean;
  checkCamelCase: boolean;
  checkMixedScripts: boolean;
  checkAllUpper: boolean;
  checkSpecialCase: boolean;
  specialCases: string[];
  checkMultipleSpaces: boolean;
  ignoreSourceFormatting: boolean;
  checkEndPunctuation: boolean;
  ignoreQuotesBracketsEnd: boolean;
  checkDoublePunctuation: boolean;
  doublePuncAsInSource: boolean;
  checkStartEndSpaces: boolean;
  checkBrackets: boolean;
  ignoreMoreLessThanBrackets: boolean;
  ignoreUnmatchedBracketsSource: boolean;
  checkQuotes: boolean;
  checkApostrophes: boolean;
  allowedQuotePairs: QuotePair[];
  allowedApostrophes: string[];
  quoteLocalePreset: string;
  punctuationGrid: PunctuationGrid;
  specialSignsGrid: PunctuationGrid;
  checkMeasurementUnits: boolean;
  ignoreCustomUnits: boolean;
  measurementUnits: MeasurementUnit[];
  measurementSpacing: 'space' | 'no-space';
  measurementRequireNbsp: boolean;
  temperatureSpacing: 'space' | 'no-space';
  temperatureRequireNbsp: boolean;
  measurementLocalePreset: string;
  checkNumbersAndRanges: boolean;
  ignoreNumbersRegex: string;
  digitToTextEnabled: boolean;
  digitToTextMap: DigitToTextEntry[];
  skipImperialInParens: boolean;
  omitStartEndZeros: boolean;
  numberFormattingEnabled: boolean;
  strictNumberSpacing: boolean;
  allowLeadingZeros: boolean;
  textNumberSpacing: 'space' | 'no-space';
  checkNumberSign: boolean;
  preferredNumberSign: string;
  numberSignSpacing: 'space' | 'no-space';
  checkRanges: boolean;
  preferredRangeSymbol: string;
  rangeSpacing: 'space' | 'no-space';
  decimalSeparator: 'dot' | 'comma';
  thousandSeparator: 'space' | 'comma' | 'dot' | 'nbsp' | 'none';
  thousandSeparator1000: 'require' | 'disallow';
  checkNumbersOrder: boolean;
  numberLocalePreset: string;
  checkNumbers: boolean;
  checkMathSigns: boolean;
  checkTemperatureSigns: boolean;
  checkTags: boolean;
  checkTagOrder: boolean;
  checkTagSpacing: boolean;
  checkTagSpacingInconsistency: boolean;
  checkEntities: boolean;
  checkInconsistency: boolean;
  targetInconsistencyOptions: ConsistencyRuleOptions;
  sourceInconsistencyOptions: ConsistencyRuleOptions;
  checkRepeatedWords: boolean;
  checkUrls: boolean;
  checkLengthLimit: boolean;
  lengthLimitPercent: number;
  checkUntranslatables: boolean;
  untranslatables: string[];
  untranslatableScope: 'source' | 'target' | 'both';
  checkUntranslatableCount: boolean;
  includeTechnical: boolean;
  includeMixedCase: boolean;
  includeUpperCase: boolean;
  ignoreSpaceTypes: boolean;
  checkForbiddenWords: boolean;
  ignoreForbiddenIfInSource: boolean;
  forbiddenWords: string[];
  checkTerminology: boolean;
  checkTermCount: boolean;
  skipUntranslatablesInTerm: boolean;
  checkTermTags: boolean;
  reverseTermCheck: boolean;
  detectForbiddenTerms: boolean;
  activeGlossaryIds: string[];
  userDefinedChecks: UserDefinedCheck[];
}

export interface QAProfile {
  id: string;
  profileName: string;
  targetLocale: string;
  clientName?: string;
  version: string;
  lastModified: string;
  settings: QASettings;
}

export interface GlossaryTerm {
  id: string;
  source: string;
  target: string;
  isForbidden?: boolean;
  note?: string;
}

// anasoumadi: A glossary is a collection of terminology pairs
export interface Glossary {
  id: string;
  name: string;
  terms: GlossaryTerm[];
  createdAt: Date;
  sourceLang?: string;
  targetLang?: string;
}

// AS: The central unit of translation work
export interface TranslationUnit {
  id: string;
  tu_id: string;
  order: number;
  source: TranslationSegment;
  target: TranslationSegment;
  status: TUStatus;
  metadata: Record<string, any>;
  lastModified?: Date;
  lastModifiedBy?: string;
  projectId: string;
  fileId: string;
  sourceLang: string;
  targetLang: string;
  qaIssues?: QAIssue[];
  isLocked?: boolean;
  note?: string;
}

export type ProjectType = 'monolingual' | 'multilingual';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  sourceLang: string;
  targetLangs: string[];
  fileCount: number;
  segmentCount: number;
  lastOpened: Date;
  createdAt: Date;
  activeProfileId?: string;
  completion?: number;
}

export type SupportedFileFormat = 'tmx' | 'xliff' | 'sdlxliff' | 'mqxliff' | 'mxliff' | 'mqxlz' | 'xlsx' | 'unknown';

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  format: SupportedFileFormat;
  sourceLang: string;
  targetLang: string;
  segmentCount: number;
  size: number;
  createdAt: Date;
  rawContent?: string;
}

export interface CleanupConfig {
  removeEmpty: boolean;
  removeUntranslated: boolean;
  cleanXmlEntities: boolean;
  stripControlChars: boolean;
  trimWhitespace: boolean;
  normalizeSpacing: boolean;
  fixPunctuationSpacing: boolean;
  smartQuotes: boolean;
  stripAllTags: boolean;
  autoCloseTags: boolean;
  removeOrphanTags: boolean;
  liftOuterTags: boolean;
  deleteExactDuplicates: boolean;
  anonymizeUsers: boolean;
  batchDateUpdate: boolean;
  customRegexEnabled: boolean;
  customRegexFind: string;
  customRegexReplace: string;
}

export interface CleanupReport {
  modified: number;
  deleted: number;
  duplicatesRemoved: number;
  tagsFixed: number;
  metadataUpdated: number;
}

export interface BatchRule {
  id: string;
  find: string;
  replace: string;
  isRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  diacriticSensitive: boolean;
}

export interface BatchConfig {
  scope: 'target' | 'source' | 'both';
  onlyFiltered: boolean;
  rules: BatchRule[];
  metadataUpdates: {
    updateUser: boolean;
    userName: string;
    updateDate: boolean;
  };
}

export type BuiltInFilterType = 'all' | 'same' | 'inconsistency' | 'source_inconsistency' | 'repetitions' | 'comments' | 'invalid' | 'untranslated' | 'custom';

export type FilterScope = 'source' | 'target' | 'comment' | 'metadata.creationid' | 'metadata.changedate' | 'metadata.creationdate' | 'status';
export type FilterOperator = 'contains' | 'excludes' | 'equal' | 'not_equal';

export interface CustomFilterCondition {
  id: string;
  scope: FilterScope;
  operator: FilterOperator;
  value: string;
}

export interface CustomFilter {
  id: string;
  name: string;
  conditions: CustomFilterCondition[];
  matchType: 'and' | 'or';
}

export interface LanguageSet {
  src: string;
  tgt: string;
}
