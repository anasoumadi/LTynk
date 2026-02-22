

import { TranslationUnit, QAIssue, GlossaryTerm, QASettings } from './types';
import { getSettingsForLocale } from './locale-registry';
import { validateUntranslatables } from './untranslatable-logic';
import { validateForbiddenWords } from './forbidden-words-validator';
import { validateLetterCase } from './letter-case-validator';
import { validatePunctuationAndSpacing } from './punctuation-validator';
import { validateQuotesAndApostrophes } from './quote-validator';
import { validateMeasurements } from './measurement-validator';
import { validateTags } from './tag-validator';
import { validateNumbersAndRanges } from './number-validator';
import { validateTerminology } from './terminology-validator';
import { validateUserCheck } from './custom-rule-validator';

export const DEFAULT_QA_SETTINGS: QASettings = {
  checkEmpty: true,
  checkSameAsSource: true,
  ignoreSingleLatin: true,
  ignoreMathOnly: true,
  checkPartialTranslation: false,
  minWordsPartial: 4,
  ignoreWordsWithNumbersHyphens: true,
  checkSentenceCount: true,
  checkInitialCapitalization: true,
  checkCamelCase: true,
  checkMixedScripts: true,
  checkAllUpper: false,
  checkSpecialCase: false,
  specialCases: [],
  checkMultipleSpaces: true,
  ignoreSourceFormatting: false,
  checkEndPunctuation: true,
  ignoreQuotesBracketsEnd: true,
  checkDoublePunctuation: true,
  doublePuncAsInSource: true,
  checkStartEndSpaces: true,
  checkBrackets: true,
  ignoreMoreLessThanBrackets: true,
  ignoreUnmatchedBracketsSource: true,
  checkQuotes: true,
  checkApostrophes: true,
  allowedQuotePairs: [
    { open: '“', close: '”' },
    { open: '‘', close: '’' }
  ],
  allowedApostrophes: ['’'],
  quoteLocalePreset: 'en-US',
  punctuationGrid: {
    spaceBefore: '',
    spaceAfter: '',
    noSpaceBefore: '.,!?:;',
    noSpaceAfter: '',
    nbspBefore: '',
    nbspAfter: ''
  },
  specialSignsGrid: {
    spaceBefore: '',
    spaceAfter: '',
    noSpaceBefore: '',
    noSpaceAfter: '',
    nbspBefore: '',
    nbspAfter: ''
  },
  checkMeasurementUnits: true,
  ignoreCustomUnits: false,
  measurementUnits: [],
  measurementSpacing: 'space',
  measurementRequireNbsp: true,
  temperatureSpacing: 'no-space',
  temperatureRequireNbsp: false,
  measurementLocalePreset: 'en-US',
  checkNumbersAndRanges: true,
  ignoreNumbersRegex: '',
  digitToTextEnabled: true,
  digitToTextMap: [
    { id: '1', digit: 1, forms: ['one', 'un', 'une'] },
    { id: '2', digit: 2, forms: ['two', 'deux'] },
    { id: '3', digit: 3, forms: ['three', 'trois'] }
  ],
  skipImperialInParens: true,
  omitStartEndZeros: true,
  numberFormattingEnabled: true,
  strictNumberSpacing: true,
  allowLeadingZeros: false,
  textNumberSpacing: 'space',
  checkNumberSign: true,
  preferredNumberSign: '№',
  numberSignSpacing: 'space',
  checkRanges: true,
  preferredRangeSymbol: '-',
  rangeSpacing: 'no-space',
  decimalSeparator: 'dot',
  thousandSeparator: 'comma',
  thousandSeparator1000: 'require',
  checkNumbersOrder: true,
  numberLocalePreset: 'en-US',
  checkNumbers: false,
  checkMathSigns: true,
  checkTemperatureSigns: true,
  checkTags: true,
  checkTagOrder: true,
  checkTagSpacing: true,
  checkTagSpacingInconsistency: true,
  checkEntities: true,
  checkInconsistency: true,
  targetInconsistencyOptions: {
    enabled: true,
    ignoreSpaceTypes: true,
    ignoreCase: true,
    checkWithoutTags: true,
    ignoreNumbers: false,
    ignorePluralEnglish: false,
    ignorePunctuation: false,
  },
  sourceInconsistencyOptions: {
    enabled: false,
    ignoreSpaceTypes: true,
    ignoreCase: true,
    checkWithoutTags: true,
    ignoreNumbers: false,
    ignorePluralEnglish: false,
    ignorePunctuation: false,
  },
  checkRepeatedWords: true,
  checkUrls: true,
  checkLengthLimit: false,
  lengthLimitPercent: 20,
  checkUntranslatables: true,
  untranslatables: [],
  untranslatableScope: 'both',
  checkUntranslatableCount: true,
  includeTechnical: true,
  includeMixedCase: true,
  includeUpperCase: true,
  ignoreSpaceTypes: true,
  checkForbiddenWords: false,
  ignoreForbiddenIfInSource: true,
  forbiddenWords: [],
  checkTerminology: true,
  checkTermCount: true,
  skipUntranslatablesInTerm: true,
  checkTermTags: false,
  reverseTermCheck: false,
  detectForbiddenTerms: true,
  activeGlossaryIds: [],
  userDefinedChecks: [],
};

// anasoumadi: This regex catches all common TMX/XLIFF tag types for internal processing
export const INTERNAL_TAG_REGEX = /\[(?:bpt|ept|ph|it|ut|sub|x|g|bx|ex|mrk|sc|ec).*?_\d+\]/g;

function stripTags(text: string): string {
  // Use a unique marker character that is treated as a single visual unit
  return text.replace(INTERNAL_TAG_REGEX, '\uFFFC');
}

/**
 * AS: Orchestrates the full QA check suite on a Translation Unit.
 * We run through letter case, punctuation, tags, terminology, and more.
 * This function is the central entry point for linguistic verification.
 */
export function runQA(tu: TranslationUnit, settings: QASettings, glossary: GlossaryTerm[] = [], targetLang: string = 'en-US'): QAIssue[] {
  if (tu.isLocked) return [];

  const issues: QAIssue[] = [];

  validateOmissions(tu, settings, issues);

  // anasoumadi: If the target is empty, we only run critical structural checks like tags.
  if (!tu.target.text.trim() && !settings.checkEndPunctuation && !settings.checkTags) {
    return issues;
  }

  validateLetterCase(tu.source.text, tu.target.text, settings, targetLang, issues);
  validatePunctuationAndSpacing(tu.source.text, tu.target.text, settings, issues);
  validateQuotesAndApostrophes(tu.source.text, tu.target.text, settings, issues);
  validateTags(tu, settings, issues);
  validateMeasurements(tu.source.text, tu.target.text, settings, issues);
  validateNumbersAndRanges(tu.source.text, tu.target.text, settings, issues);
  validateMisc(tu.source.text, tu.target.text, settings, issues);
  validateTerminology(tu.source.text, tu.target.text, settings, glossary, issues);
  validateUntranslatables(tu, settings, issues);
  validateForbiddenWords(tu.source.text, tu.target.text, settings, issues);

  if (settings.userDefinedChecks && settings.userDefinedChecks.length > 0) {
    settings.userDefinedChecks.forEach(check => {
      validateUserCheck(tu, check, issues);
    });
  }

  return issues;
}

// AS: Checks for missing translations, "same as source" errors, and partial translations.
function validateOmissions(tu: TranslationUnit, settings: QASettings, issues: QAIssue[]) {
  const sourceText = tu.source.text.trim();
  const targetText = tu.target.text.trim();
  const cleanSource = stripTags(sourceText).replace(/\uFFFC/g, '').trim();
  const cleanTarget = stripTags(targetText).replace(/\uFFFC/g, '').trim();

  if (settings.checkEmpty && targetText.length === 0) {
    if (tu.status !== 'empty') {
      issues.push({ id: crypto.randomUUID(), type: 'error', message: 'Segment is finished but target content is missing.', code: 'No translation in target', ruleId: 'checkEmpty' });
    }
  }

  if (settings.checkSameAsSource && cleanSource.length > 0 && cleanSource === cleanTarget) {
    const isMathOnly = (str: string) => /^[\d\s\+\-\*\/\=\%\.\,]+$/.test(str);

    // anasoumadi: Tiny strings (1 char) are often ignored to avoid noise.
    if (cleanSource.length <= 1) {
      // skip same-as-source only; continue to other checks
    } else if (settings.ignoreMathOnly && isMathOnly(cleanSource)) {
      // skip same-as-source only; continue to other checks
    } else {
      issues.push({ id: crypto.randomUUID(), type: 'warning', message: 'Target text is identical to source text.', code: 'Same source and target', ruleId: 'checkSameAsSource' });
    }
  }

  if (settings.checkPartialTranslation) {
    const sWords = cleanSource.split(/\s+/).filter(w => {
      if (!w) return false;
      if (settings.ignoreWordsWithNumbersHyphens && (/\d/.test(w) || w.includes('-'))) return false;
      return w.length > 1;
    });
    if (sWords.length >= settings.minWordsPartial) {
      const tWords = new Set(cleanTarget.toLowerCase().split(/\s+/));
      let overlapCount = 0;
      sWords.forEach(w => { if (tWords.has(w.toLowerCase())) overlapCount++; });
      const overlapRatio = overlapCount / sWords.length;

      // AS: 70% overlap is a good heuristic for flagging unfinished segments.
      if (overlapRatio > 0.7 && cleanSource !== cleanTarget && overlapCount > 0) {
        issues.push({ id: crypto.randomUUID(), type: 'warning', message: 'Segment appears to be only partially translated.', code: 'Partially translated segment', ruleId: 'checkPartialTranslation' });
      }
    }
  }

  if (settings.checkSentenceCount) {
    const sentenceRegex = /[.!?。？]+/g;
    const sCount = (sourceText.match(sentenceRegex) || []).length;
    const tCount = (targetText.match(sentenceRegex) || []).length;
    if (sCount !== tCount && sCount > 0) {
      issues.push({ id: crypto.randomUUID(), type: 'warning', message: `Sentence count mismatch (Source: ${sCount}, Target: ${tCount}).`, code: 'Different number of sentences', ruleId: 'checkSentenceCount' });
    }
  }
}

function validateMisc(source: string, target: string, settings: QASettings, issues: QAIssue[]) {
  if (settings.checkRepeatedWords) {
    const repeatRegex = /\b(\w+)\s+\1\b/gi;
    const tMatches = Array.from(target.replace(INTERNAL_TAG_REGEX, ' ').matchAll(repeatRegex));
    const sText = source.replace(INTERNAL_TAG_REGEX, ' ');

    tMatches.forEach(match => {
      const repeatedWord = match[1];
      const sourceRepeatRegex = new RegExp(`\\b${escapeRegExp(repeatedWord)}\\s+${escapeRegExp(repeatedWord)}\\b`, 'i');

      if (!sourceRepeatRegex.test(sText)) {
        const alreadyExists = issues.some(issue => issue.ruleId === 'checkRepeatedWords' && issue.message.includes(`"${repeatedWord}"`));
        if (!alreadyExists) {
          issues.push({ id: crypto.randomUUID(), type: 'warning', message: `Repeated adjacent words detected: "${repeatedWord}"`, code: 'Repeated adjacent words', ruleId: 'checkRepeatedWords' });
        }
      }
    });
  }

  if (settings.checkUrls) {
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
    const sUrls = Array.from(source.matchAll(urlRegex)).map(m => m[0]).sort().join('|');
    const tUrls = Array.from(target.matchAll(urlRegex)).map(m => m[0]).sort().join('|');
    if (sUrls !== tUrls) {
      issues.push({ id: crypto.randomUUID(), type: 'error', message: 'URL mismatch: Web links must match source exactly.', code: 'Inconsistent URLs', ruleId: 'checkUrls' });
    }
  }

  if (settings.checkMixedScripts) {
    const hasLatin = (word: string) => /[a-zA-Z]/.test(word);
    const hasCyrillic = (word: string) => /[а-яА-Я]/.test(word);
    const isTechnical = (word: string) => /\d/.test(word) || /[-_]/.test(word);
    const isUrlPart = (word: string) => word.includes('http') || word.includes('www');

    const words = target.replace(INTERNAL_TAG_REGEX, ' ').split(/[\s.,;!?()"“„«”»'’]+/);
    const flaggedWords = new Set<string>();

    words.forEach(word => {
      if (word.length > 1 && hasLatin(word) && hasCyrillic(word) && !isTechnical(word) && !isUrlPart(word)) {
        flaggedWords.add(word);
      }
    });

    if (flaggedWords.size > 0) {
      issues.push({
        id: crypto.randomUUID(),
        type: 'error',
        message: `Potential mixed-script typo detected in word(s): "${Array.from(flaggedWords).join('", "')}"`,
        code: 'Mixed script word',
        ruleId: 'checkMixedScripts'
      });
    }
  }
}

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mapStrippedToOriginal(index: number, length: number, originalText: string, tagRegex: RegExp): { start: number, end: number } {
  const localRegex = new RegExp(tagRegex.source, 'g');
  const matches = Array.from(originalText.matchAll(localRegex));
  let strippedPos = 0;
  let originalPos = 0;
  let startOffset = -1;
  let endOffset = -1;
  let matchIdx = 0;

  while (originalPos <= originalText.length) {
    if (strippedPos === index && startOffset === -1) startOffset = originalPos;
    if (strippedPos === index + length && endOffset === -1) endOffset = originalPos;
    if (startOffset !== -1 && endOffset !== -1) break;
    if (originalPos === originalText.length) break;

    if (matchIdx < matches.length && originalPos === matches[matchIdx].index) {
      const tagContent = matches[matchIdx][0];
      originalPos += tagContent.length;
      strippedPos += 1;
      matchIdx++;
    } else {
      originalPos += 1;
      strippedPos += 1;
    }
  }

  return {
    start: startOffset === -1 ? originalText.length : startOffset,
    end: endOffset === -1 ? originalText.length : endOffset
  };
}
