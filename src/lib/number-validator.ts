
import { QAIssue, QASettings } from './types';
import { INTERNAL_TAG_REGEX, mapStrippedToOriginal } from './qa-utils';

export function validateNumbersAndRanges(
  source: string,
  target: string,
  settings: QASettings,
  issues: QAIssue[]
) {
  if (!settings.checkNumbersAndRanges) return;

  const tagPlaceholder = '\uFFFC';
  const sWithTags = source.replace(INTERNAL_TAG_REGEX, tagPlaceholder);
  const tWithTags = target.replace(INTERNAL_TAG_REGEX, tagPlaceholder);

  // Helper to normalize a number string based on locale settings
  const normalizeNumberString = (numStr: string): string => {
    // Determine separators based on settings
    const thousandSepChar = settings.thousandSeparator === 'dot' ? '.' : settings.thousandSeparator === 'comma' ? ',' : (settings.thousandSeparator === 'space' || settings.thousandSeparator === 'nbsp') ? ' ' : '';
    const decimalSepChar = settings.decimalSeparator === 'dot' ? '.' : ',';

    // Regex to remove thousand separators
    let cleanStr = numStr;
    if (thousandSepChar) {
      // Also handle nbsp for space setting
      const thousandSepRegex = new RegExp(`[${thousandSepChar === ' ' ? '\\s\\u00A0' : `\\${thousandSepChar}`}]`, 'g');
      cleanStr = cleanStr.replace(thousandSepRegex, '');
    }

    // Replace locale decimal separator with a standard dot
    if (decimalSepChar === ',') {
      cleanStr = cleanStr.replace(/,/g, '.');
    }

    return cleanStr;
  };

  const numRegex = /\d[\d.,\s\u00A0]*/g; // More generic number regex

  /**
   * anasoumadi: Extracts both digit-based and text-based numbers for cross-reference.
   * Handles locale-specific separators and skips imperial units in parentheses if configured.
   */
  const extractNumbers = (text: string) => {
    const results: { raw: string; index: number; length: number; normalized: string; type: 'digit' | 'text' }[] = [];

    // AS: Match digit sequences including potential separators
    const digitMatches = Array.from(text.matchAll(numRegex));
    digitMatches.forEach(m => {
      if (!/\d/.test(m[0])) return; // Skip if no actual digits present

      const normalizedValue = normalizeNumberString(m[0]);
      if (!isNaN(parseFloat(normalizedValue))) {
        results.push({ raw: m[0], index: m.index!, length: m[0].length, normalized: normalizedValue, type: 'digit' });
      }
    });

    // AS: Match text-based numbers from the digit-to-text map (e.g., "one" -> "1")
    if (settings.digitToTextEnabled && settings.digitToTextMap) {
      settings.digitToTextMap.forEach(entry => {
        entry.forms.forEach(form => {
          if (!form || form.length < 1) return;
          const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const textRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
          let m;
          while ((m = textRegex.exec(text)) !== null) {
            results.push({ raw: m[0], index: m.index, length: m[0].length, normalized: entry.digit.toString(), type: 'text' });
          }
        });
      });
    }
    return results.sort((a, b) => a.index - b.index);
  };

  const sNums = extractNumbers(sWithTags);
  const tNums = extractNumbers(tWithTags);

  // Parentheses logic for skipping imperial units
  const imperialRegex = /\(\s*\d[\d.,\s\u00A0]*(?:ft|in|mi|yd|lb|oz|'|")\s*\)/gi;
  const imperialRanges = settings.skipImperialInParens ? Array.from(sWithTags.matchAll(imperialRegex)).map(m => ({ start: m.index!, end: m.index! + m[0].length })) : [];

  const unmatchedSource = sNums.filter(sn => {
    if (imperialRanges.length > 0) {
      return !imperialRanges.some(range => sn.index >= range.start && (sn.index + sn.length) <= range.end);
    }
    return true;
  });

  const unmatchedTarget = [...tNums];

  // Perform matching
  for (let i = unmatchedSource.length - 1; i >= 0; i--) {
    const sn = unmatchedSource[i];
    // Use parseFloat for comparison to handle cases like 2 vs 2.0 and .5 vs 0.5
    const matchIdx = unmatchedTarget.findIndex(tn => parseFloat(tn.normalized) === parseFloat(sn.normalized));
    if (matchIdx !== -1) {
      unmatchedSource.splice(i, 1);
      unmatchedTarget.splice(matchIdx, 1);
    }
  }

  // Report issues if there are any remaining unmatched numbers
  if (unmatchedSource.length > 0 || unmatchedTarget.length > 0) {
    const sourceHighlights = unmatchedSource.map(sn => mapStrippedToOriginal(sn.index, sn.length, source, INTERNAL_TAG_REGEX));
    const targetHighlights = unmatchedTarget.map(tn => mapStrippedToOriginal(tn.index, tn.length, target, INTERNAL_TAG_REGEX));

    issues.push({
      id: crypto.randomUUID(),
      type: 'error',
      message: 'Inconsistent numbers in source and target.',
      code: 'Inconsistent numbers in source and target',
      ruleId: 'checkNumbersAndRanges',
      sourceHighlights,
      targetHighlights
    });
  }

  // Validate formatting in target
  if (settings.numberFormattingEnabled) {
    const formattingHighlights: { start: number, end: number }[] = [];
    let message = '';
    tNums.filter(tn => tn.type === 'digit').forEach(tn => {
      let isInvalid = false;
      const decimalSepChar = settings.decimalSeparator === 'dot' ? '.' : ',';
      const thousandSepChar = settings.thousandSeparator === 'dot' ? '.' : settings.thousandSeparator === 'comma' ? ',' : (settings.thousandSeparator === 'space' || settings.thousandSeparator === 'nbsp') ? ' ' : '';

      const incorrectDecimal = decimalSepChar === '.' ? ',' : '.';
      if (tn.raw.includes(incorrectDecimal)) {
        isInvalid = true;
        message = `Incorrect decimal separator: expected "${decimalSepChar}".`;
      }

      const numberParts = tn.raw.split(decimalSepChar);
      const integerPart = numberParts[0];

      if (!isInvalid && thousandSepChar && integerPart.length > 3) {
        const incorrectThousandSep = thousandSepChar === '.' ? ',' : (thousandSepChar === ',' ? '.' : ''); // Simple opposition
        if (incorrectThousandSep && integerPart.includes(incorrectThousandSep)) {
          isInvalid = true;
          message = `Incorrect thousand separator found.`;
        } else if (settings.thousandSeparator1000 === 'require') {
          const cleanedInteger = integerPart.replace(/[\s\u00A0]/g, '');
          if (cleanedInteger.length > 3 && !integerPart.includes(thousandSepChar)) {
            isInvalid = true;
            message = `Thousand separator '${thousandSepChar}' required.`;
          }
        }
      }

      if (isInvalid) {
        formattingHighlights.push(mapStrippedToOriginal(tn.index, tn.length, target, INTERNAL_TAG_REGEX));
      }
    });

    if (formattingHighlights.length > 0) {
      issues.push({ id: crypto.randomUUID(), type: 'warning', message: message || 'Invalid number formatting.', code: 'Invalid number formatting', ruleId: 'numberFormattingEnabled', targetHighlights: formattingHighlights });
    }
  }

  // Validate ranges
  if (settings.checkRanges) {
    const escapedPreferred = settings.preferredRangeSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rangeSymbols = `[${escapedPreferred}\\-à~–—]`;

    const rangeRegex = new RegExp(`(\\d+)\\s*(${rangeSymbols})\\s*(\\d+)`, 'g');
    const tRanges = Array.from(tWithTags.matchAll(rangeRegex));
    const rangeHighlights: { start: number, end: number }[] = [];

    tRanges.forEach(tm => {
      const symbol = tm[2];
      const isSpaced = tm[0].includes(` ${symbol} `);

      if (symbol !== settings.preferredRangeSymbol) {
        rangeHighlights.push(mapStrippedToOriginal(tm.index!, tm[0].length, target, INTERNAL_TAG_REGEX));
      } else if ((settings.rangeSpacing === 'space' && !isSpaced) || (settings.rangeSpacing === 'no-space' && isSpaced)) {
        rangeHighlights.push(mapStrippedToOriginal(tm.index!, tm[0].length, target, INTERNAL_TAG_REGEX));
      }
    });

    if (rangeHighlights.length > 0) {
      issues.push({ id: crypto.randomUUID(), type: 'warning', message: 'Invalid format of number range.', code: 'Invalid format of number range', ruleId: 'checkRanges', targetHighlights: rangeHighlights });
    }
  }
}
